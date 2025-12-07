import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getEventById, getEventAttendees } from '@/lib/services/event-service';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import PromoteButton from '@/app/components/events/PromoteButton';
import AdminVolunteerRolesEditor from '@/app/components/events/AdminVolunteerRolesEditor';
import ExportAttendeesButton from '@/app/components/events/ExportAttendeesButton';
import RSVPModal from '@/app/components/events/RSVPModal';
import RsvpButton from '@/app/components/events/RsvpButton';
import DeleteEventButton from '@/app/components/events/DeleteEventButton';

export default async function EventDetailPage({ params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  const event = await getEventById(tenantId, eventId);

  if (!event) return <div className="p-6 text-center text-gray-500">Event not found</div>;

  // Server-side session check to determine admin privileges
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = currentUserId ? await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]) : false;

  // Fetch attendee list for admin view
  const attendees = isAdmin ? await getEventAttendees(tenantId, eventId) : [];

  const startDate = new Date(event.startDateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 w-full bg-slate-100 rounded-b-xl overflow-hidden">
        {(event as any).posterUrl ? (
          <img src={(event as any).posterUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <span className="text-6xl opacity-20 font-bold">Event</span>
          </div>
        )}
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 flex flex-col md:flex-row gap-8">

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium mb-2">
              <span>{startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{event.title}</h1>

            <div className="prose prose-slate max-w-none text-slate-600">
              <p className="whitespace-pre-wrap">{event.description || "No description provided."}</p>
            </div>

            {/* Volunteer Roles Public View */}
            {(event as any).volunteerRoles && (event as any).volunteerRoles.length > 0 && (
              <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">Volunteer Opportunities</h3>
                <p className="text-sm text-indigo-700 mb-4">We need help making this event happen! Sign up for a role when you RSVP.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(event as any).volunteerRoles.map((role: any) => (
                    <div key={role.id} className="bg-white p-3 rounded border border-indigo-100 flex justify-between items-center">
                      <span className="font-medium text-indigo-900">{role.roleName}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {role._count?.rsvps || 0} / {role.capacity} filled
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 shrink-0 space-y-6">
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Event Details</h3>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-5 text-slate-400">🕒</div>
                  <div>
                    <div className="font-medium text-slate-900">Date & Time</div>
                    <div className="text-slate-600">
                      {startDate.toLocaleDateString()} <br />
                      {startDate.toLocaleTimeString()}
                      {endDate && ` - ${endDate.toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 text-slate-400">📍</div>
                  <div>
                    <div className="font-medium text-slate-900">Location</div>
                    <div className="text-slate-600">{event.locationText || "TBD"}</div>
                  </div>
                </div>

                {(event as any).capacityLimit && (
                  <div className="flex gap-3">
                    <div className="w-5 text-slate-400">👥</div>
                    <div>
                      <div className="font-medium text-slate-900">Capacity</div>
                      <div className="text-slate-600">
                        {(event as any)._count?.rsvps || 0} / {(event as any).capacityLimit} spots taken
                        {(event as any).waitlistEnabled && <span className="block text-xs tenant-text-primary mt-1">Waitlist available</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <RsvpButton tenantId={tenantId} eventId={eventId} />
              </div>
            </div>

            {isAdmin && (
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Admin Tools</h3>

                <div className="space-y-1 mb-6">
                  <a
                    href={`/tenants/${tenantId}/events/${eventId}/edit`}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <span>✏️</span> Edit Event
                  </a>
                  <DeleteEventButton tenantId={tenantId} eventId={eventId} />
                  <div className="h-px bg-slate-100 my-2"></div>
                  <ExportAttendeesButton tenantId={tenantId} eventId={eventId} />
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Attendees ({attendees.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {attendees.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded">
                        <div>
                          <div className="font-medium text-slate-900">{a.user ? a.user.profile?.displayName || a.user.email : a.guestName || a.guestEmail}</div>
                          <div className="text-xs text-slate-500">{a.status} {a.role === 'VOLUNTEER' && `• ${a.volunteerRole?.roleName}`}</div>
                        </div>
                        {a.status === 'WAITLISTED' && (
                          <PromoteButton tenantId={tenantId} eventId={eventId} rsvpId={a.id} />
                        )}
                      </div>
                    ))}
                    {attendees.length === 0 && <p className="text-sm text-slate-400 italic">No attendees yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
