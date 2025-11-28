'use client';
import React, { useState } from 'react';
import RSVPModal from './RSVPModal';

export default function RsvpButton({ tenantId, eventId }: { tenantId: string; eventId: string }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                Register / RSVP
            </button>
            {showModal && (
                <RSVPModal
                    tenantId={tenantId}
                    eventId={eventId}
                    onClose={() => setShowModal(false)}
                    onRsvped={() => {
                        setShowModal(false);
                        // Optional: refresh page or show toast
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}
