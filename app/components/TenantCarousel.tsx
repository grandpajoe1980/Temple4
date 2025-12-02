"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Slide {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  link?: string;
}

interface TenantCarouselProps {
  slides: Slide[];
}

export default function TenantCarousel({ slides }: TenantCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [preview, setPreview] = useState<{ side: 'prev' | 'next'; slide?: Slide } | null>(null);

  const count = slides.length;

  const nextIndex = useMemo(() => (index + 1) % Math.max(1, count), [index, count]);
  const prevIndex = useMemo(() => (index - 1 + count) % Math.max(1, count), [index, count]);

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearTimeout(t);
  }, [index, isPaused, count]);

  if (count === 0) return null;

  const current = slides[index];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white/80 ring-1 ring-slate-100 shadow-sm">
      <div className="aspect-[16/7] w-full">
        <div
          className="h-full w-full bg-cover bg-center relative"
          style={{ backgroundImage: current.imageUrl ? `url(${current.imageUrl})` : undefined, backgroundColor: '#fffaf0' }}
        >
          {/* Make the whole slide clickable when a link is provided */}
          {current.link ? (
            <Link href={current.link} className="absolute inset-0 z-10 block" onClick={() => {}}>
              <div className="h-full w-full bg-gradient-to-r from-black/25 via-transparent to-black/10 p-6 cursor-pointer">
                <div className="flex h-full w-full items-end">
                  <div className="max-w-2xl rounded-lg bg-white/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-amber-50 ring-1 ring-amber-100">
                        {current.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={current.logoUrl} alt={`${current.title} logo`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-amber-700 font-semibold">{current.title?.slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{current.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{current.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-black/25 via-transparent to-black/10 p-6">
              <div className="flex h-full w-full items-end">
                <div className="max-w-2xl rounded-lg bg-white/80 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-amber-50 ring-1 ring-amber-100">
                      {current.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.logoUrl} alt={`${current.title} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-amber-700 font-semibold">{current.title?.slice(0, 1)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{current.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{current.subtitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left / Right arrows overlay */}
      <button
        aria-label="Previous"
        onClick={() => setIndex(prevIndex)}
        onMouseEnter={() => setPreview({ side: 'prev', slide: slides[prevIndex] })}
        onMouseLeave={() => setPreview(null)}
        onFocus={() => setPreview({ side: 'prev', slide: slides[prevIndex] })}
        onBlur={() => setPreview(null)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/45 focus:outline-none"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        aria-label="Next"
        onClick={() => setIndex(nextIndex)}
        onMouseEnter={() => setPreview({ side: 'next', slide: slides[nextIndex] })}
        onMouseLeave={() => setPreview(null)}
        onFocus={() => setPreview({ side: 'next', slide: slides[nextIndex] })}
        onBlur={() => setPreview(null)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/45 focus:outline-none"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Hover preview panel */}
      {preview?.slide && (
        <div
          className={`absolute z-30 top-4 ${preview.side === 'prev' ? 'left-4' : 'right-4'} w-64 rounded-lg bg-white/95 p-3 shadow-lg ring-1 ring-slate-100`}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-amber-50 ring-1 ring-amber-100">
              {preview.slide.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.slide.logoUrl} alt={`${preview.slide.title} logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-amber-700 font-semibold">{preview.slide.title?.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">{preview.slide.title}</div>
              <div className="mt-1 text-xs text-slate-600 line-clamp-3">{preview.slide.subtitle}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            aria-label={`Go to ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-8 rounded-full ${i === index ? 'bg-amber-500' : 'bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
