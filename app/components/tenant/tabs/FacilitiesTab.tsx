"use client";

import { useEffect, useState } from 'react';
import type { Facility, FacilityBooking } from '@/types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
// `@prisma/client` exports are server-side values. Client components must not
// import runtime values from it. Define a small client-side type instead and
// use string literals for runtime values.
type BookingStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

interface FacilitiesTabProps {
  tenant: any;
  currentUser?: any;
  onRefresh: () => void;
}

const typeOptions = [
  { value: 'ROOM', label: 'Room' },
  { value: 'HALL', label: 'Hall' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'OTHER', label: 'Other' },
];

export default function FacilitiesTab({ tenant, onRefresh }: FacilitiesTabProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState({
    name: '',
    type: 'ROOM',
    description: '',
    location: '',
    capacity: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadFacilities();
     
  }, [tenant.id]);

  useEffect(() => {
    if (facilities.length === 0) {
      setBookings([]);
      return;
    }
    loadBookings();
     
  }, [facilities]);

  const loadFacilities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/facilities`);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Failed to load facilities', response.status, text);
        setFacilities([]);
        return;
      }

      // read text first to handle empty responses without throwing
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setFacilities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load facilities', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      if (facilities.length === 0) {
        setBookings([]);
        return;
      }

      const results = await Promise.all(
        facilities.map((facility) =>
          fetch(`/api/tenants/${tenant.id}/facilities/${facility.id}/bookings?all=true`).then((res) =>
            res.ok ? res.json() : []
          )
        )
      );

      setBookings(results.flat());
    } catch (error) {
      console.error('Failed to load bookings', error);
    }
  };

  const handleCreate = async () => {
    const payload: any = {
      name: formState.name,
      description: formState.description,
      type: formState.type,
      location: formState.location,
      imageUrl: formState.imageUrl,
    };

    if (formState.capacity) {
      payload.capacity = Number(formState.capacity);
    }

    const response = await fetch(`/api/tenants/${tenant.id}/facilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setIsModalOpen(false);
      setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '', imageUrl: '' });
      await loadFacilities();
      await loadBookings();
      onRefresh();
    } else {
      console.error('Failed to create facility', await response.text());
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const response = await fetch(`/api/tenants/${tenant.id}/facilities/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      await loadBookings();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Facilities</h3>
          <p className="text-gray-600 text-sm">Create and manage facilities and booking requests.</p>
        </div>
        <Button onClick={() => {
          setEditingFacilityId(null);
          setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '', imageUrl: '' });
          setIsModalOpen(true);
        }}>New Facility</Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-gray-600">Loading facilities...</p>
        ) : facilities.length === 0 ? (
          <p className="text-sm text-gray-600">No facilities created yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {facilities.map((facility) => (
              <li key={facility.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{facility.name}</p>
                    <p className="text-xs text-gray-600">{facility.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!facility.isActive && <span className="text-xs text-red-600">Inactive</span>}
                    <Button size="sm" onClick={() => {
                      setEditingFacilityId(facility.id);
                      setFormState({
                        name: facility.name ?? '',
                        type: facility.type ?? 'ROOM',
                        description: facility.description ?? '',
                        location: facility.location ?? '',
                        capacity: facility.capacity ? String(facility.capacity) : '',
                        imageUrl: facility.imageUrl ?? '',
                      });
                      setIsModalOpen(true);
                    }}>Edit</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h4 className="text-lg font-semibold text-gray-900">Booking Requests</h4>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-600 mt-2">No booking requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id} className="rounded-md border border-gray-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{booking.purpose}</p>
                    <p className="text-gray-600">
                      {new Date(booking.startAt).toLocaleString()} → {new Date(booking.endAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Facility: {booking.facilityId}</p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'REQUESTED' && (
                      <>
                        <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'APPROVED')}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateBookingStatus(booking.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Status: {booking.status}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest={editingFacilityId ? 'edit-facility-modal' : 'create-facility-modal'} title={editingFacilityId ? 'Edit Facility' : 'Create Facility'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={formState.type}
              onChange={(e) => setFormState({ ...formState, type: e.target.value })}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              <Input value={formState.location} onChange={(e) => setFormState({ ...formState, location: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Capacity</label>
              <Input
                type="number"
                value={formState.capacity}
                onChange={(e) => setFormState({ ...formState, capacity: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Image</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Image URL (or upload below)"
                  value={formState.imageUrl}
                  onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="inline-block cursor-pointer rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('tenantId', tenant.id);
                        fd.append('category', 'photos');
                        fd.append('purpose', 'facility');

                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        if (!res.ok) {
                          console.error('Upload failed', await res.text());
                          return;
                        }

                        const result = await res.json();
                        if (result?.url) {
                          setFormState((s) => ({ ...s, imageUrl: result.url }));
                        }
                      } catch (err) {
                        console.error('Upload error', err);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            {formState.imageUrl && (
              <div className="mt-3 w-48 overflow-hidden rounded-md border">
                <img src={formState.imageUrl} alt="Facility" className="h-32 w-full object-cover" />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div>
              {editingFacilityId && (
                <Button
                  variant="danger"
                  onClick={async () => {
                    // confirm delete
                     
                    if (!confirm('Delete this facility? This will remove related bookings.')) return;

                    try {
                      const res = await fetch(`/api/tenants/${tenant.id}/facilities/${editingFacilityId}`, { method: 'DELETE' });
                        if (res.ok) {
                        setIsModalOpen(false);
                        setEditingFacilityId(null);
                        setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '', imageUrl: '' });
                        await loadFacilities();
                        await loadBookings();
                        onRefresh();
                      } else {
                        console.error('Failed to delete facility', await res.text());
                      }
                    } catch (err) {
                      console.error('Failed to delete facility', err);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingFacilityId(null); }}>
                Cancel
              </Button>
              <Button onClick={async () => {
                // Save (create or update)
                const payload: any = {
                  name: formState.name,
                  description: formState.description,
                  type: formState.type,
                  location: formState.location,
                  imageUrl: formState.imageUrl,
                };

                if (formState.capacity) payload.capacity = Number(formState.capacity);

                try {
                  if (editingFacilityId) {
                    const res = await fetch(`/api/tenants/${tenant.id}/facilities/${editingFacilityId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                      if (res.ok) {
                      setIsModalOpen(false);
                      setEditingFacilityId(null);
                      setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '', imageUrl: '' });
                      await loadFacilities();
                      await loadBookings();
                      onRefresh();
                    } else {
                      console.error('Failed to update facility', await res.text());
                    }
                  } else {
                    const res = await fetch(`/api/tenants/${tenant.id}/facilities`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    if (res.ok) {
                      setIsModalOpen(false);
                      setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '', imageUrl: '' });
                      await loadFacilities();
                      await loadBookings();
                      onRefresh();
                    } else {
                      console.error('Failed to create facility', await res.text());
                    }
                  }
                } catch (err) {
                  console.error('Failed to save facility', err);
                }
              }}>
                {editingFacilityId ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
