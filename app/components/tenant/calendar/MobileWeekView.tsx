import React, { useMemo } from 'react';
import { EventWithCreator } from '@/types';

interface MobileWeekViewProps {
  date: Date;
  events: EventWithCreator[];
  onEventClick?: (event: EventWithCreator) => void;
}

export const MobileWeekView: React.FC<MobileWeekViewProps> = ({ date, events, onEventClick }) => {
  const weekDays = useMemo(() => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Start on Sunday
    start.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      days.push(current);
    }
    return days;
  }, [date]);

  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startDateTime);
      const eventEnd = event.endDateTime ? new Date(event.endDateTime) : eventStart;
      return eventStart <= dayEnd && eventEnd >= dayStart;
    }).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  };

  return (
    <div className="flex flex-col divide-y divide-border bg-card rounded-lg border border-border overflow-hidden">
      {weekDays.map((day) => {
        const dayEvents = getEventsForDay(day);
        const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div key={day.toISOString()} className={`flex min-h-[80px] ${isToday ? 'tenant-bg-100' : ''}`}>
            {/* Left: Date Column */}
            <div className="w-16 flex flex-col items-center justify-start pt-3 border-r border-border shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {day.toLocaleDateString('default', { weekday: 'short' })}
              </span>
              <div className={`
                mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold
                ${isToday ? 'tenant-active-strong' : 'text-foreground'}
              `}>
                {day.getDate()}
              </div>
            </div>

            {/* Right: Events Column */}
            <div className="flex-1 p-2 space-y-2">
              {dayEvents.length === 0 ? (
                <div className="h-full flex items-center">
                  {/* Optional: Placeholder for empty days to keep structure */}
                </div>
              ) : (
                dayEvents.map(event => {
                  const isAllDay = (event as any).isAllDay;
                  const timeStr = isAllDay 
                    ? 'All Day' 
                    : new Date(event.startDateTime).toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' });

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="bg-background border border-border rounded p-2 text-sm shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <div className="font-semibold text-foreground truncate">
                        {event.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeStr}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
