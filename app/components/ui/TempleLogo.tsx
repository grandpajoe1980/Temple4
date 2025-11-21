"use client";

import React from 'react';

interface TempleLogoProps {
  className?: string;
}

export default function TempleLogo({ className }: TempleLogoProps) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M32 6 L6 26 H12 V52 H52 V26 H58 L32 6 Z M15 46 V30 H21 V46 H15 Z M29 46 V30 H35 V46 H29 Z M43 46 V30 H49 V46 H43 Z" />
      </svg>
    </span>
  );
}
