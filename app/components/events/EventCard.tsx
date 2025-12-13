'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Calendar as CalendarIcon, MapPin, Video, Users } from 'lucide-react';
import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function EventCard({ event, onOpen, tenantId, isAdmin, onDelete }: { event: any; onOpen: (id: string) => void; tenantId: string; isAdmin: boolean; onDelete: (id: string) => void }) {
  const router = useRouter();
  const startDate = new Date(event.startDateTime);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'THIS_EVENT' | 'ALL_IN_SERIES'>('THIS_EVENT');

  async function performDelete() {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${event.id}?scope=${deleteScope}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(event.id); // If deleting all, parent should probably refresh, but for now we remove this one.
        // Ideally we should trigger a full refresh if we deleted a series.
        if (deleteScope === 'ALL_IN_SERIES') {
          window.location.reload(); // Simple way to refresh the list to remove all series items
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  }

  const isRecurring = Boolean(event.recurrenceGroupId);

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
        onClick={() => router.push(`/tenants/${tenantId}/events/${event.id}`)}
      >
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {event.posterUrl ? (
            <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CalendarIcon className="w-16 h-16 opacity-20" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
            {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          {isRecurring && (
            <div className="absolute top-3 left-3 bg-indigo-100/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm flex items-center gap-1">
              <span>↻</span> Series
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs font-medium text-indigo-600 mb-1 uppercase tracking-wide">
            {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">{event.title}</h3>

          {event.locationText && (
            <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {event.locationText}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="flex -space-x-2">
              <span className="text-xs text-slate-500 pl-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {event.rsvpCount || 0} attending
              </span>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/tenants/${tenantId}/events/${event.id}/edit`); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Event">
        <div className="space-y-4">
          <p>Are you sure you want to delete <strong>{event.title}</strong>?</p>

          {isRecurring && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-slate-50">
                <input type="radio" name="deleteScope" checked={deleteScope === 'THIS_EVENT'} onChange={() => setDeleteScope('THIS_EVENT')} value="THIS_EVENT" />
                <div>
                  <span className="block text-sm font-medium">Delete this event only</span>
                  <span className="block text-xs text-slate-500">Other events in the series will remain.</span>
                </div>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-slate-50">
                <input type="radio" name="deleteScope" checked={deleteScope === 'ALL_IN_SERIES'} onChange={() => setDeleteScope('ALL_IN_SERIES')} value="ALL_IN_SERIES" />
                <div>
                  <span className="block text-sm font-medium">Delete entire series</span>
                  <span className="block text-xs text-slate-500">All recurring events in this series will be deleted.</span>
                </div>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={performDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
