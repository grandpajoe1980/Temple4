"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Mic, BookOpen, Users, Calendar, Heart, FileText, MessageCircle } from 'lucide-react';

interface Slide {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  link?: string;
  category?: 'photo' | 'podcast' | 'sermon' | 'book' | 'service' | 'event' | 'post' | 'community';
}

interface TenantCarouselProps {
  slides: Slide[];
}

const categoryConfig: Record<string, { icon: React.ComponentType<any>; gradient: string; accentColor: string }> = {
  photo: { icon: Camera, gradient: 'from-emerald-400 via-teal-500 to-cyan-600', accentColor: 'text-emerald-600 bg-emerald-50' },
  podcast: { icon: Mic, gradient: 'from-purple-400 via-violet-500 to-indigo-600', accentColor: 'text-purple-600 bg-purple-50' },
  sermon: { icon: BookOpen, gradient: 'from-amber-400 via-orange-500 to-red-500', accentColor: 'text-amber-600 bg-amber-50' },
  book: { icon: BookOpen, gradient: 'from-blue-400 via-indigo-500 to-purple-600', accentColor: 'text-blue-600 bg-blue-50' },
  service: { icon: Heart, gradient: 'from-rose-400 via-pink-500 to-fuchsia-600', accentColor: 'text-rose-600 bg-rose-50' },
  event: { icon: Calendar, gradient: 'from-cyan-400 via-sky-500 to-blue-600', accentColor: 'text-cyan-600 bg-cyan-50' },
  post: { icon: FileText, gradient: 'from-slate-400 via-gray-500 to-zinc-600', accentColor: 'text-slate-600 bg-slate-50' },
  community: { icon: MessageCircle, gradient: 'from-green-400 via-emerald-500 to-teal-600', accentColor: 'text-green-600 bg-green-50' },
};

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
  const config = categoryConfig[current.category || ''] || { icon: FileText, gradient: 'from-amber-200 via-orange-200 to-yellow-200', accentColor: 'text-amber-600 bg-amber-50' };
  const CategoryIcon = config.icon;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white/80 ring-1 ring-slate-100 shadow-sm">
      <div className="aspect-[16/7] w-full">
        <div
          className={`h-full w-full bg-cover bg-center relative ${!current.imageUrl ? `bg-gradient-to-br ${config.gradient}` : ''}`}
          style={{ backgroundImage: current.imageUrl ? `url(${current.imageUrl})` : undefined }}
        >
          {/* Make the whole slide clickable when a link is provided */}
          {current.link ? (
            <Link href={current.link} className="absolute inset-0 z-10 block" onClick={() => {}}>
              <div className={`h-full w-full ${current.imageUrl ? 'bg-gradient-to-r from-black/40 via-black/20 to-black/30' : 'bg-black/10'} p-6 cursor-pointer`}>
                <div className="flex h-full w-full items-end">
                  <div className="max-w-md rounded-xl bg-white/95 p-5 backdrop-blur-sm shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ${config.accentColor} ring-1 ring-slate-200 flex items-center justify-center`}>
                        {current.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={current.logoUrl} alt={`${current.title} logo`} className="h-full w-full object-cover" />
                        ) : (
                          <CategoryIcon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.accentColor}`}>
                            {current.subtitle?.split('•')[0]?.trim() || current.category || 'Content'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{current.title}</h3>
                        {current.description ? (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{current.description}</p>
                        ) : current.subtitle?.includes('•') ? (
                          <p className="text-sm text-slate-500 mt-1">{current.subtitle.split('•').slice(1).join('•').trim()}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className={`h-full w-full ${current.imageUrl ? 'bg-gradient-to-r from-black/40 via-black/20 to-black/30' : 'bg-black/10'} p-6`}>
              <div className="flex h-full w-full items-end">
                <div className="max-w-md rounded-xl bg-white/95 p-5 backdrop-blur-sm shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ${config.accentColor} ring-1 ring-slate-200 flex items-center justify-center`}>
                      {current.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.logoUrl} alt={`${current.title} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <CategoryIcon className="h-7 w-7" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.accentColor}`}>
                          {current.subtitle?.split('•')[0]?.trim() || current.category || 'Content'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{current.title}</h3>
                      {current.description ? (
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">{current.description}</p>
                      ) : current.subtitle?.includes('•') ? (
                        <p className="text-sm text-slate-500 mt-1">{current.subtitle.split('•').slice(1).join('•').trim()}</p>
                      ) : null}
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
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/45 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
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
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/45 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Hover preview panel */}
      {preview?.slide && (() => {
        const previewConfig = categoryConfig[preview.slide.category || ''] || { icon: FileText, gradient: '', accentColor: 'text-amber-600 bg-amber-50' };
        const PreviewIcon = previewConfig.icon;
        return (
          <div
            className={`absolute z-30 top-4 ${preview.side === 'prev' ? 'left-4' : 'right-4'} w-72 rounded-xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg ${previewConfig.accentColor} ring-1 ring-slate-200 flex items-center justify-center`}>
                {preview.slide.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.slide.logoUrl} alt={`${preview.slide.title} logo`} className="h-full w-full object-cover" />
                ) : (
                  <PreviewIcon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${previewConfig.accentColor}`}>
                  {preview.slide.category || 'Content'}
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{preview.slide.title}</div>
                {preview.slide.description ? (
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">{preview.slide.description}</div>
                ) : (
                  <div className="mt-1 text-xs text-slate-500 line-clamp-2">{preview.slide.subtitle}</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            aria-label={`Go to ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-8 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${i === index ? 'bg-amber-500' : 'bg-white/60 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}
