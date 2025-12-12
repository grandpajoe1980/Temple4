"use client";
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useTranslation from '@/app/hooks/useTranslation';

interface CustomToolbarProps {
  date: Date;
  view: 'month' | 'week' | 'list';
  onViewChange: (view: 'month' | 'week' | 'list') => void;
  onDateChange: (direction: 'prev' | 'next' | 'today') => void;
  isMobile: boolean;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = ({
  date,
  view,
  onViewChange,
  onDateChange,
  isMobile,
}) => {
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';

  const viewLabels: Record<'month' | 'week' | 'list', string> = {
    month: t('calendar.month'),
    week: t('calendar.week'),
    list: t('calendar.list'),
  };

  const formatDateTitle = () => {
    if (view === 'list') return t('calendar.upcomingEvents');

    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (view === 'week') {
      // Calculate week range
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week (Saturday)

      // Same month?
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleString(localeCode, { month: 'short' })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      }
      // Different months, same year?
      if (start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleString(localeCode, { month: 'short' })} ${start.getDate()} – ${end.toLocaleString(localeCode, { month: 'short' })} ${end.getDate()}, ${start.getFullYear()}`;
      }
      // Different years
      return `${start.toLocaleString(localeCode, { month: 'short' })} ${start.getDate()}, ${start.getFullYear()} – ${end.toLocaleString(localeCode, { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
    }

    return date.toLocaleDateString(localeCode, options);
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-center justify-between">
        {/* Left: Navigation (Hidden in List view) */}
        <div className="flex items-center gap-1">
          {view !== 'list' && (
            <>
              <button
                onClick={() => onDateChange('prev')}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDateChange('next')}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDateChange('today')}
                className="ml-2 px-3 py-1 text-sm font-medium rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {t('calendar.today')}
              </button>
            </>
          )}
        </div>

        {/* Right: View Switcher */}
        <div className="flex bg-secondary/50 p-1 rounded-lg">
          {(['month', 'week', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-all capitalize
                ${view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {formatDateTitle()}
        </h2>
      </div>
    </div>
  );
};
