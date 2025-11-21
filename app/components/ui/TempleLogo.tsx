"use client";

import React from 'react';

interface TempleLogoProps {
  className?: string;
}

export default function TempleLogo({ className }: TempleLogoProps) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/*
          Golden-ratio guided temple mark:
          - uses stroked outlines (outer pediment, base) and interior column strokes
          - strokeWidth kept equal for outer and inner lines per request
        */}
        <g strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none">
          {/* Pediment (triangle) */}
          <path d="M32 8 L6 24 H58 L32 8 Z" />

          {/* Entablature / header bar under pediment */}
          <path d="M8 24 H56" />

          {/* Columns (three) - taller, cleaner (foot ornaments removed) */}
          <g>
            <path d="M18 26 V56" />
            <path d="M32 26 V56" />
            <path d="M46 26 V56" />
          </g>

          {/* Base platform (kept simple) */}
          <path d="M10 58 H54" />

          {/* Outer walls / footprint (extended to match taller columns) */}
          <path d="M12 24 V56 H52 V24" />
        </g>
      </svg>
    </span>
  );
}
