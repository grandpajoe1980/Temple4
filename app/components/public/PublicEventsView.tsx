import React from 'react';
import type { Tenant } from '@/types';
import { getEventsForTenant } from '@/lib/data';
import EventCard from '../tenant/EventCard';

interface PublicEventsViewProps {
  tenant: Tenant;
}

const PublicEventsView: React.FC<PublicEventsViewProps> = ({ tenant }) => {
  const events = getEventsForTenant(tenant.id);

  return (
    <div className="space-y-6">
      {events.length > 0 ? (
        events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Events Scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no upcoming events at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicEventsView;
