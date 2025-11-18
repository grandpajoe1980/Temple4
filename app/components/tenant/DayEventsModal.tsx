import React from 'react';
import type { EventWithCreator } from '@/types';
import Modal from '../ui/Modal';
import EventCard from './EventCard';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: EventWithCreator[];
}

const DayEventsModal: React.FC<DayEventsModalProps> = ({ isOpen, onClose, date, events }) => {
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Events for ${formattedDate}`}>
      {events.length > 0 ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {events.map((event: any) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8">
          <h3 className="text-lg font-medium text-gray-900">No Events Scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">There are no events scheduled for this day.</p>
        </div>
      )}
    </Modal>
  );
};

export default DayEventsModal;
