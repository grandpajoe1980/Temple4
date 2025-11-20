"use client";

import { useEffect, useState } from 'react';
import type { Facility, FacilityBooking } from '@/types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import { BookingStatus } from '@prisma/client';

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
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState({
    name: '',
    type: 'ROOM',
    description: '',
    location: '',
    capacity: '',
  });

  useEffect(() => {
    loadFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  useEffect(() => {
    if (facilities.length === 0) {
      setBookings([]);
      return;
    }
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFormState({ name: '', type: 'ROOM', description: '', location: '', capacity: '' });
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
        <Button onClick={() => setIsModalOpen(true)}>New Facility</Button>
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
                  {!facility.isActive && <span className="text-xs text-red-600">Inactive</span>}
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
                        <Button size="sm" onClick={() => updateBookingStatus(booking.id, BookingStatus.APPROVED)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateBookingStatus(booking.id, BookingStatus.REJECTED)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Facility">
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
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
