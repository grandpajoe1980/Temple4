"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Mic, BookOpen, Users, Calendar, Heart, FileText, MessageCircle, ArrowRight } from 'lucide-react';

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
  sermon: { icon: BookOpen, gradient: 'from-amber-400 via-orange-500 to-red-500', accentColor: 'tenant-text-primary tenant-bg-50' },
  book: { icon: BookOpen, gradient: 'from-blue-400 via-indigo-500 to-purple-600', accentColor: 'text-blue-600 bg-blue-50' },
  service: { icon: Heart, gradient: 'from-rose-400 via-pink-500 to-fuchsia-600', accentColor: 'text-rose-600 bg-rose-50' },
  event: { icon: Calendar, gradient: 'from-cyan-400 via-sky-500 to-blue-600', accentColor: 'text-cyan-600 bg-cyan-50' },
  post: { icon: FileText, gradient: 'from-slate-400 via-gray-500 to-zinc-600', accentColor: 'text-slate-600 bg-slate-50' },
  community: { icon: MessageCircle, gradient: 'from-green-400 via-emerald-500 to-teal-600', accentColor: 'text-green-600 bg-green-50' },
};

export default function TenantCarousel({ slides }: TenantCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
  const config = categoryConfig[current.category || ''] || { icon: FileText, gradient: 'from-amber-200 via-orange-200 to-yellow-200', accentColor: 'tenant-text-primary tenant-bg-50' };
  const CategoryIcon = config.icon;

  const nearbySlides = useMemo(() => {
    if (count <= 1) return [] as Slide[];
    const picks: Slide[] = [];
    const first = slides[nextIndex];
    const second = slides[(nextIndex + 1) % count];
    if (first) picks.push(first);
    if (count > 2 && second && second !== first) picks.push(second);
    return picks;
  }, [count, nextIndex, slides]);

  const descriptionFallback = current.description || current.subtitle?.split('•').slice(1).join('•').trim();
  const descriptionLines = descriptionFallback ? descriptionFallback.split('. ').slice(0, 3) : [];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative grid min-h-[360px] md:min-h-[420px] md:grid-cols-[1.5fr_1fr]">
        <div className={`relative h-full w-full overflow-hidden ${!current.imageUrl ? `bg-gradient-to-br ${config.gradient}` : 'bg-slate-900 dark:bg-slate-800'}`}>
          {current.imageUrl && (
            <Image
              src={current.imageUrl}
              alt={current.title}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-black/10" />
          {!current.imageUrl && descriptionLines.length > 0 && (
            <div className="absolute inset-0 p-6 sm:p-8 md:p-10 text-white/90 flex flex-col gap-4">
              <div className="max-w-2xl space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Featured</p>
                <h3 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm">{current.title}</h3>
                <p className="text-base sm:text-lg leading-relaxed text-white/80 line-clamp-4">{descriptionFallback}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80">
                {descriptionLines.map((line, idx) => (
                  <div key={idx} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm ring-1 ring-white/15">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8 pb-16 md:pb-8 flex flex-col justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${config.accentColor}`}>
                {current.subtitle?.split('•')[0]?.trim() || current.category || 'Featured'}
              </span>
              {current.subtitle?.includes('•') && (
                <span className="text-xs text-white/80 line-clamp-1">{current.subtitle.split('•').slice(1).join('•').trim()}</span>
              )}
            </div>
            <div className="flex items-start gap-3">
              <div className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-xl ${config.accentColor} ring-1 ring-white/40 bg-white/90 dark:bg-slate-900/80`}> 
                <CategoryIcon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight line-clamp-2 drop-shadow">{current.title}</h3>
                {descriptionFallback && <p className="text-sm sm:text-base text-white/85 line-clamp-3 max-w-2xl">{descriptionFallback}</p>}
                {current.link && (
                  <Link
                    href={current.link}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  >
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-7 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.accentColor} ring-1 ring-slate-200 dark:ring-slate-700`}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Featured</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{current.subtitle?.split('•')[0]?.trim() || current.category || 'Content'}</div>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                aria-label="Previous"
                onClick={() => setIndex(prevIndex)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                aria-label="Next"
                onClick={() => setIndex(nextIndex)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">{current.title}</h4>
            {descriptionFallback && <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{descriptionFallback}</p>}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-slate-200">{current.category || 'Content'}</span>
            {current.subtitle && <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-slate-200">{current.subtitle.split('•')[0]?.trim()}</span>}
          </div>

          {nearbySlides.length > 0 && (
            <div className="mt-auto space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Up next</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearbySlides.map((slide, idx) => {
                  const cfg = categoryConfig[slide.category || ''] || { icon: FileText, gradient: '', accentColor: 'tenant-text-primary tenant-bg-50' };
                  const Icon = cfg.icon;
                  const targetIndex = (nextIndex + idx) % count;
                  return (
                    <button
                      key={`${slide.title}-${idx}`}
                      onClick={() => setIndex(targetIndex)}
                      className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.accentColor} ring-1 ring-slate-200 dark:ring-slate-700`}>
                        {slide.logoUrl ? (
                          <Image src={slide.logoUrl} alt={`${slide.title} logo`} width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 line-clamp-1">{slide.category || 'Content'}</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{slide.title}</div>
                        {slide.description && <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{slide.description}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile nav buttons */}
        <div className="absolute inset-x-4 bottom-3 md:hidden flex items-center justify-between gap-3">
          <button
            aria-label="Previous"
            onClick={() => setIndex(prevIndex)}
            className="rounded-full bg-black/40 p-3 text-white shadow-lg backdrop-blur hover:bg-black/55"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-2 flex-1 justify-center flex-wrap max-w-full">
            {slides.map((s, i) => (
              <button
                key={`${s.title}-${i}`}
                aria-label={`Go to ${s.title}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-6 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/60'}`}
              />
            ))}
          </div>
          <button
            aria-label="Next"
            onClick={() => setIndex(nextIndex)}
            className="rounded-full bg-black/40 p-3 text-white shadow-lg backdrop-blur hover:bg-black/55"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop dots */}
      <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 gap-2 bg-white/80 px-3 py-2 rounded-full shadow-sm">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            aria-label={`Go to ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-8 rounded-full transition ${i === index ? 'tenant-active' : 'bg-slate-200 hover:bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
}
