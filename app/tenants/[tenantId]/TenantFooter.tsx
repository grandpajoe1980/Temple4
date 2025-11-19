"use client";

import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaGlobe } from 'react-icons/fa';

interface TenantFooterProps {
  tenant: {
    name: string;
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

const TenantFooter: React.FC<TenantFooterProps> = ({ tenant }) => {
  const hasSocialLinks = tenant.branding && (
    tenant.branding.facebookUrl || 
    tenant.branding.instagramUrl || 
    tenant.branding.twitterUrl || 
    tenant.branding.youtubeUrl || 
    tenant.branding.websiteUrl || 
    tenant.branding.linkedInUrl
  );

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
              {tenant.branding?.facebookUrl && (
                <a 
                  href={tenant.branding.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook size={20} />
                </a>
              )}
              {tenant.branding?.instagramUrl && (
                <a 
                  href={tenant.branding.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram size={20} />
                </a>
              )}
              {tenant.branding?.twitterUrl && (
                <a 
                  href={tenant.branding.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="Twitter"
                >
                  <FaTwitter size={20} />
                </a>
              )}
              {tenant.branding?.youtubeUrl && (
                <a 
                  href={tenant.branding.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="YouTube"
                >
                  <FaYoutube size={20} />
                </a>
              )}
              {tenant.branding?.linkedInUrl && (
                <a 
                  href={tenant.branding.linkedInUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={20} />
                </a>
              )}
              {tenant.branding?.websiteUrl && (
                <a 
                  href={tenant.branding.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                  aria-label="Website"
                >
                  <FaGlobe size={20} />
                </a>
              )}
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
