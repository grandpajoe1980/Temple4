"use client";

import React, { useState } from 'react';
import { addContactSubmission } from '@/lib/data';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaGlobe } from 'react-icons/fa';

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
      youtubeUrl?: string | null;
      websiteUrl?: string | null;
      linkedInUrl?: string | null;
    } | null;
  };
}

const ContactPage: React.FC<ContactPageProps> = ({ tenant }) => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

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
      await addContactSubmission(tenant.id, formState);
      setIsSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {tenant.branding && (
              tenant.branding.facebookUrl || 
              tenant.branding.instagramUrl || 
              tenant.branding.twitterUrl || 
              tenant.branding.youtubeUrl || 
              tenant.branding.websiteUrl || 
              tenant.branding.linkedInUrl
            ) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Follow Us</h4>
                <div className="flex gap-3">
                  {tenant.branding.facebookUrl && (
                    <a 
                      href={tenant.branding.facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="Facebook"
                    >
                      <FaFacebook size={24} />
                    </a>
                  )}
                  {tenant.branding.instagramUrl && (
                    <a 
                      href={tenant.branding.instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="Instagram"
                    >
                      <FaInstagram size={24} />
                    </a>
                  )}
                  {tenant.branding.twitterUrl && (
                    <a 
                      href={tenant.branding.twitterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="Twitter"
                    >
                      <FaTwitter size={24} />
                    </a>
                  )}
                  {tenant.branding.youtubeUrl && (
                    <a 
                      href={tenant.branding.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="YouTube"
                    >
                      <FaYoutube size={24} />
                    </a>
                  )}
                  {tenant.branding.linkedInUrl && (
                    <a 
                      href={tenant.branding.linkedInUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedin size={24} />
                    </a>
                  )}
                  {tenant.branding.websiteUrl && (
                    <a 
                      href={tenant.branding.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      aria-label="Website"
                    >
                      <FaGlobe size={24} />
                    </a>
                  )}
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
                <Button className="mt-4" onClick={() => setIsSubmitted(false)}>Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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