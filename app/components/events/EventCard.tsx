'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function EventCard({ event, onOpen, tenantId, isAdmin, onDelete }: { event: any; onOpen: (id: string) => void; tenantId: string; isAdmin: boolean; onDelete: (id: string) => void }) {
  const router = useRouter();
  const startDate = new Date(event.startDateTime);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${event.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(event.id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
      onClick={() => router.push(`/tenants/${tenantId}/events/${event.id}`)}
    >
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <span className="text-4xl opacity-20 font-bold">Event</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
          {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-medium text-indigo-600 mb-1 uppercase tracking-wide">
          {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">{event.title}</h3>

        {event.locationText && (
          <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
            <span>📍</span> {event.locationText}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex -space-x-2">
            {/* Placeholder for attendee avatars if we had them in list view */}
            <span className="text-xs text-slate-500 pl-1">{event.rsvpCount || 0} attending</span>
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/tenants/${tenantId}/events/${event.id}/edit`); }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
