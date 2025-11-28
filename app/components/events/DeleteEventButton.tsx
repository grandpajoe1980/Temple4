'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteEventButton({ tenantId, eventId }: { tenantId: string; eventId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}`, { method: 'DELETE' });
            if (res.ok) {
                router.push(`/tenants/${tenantId}/events`);
                router.refresh();
            } else {
                alert('Failed to delete event');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
        >
            <span>🗑️</span>
            {loading ? 'Deleting...' : 'Delete Event'}
        </button>
    );
}
