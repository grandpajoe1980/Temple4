"use client"

import React from 'react';
import type { EventWithCreator } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface EventCardProps {
  event: EventWithCreator;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formatDateTime = (start: Date, end: Date) => {
    const startDate = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startDate} from ${startTime} to ${endTime}`;
  };
  
  const LocationInfo = () => {
    if (event.isOnline) {
      return (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
            <path d="M2 12.5a.5.5 0 01.5-.5h15a.5.5 0 010 1h-15a.5.5 0 01-.5-.5z" />
          </svg>
          Virtual Event
        </>
      );
    }
    return (
       <>
        <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        {event.locationText}
       </>
    );
  };
  
  const Description = () => {
      if (event.isOnline && event.onlineUrl) {
          return (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                 <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 hover:underline">
                    {event.description} (Click here to join)
                 </a>
              </p>
          );
      }
      return (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {event.description}
          </p>
      );
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-6">
        <p className="text-sm font-semibold text-amber-600">
          {formatDateTime(event.startDateTime, event.endDateTime)}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900 hover:text-amber-700 cursor-pointer">
          {event.title}
        </h3>
        <div className="mt-2 flex items-center text-sm text-gray-500">
           <LocationInfo />
        </div>
        <Description />
      </div>
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Button variant="primary" size="sm" onClick={() => alert('RSVP: Going (not implemented).')}>Going</Button>
            <Button variant="secondary" size="sm" onClick={() => alert('RSVP: Interested (not implemented).')}>Interested</Button>
        </div>
        <div className="text-xs text-gray-500">
            Created by {event.creatorDisplayName}
        </div>
      </div>
    </Card>
  );
};

export default EventCard;