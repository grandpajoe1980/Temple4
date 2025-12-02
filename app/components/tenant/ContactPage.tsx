"use client"

import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaGlobe } from 'react-icons/fa';
import { FaTiktok, FaXTwitter } from 'react-icons/fa6';

interface ContactPageProps {
  tenant: {
    id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    contactEmail?: string | null;
    phoneNumber?: string | null;
    branding?: {
      facebookUrl?: string | null;
      instagramUrl?: string | null;
      twitterUrl?: string | null;
      xUrl?: string | null;
      tiktokUrl?: string | null;
      youtubeUrl?: string | null;
      websiteUrl?: string | null;
      linkedInUrl?: string | null;
      socialLinks?: Array<{ platform: string; url: string; label?: string; showInFooter?: boolean } | null> | null;
      customLinks?: Array<{ label: string; url: string; showInFooter?: boolean } | null> | null;
    } | null;
  };
  initialServiceName?: string;
}

const ContactPage: React.FC<ContactPageProps> = ({ tenant, initialServiceName }) => {
  const serviceMessage = initialServiceName
    ? `Hi there! I'm interested in learning more about ${initialServiceName}.`
    : '';
  const [formState, setFormState] = useState({ name: '', email: '', message: serviceMessage });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const resetForm = () => {
    setFormState({ name: '', email: '', message: serviceMessage });
  };

  useEffect(() => {
    setFormState((prev) => ({ ...prev, message: serviceMessage }));
  }, [serviceMessage]);

  const addressString = [tenant.address.street, tenant.address.city, tenant.address.state, tenant.address.country, tenant.address.postalCode].filter(Boolean).join(', ');
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSy...&q=${encodeURIComponent(addressString)}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/contact-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to send message');
      }

      setIsSubmitted(true);
      resetForm();
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const branding = tenant.branding;

  const socialIconMap: Record<string, React.ReactNode> = {
    facebook: <FaFacebook size={24} />,
    instagram: <FaInstagram size={24} />,
    twitter: <FaTwitter size={24} />,
    x: <FaXTwitter size={24} />,
    youtube: <FaYoutube size={24} />,
    linkedin: <FaLinkedin size={24} />,
    tiktok: <FaTiktok size={24} />,
    website: <FaGlobe size={24} />,
    custom: <FaGlobe size={24} />,
  };

  const normalizeLinks = () => {
    if (!branding) return [] as Array<{ url: string; ariaLabel: string; icon: React.ReactNode; showInFooter: boolean }>;

    const structuredSocial = Array.isArray(branding.socialLinks)
      ? branding.socialLinks.filter((link): link is NonNullable<typeof link> => Boolean(link))
      : [];

    const customLinks = Array.isArray(branding.customLinks)
      ? branding.customLinks.filter((link): link is NonNullable<typeof link> => Boolean(link))
      : [];

    const baseLinks: Array<{ platform: string; url?: string | null; label?: string; showInFooter?: boolean }> = [
      { platform: 'facebook', url: branding.facebookUrl },
      { platform: 'instagram', url: branding.instagramUrl },
      { platform: 'twitter', url: branding.twitterUrl },
      { platform: 'x', url: branding.xUrl ?? branding.twitterUrl },
      { platform: 'youtube', url: branding.youtubeUrl },
      { platform: 'linkedin', url: branding.linkedInUrl },
      { platform: 'tiktok', url: branding.tiktokUrl },
      { platform: 'website', url: branding.websiteUrl, label: 'Website' },
      ...structuredSocial,
      ...customLinks.map((link) => ({ platform: 'custom', url: link.url, label: link.label, showInFooter: link.showInFooter })),
    ];

    return baseLinks
      .filter((link) => !!link.url)
      .map((link) => ({
        url: link.url as string,
        ariaLabel: link.label ?? link.platform,
        icon: socialIconMap[link.platform] ?? <FaGlobe size={24} />,
        showInFooter: link.showInFooter ?? true,
      }))
      .filter((link) => link.showInFooter);
  };

  const socialLinks = normalizeLinks();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Info & Map */}
      <div className="md:col-span-1 space-y-8">
        <Card title="Contact Information">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-500">Address</h4>
              <p className="text-gray-800">{tenant.address.street}</p>
              <p className="text-gray-800">{[tenant.address.city, tenant.address.state, tenant.address.postalCode].filter(Boolean).join(', ')}</p>
            </div>
            {tenant.contactEmail && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                <a href={`mailto:${tenant.contactEmail}`} className="text-amber-600 hover:underline">{tenant.contactEmail}</a>
              </div>
            )}
            {tenant.phoneNumber && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500">Phone</h4>
                <p className="text-gray-800">{tenant.phoneNumber}</p>
              </div>
            )}
            {/* Social Links */}
            {branding && socialLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.ariaLabel + link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label={link.ariaLabel}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card className="!p-0 overflow-hidden">
           <div className="aspect-w-16 aspect-h-9">
             <iframe
                src={mapSrc}
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${tenant.name}`}
                className="w-full h-full"
              ></iframe>
           </div>
        </Card>
      </div>

      {/* Right Column: Contact Form */}
      <div className="md:col-span-2">
        <Card title="Send us a Message">
          {isSubmitted ? (
            <div className="text-center p-8">
                <h3 className="text-lg font-medium text-gray-900">Message Sent!</h3>
                <p className="mt-1 text-sm text-gray-500">Thank you for contacting us. An administrator or staff member will get back to you shortly.</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setIsSubmitted(false);
                  }}
                >
                  Send Another
                </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {initialServiceName && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  You’re asking about <span className="font-semibold">{initialServiceName}</span>. We’ll include that in your
                  message so our team knows how to help.
                </div>
              )}
              <Input
                label="Your Name"
                id="name" 
                name="name" 
                type="text" 
                value={formState.name} 
                onChange={handleInputChange} 
                required
                disabled={isSubmitting}
              />
              <Input 
                label="Your Email" 
                id="email" 
                name="email" 
                type="email" 
                value={formState.email} 
                onChange={handleInputChange} 
                required
                disabled={isSubmitting}
              />
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formState.message}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="text-right">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;