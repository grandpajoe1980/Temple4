"use client";

import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaGlobe } from 'react-icons/fa';
import { FaTiktok, FaXTwitter } from 'react-icons/fa6';

interface TenantFooterProps {
  tenant: {
    name: string;
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
}

type FooterLink = {
  url: string;
  icon: React.ReactNode;
  ariaLabel: string;
  showInFooter: boolean;
};

const socialIconMap: Record<string, React.ReactNode> = {
  facebook: <FaFacebook size={20} />,
  instagram: <FaInstagram size={20} />,
  twitter: <FaTwitter size={20} />,
  x: <FaXTwitter size={20} />,
  youtube: <FaYoutube size={20} />,
  linkedin: <FaLinkedin size={20} />,
  tiktok: <FaTiktok size={20} />,
  website: <FaGlobe size={20} />,
  custom: <FaGlobe size={20} />,
};

const normalizeFooterLinks = (tenant: TenantFooterProps['tenant']): FooterLink[] => {
  const branding = tenant.branding;
  if (!branding) return [];

  const structuredSocial = Array.isArray(branding.socialLinks)
    ? branding.socialLinks.filter((link): link is NonNullable<typeof link> => Boolean(link))
    : [];

  const customLinks = Array.isArray(branding.customLinks)
    ? branding.customLinks.filter((link): link is NonNullable<typeof link> => Boolean(link))
    : [];

  const baseLinks: Array<{ platform: string; url?: string | null; label?: string; showInFooter?: boolean }> = [
    { platform: 'facebook', url: branding.facebookUrl, showInFooter: true },
    { platform: 'instagram', url: branding.instagramUrl, showInFooter: true },
    { platform: 'twitter', url: branding.twitterUrl, showInFooter: true },
    { platform: 'x', url: branding.xUrl ?? branding.twitterUrl, showInFooter: true },
    { platform: 'youtube', url: branding.youtubeUrl, showInFooter: true },
    { platform: 'linkedin', url: branding.linkedInUrl, showInFooter: true },
    { platform: 'tiktok', url: branding.tiktokUrl, showInFooter: true },
    { platform: 'website', url: branding.websiteUrl, label: 'Website', showInFooter: true },
    ...structuredSocial,
    ...customLinks.map((link) => ({ platform: 'custom', url: link.url, label: link.label, showInFooter: link.showInFooter })),
  ];

  return baseLinks
    .filter((link) => !!link.url)
    .map((link) => ({
      url: link.url as string,
      icon: socialIconMap[link.platform] ?? <FaGlobe size={20} />,
      ariaLabel: link.label ?? link.platform,
      showInFooter: link.showInFooter ?? true,
    }))
    .filter((link) => link.showInFooter);
};

const TenantFooter: React.FC<TenantFooterProps> = ({ tenant }) => {
  const footerLinks = normalizeFooterLinks(tenant);
  const hasSocialLinks = footerLinks.length > 0;

  if (!hasSocialLinks) {
    return (
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Follow us:</span>
            <div className="flex gap-3">
              {footerLinks.map((link) => (
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
          
          {/* Copyright */}
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default TenantFooter;
