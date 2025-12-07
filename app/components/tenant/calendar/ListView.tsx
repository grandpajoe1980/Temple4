import React, { useState, useMemo } from 'react';
import { EventWithCreator } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListViewProps {
  events: EventWithCreator[];
  onEventClick?: (event: EventWithCreator) => void;
}

export const ListView: React.FC<ListViewProps> = ({ events, onEventClick }) => {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const futureEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    return events
      .filter(e => new Date(e.startDateTime) >= startOfToday)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(futureEvents.length / PAGE_SIZE));
  
  const displayedEvents = useMemo(() => {
    const start = page * PAGE_SIZE;
    return futureEvents.slice(start, start + PAGE_SIZE);
  }, [futureEvents, page]);

  if (futureEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No upcoming events found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        <div className="space-y-1">
          {displayedEvents.map((event) => {
            const startDate = new Date(event.startDateTime);
            const isAllDay = (event as any).isAllDay;
            
            return (
              <div 
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="flex items-center gap-4 p-4 bg-card hover:bg-accent/50 transition-colors border-b border-border last:border-0 cursor-pointer"
              >
                {/* Date Box */}
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-secondary/30 rounded-lg shrink-0">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {startDate.toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-foreground leading-none">
                    {startDate.getDate()}
                  </span>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {event.title}
                  </h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>
                      {startDate.toLocaleDateString('default', { weekday: 'long' })}
                    </span>
                    <span>•</span>
                    <span>
                      {isAllDay 
                        ? 'All Day' 
                        : startDate.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })
                      }
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border bg-card mt-auto">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
