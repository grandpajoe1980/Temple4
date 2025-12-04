"use client";

import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/*
          Asembli logo mark - abstract community/assembly symbol
          - uses stroked outlines representing connection and gathering
        */}
        <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Central hub */}
          <circle cx="32" cy="32" r="8" />
          
          {/* Radiating connections - representing community members */}
          <path d="M32 20 V8" />
          <path d="M32 44 V56" />
          <path d="M20 32 H8" />
          <path d="M44 32 H56" />
          
          {/* Diagonal connections */}
          <path d="M24 24 L14 14" />
          <path d="M40 24 L50 14" />
          <path d="M24 40 L14 50" />
          <path d="M40 40 L50 50" />
          
          {/* Outer ring representing unity */}
          <circle cx="32" cy="32" r="28" strokeDasharray="4 4" />
        </g>
      </svg>
    </span>
  );
}
