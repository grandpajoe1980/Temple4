"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TripJoinForm, { TripJoinFormValues } from './TripJoinForm';
import TripForm, { TripFormValues } from './forms/TripForm';

interface TripDetailProps {
  tenantId: string;
  tripId: string | null;
  currentUser: any;
  onClose?: () => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export default function TripDetail({ tenantId, tripId, currentUser, onClose, onRefresh, isAdmin }: TripDetailProps) {
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [donating, setDonating] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [selectedIntakeMember, setSelectedIntakeMember] = useState<any>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  const approvedMembers = useMemo(
    () => (trip?.members || []).filter((m: any) => m.status === 'APPROVED'),
    [trip]
  );

  const currentMembership = useMemo(
    () => (trip?.members || []).find((m: any) => m.user?.id === currentUser?.id),
    [trip, currentUser]
  );
  const canManage = useMemo(() => {
    if (isAdmin || (currentUser as any)?.isSuperAdmin) return true;
    return currentMembership?.role === 'LEADER' || currentMembership?.role === 'CO_LEADER';
  }, [isAdmin, currentUser, currentMembership]);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setTrip(data);
      } catch (err: any) {
        console.error('Failed to load trip', err);
        if (mounted) setError(err?.message || 'Failed to load trip');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tenantId, tripId]);

  const handleJoin = async (values: TripJoinFormValues) => {
    if (!tripId) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      if (onRefresh) onRefresh();
      // re-fetch trip to include the new membership state
      const fresh = await fetch(`/api/tenants/${tenantId}/trips/${tripId}`);
      if (fresh.ok) {
        const data = await fresh.json();
        setTrip(data);
      }
      setShowJoinForm(false);
      alert('Requested to join trip');
    } catch (err: any) {
      alert(err?.message || 'Failed to join trip');
    } finally {
      setJoining(false);
    }
  };

  const handleDonate = async () => {
    if (!tripId) return;
    const raw = prompt('Enter an amount to donate (USD)');
    if (!raw) return;
    const amount = Number(raw);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }
    setDonating(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Math.round(amount * 100), currency: trip?.currency || 'USD' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      alert('Donation captured');
      if (onRefresh) onRefresh();
      const fresh = await fetch(`/api/tenants/${tenantId}/trips/${tripId}`);
      if (fresh.ok) setTrip(await fresh.json());
    } catch (err: any) {
      alert(err?.message || 'Failed to donate');
    } finally {
      setDonating(false);
    }
  };

  const handleApprove = async (memberUserId: string) => {
    if (!tripId || !memberUserId) {
      alert('Cannot approve: missing member id.');
      return;
    }
    setSavingTrip(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}/members/${memberUserId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      const updatedMember = await res.json();
      setTrip((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: (prev.members || []).map((m: any) => (m.user?.id === memberUserId ? { ...m, status: updatedMember.status } : m)),
        };
      });
      if (onRefresh) onRefresh();
      alert('Member approved');
    } catch (err: any) {
      alert(err?.message || 'Failed to approve member');
    } finally {
      setSavingTrip(false);
    }
  };

  const handleReject = async (memberUserId: string) => {
    if (!tripId || !memberUserId) {
      alert('Cannot reject: missing member id.');
      return;
    }
    setSavingTrip(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      setTrip((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: (prev.members || []).filter((m: any) => m.user?.id !== memberUserId),
        };
      });
      if (onRefresh) onRefresh();
      alert('Member rejected');
    } catch (err: any) {
      alert(err?.message || 'Failed to reject member');
    } finally {
      setSavingTrip(false);
    }
  };

  const handleUpdateStatus = async (status: 'COMPLETED' | 'ARCHIVED') => {
    if (!tripId) return;
    setSavingTrip(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setTrip(updated);
      if (onRefresh) onRefresh();
      alert(status === 'COMPLETED' ? 'Trip marked as completed' : 'Trip archived');
    } catch (err: any) {
      alert(err?.message || 'Failed to update trip status');
    } finally {
      setSavingTrip(false);
    }
  };

  const renderKV = (label: string, value?: string | boolean | null) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-sm text-gray-800">{String(value)}</span>
      </div>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </div>
  );

  const handleUpdateTrip = async (values: TripFormValues) => {
    if (!tripId) return;
    setSavingTrip(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
          costCents: values.costCents ?? null,
          depositCents: values.depositCents ?? null,
          fundraisingGoalCents: values.fundraisingGoalCents ?? null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setTrip(updated);
      setShowEditTrip(false);
      if (onRefresh) onRefresh();
      alert('Trip updated');
    } catch (err: any) {
      alert(err?.message || 'Failed to update trip');
    } finally {
      setSavingTrip(false);
    }
  };

  if (!tripId) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500">
        Select a trip to view details.
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">Loading trip…</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!trip) return null;

  const capacity = trip.capacity || 0;
  const approvedCount = approvedMembers.length;
  const fundraisingGoal = trip.fundraisingGoalCents || 0;
  const raised = (trip.donations || []).reduce((sum: number, d: any) => sum + (d.amountCents || 0), 0);

  const initialEditValues: TripFormValues | undefined = trip
    ? {
        name: trip.name || '',
        summary: trip.summary || '',
        description: trip.description || '',
        destination: trip.destination || '',
        startDate: trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : '',
        endDate: trip.endDate ? new Date(trip.endDate).toISOString().slice(0, 10) : '',
        meetingPoint: trip.meetingPoint || '',
        capacity: trip.capacity || undefined,
        costCents: typeof trip.costCents === 'number' ? trip.costCents : null,
        currency: trip.currency || 'USD',
        depositCents: typeof trip.depositCents === 'number' ? trip.depositCents : null,
        fundraisingEnabled: !!trip.fundraisingEnabled,
        fundraisingGoalCents: typeof trip.fundraisingGoalCents === 'number' ? trip.fundraisingGoalCents : null,
        allowSponsorship: !!trip.allowSponsorship,
        joinPolicy: (trip.joinPolicy as any) || 'APPROVAL',
        waiverRequired: !!trip.waiverRequired,
        allowMessages: trip.allowMessages ?? true,
        allowPhotos: trip.allowPhotos ?? true,
        isPublic: !!trip.isPublic,
      }
    : undefined;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{trip.name}</h2>
          {trip.destination ? <p className="text-sm text-gray-600">Destination: {trip.destination}</p> : null}
          {trip.summary ? <p className="mt-1 text-sm text-gray-700">{trip.summary}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {onClose ? (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          ) : null}
          {canManage ? (
            <Button variant="secondary" onClick={() => setShowEditTrip(true)} disabled={savingTrip}>
              Edit trip
            </Button>
          ) : null}
          {!currentMembership ? (
            <Button variant="primary" onClick={() => setShowJoinForm(true)} disabled={joining}>
              {joining ? 'Joining…' : 'Join trip'}
            </Button>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {currentMembership.status === 'APPROVED' ? 'Joined' : 'Pending approval'}
            </span>
          )}
        </div>
      </div>

      {trip.description ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{trip.description}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Logistics</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>Dates: {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'} → {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD'}</li>
            {trip.meetingPoint ? <li>Meet at: {trip.meetingPoint}</li> : null}
            {trip.departureLocation ? <li>Departure: {trip.departureLocation}</li> : null}
            {trip.destination ? <li>Destination: {trip.destination}</li> : null}
            {trip.costCents ? (
              <li>
                Cost per person:{' '}
                {(trip.costCents / 100).toLocaleString(undefined, { style: 'currency', currency: trip.currency || 'USD' })}
                {trip.depositCents ? ` (Deposit ${(trip.depositCents / 100).toLocaleString(undefined, { style: 'currency', currency: trip.currency || 'USD' })})` : ''}
              </li>
            ) : null}
            {capacity ? <li>Capacity: {approvedCount}/{capacity}</li> : null}
            {trip.waiverRequired ? <li>Waiver required</li> : null}
          </ul>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Fundraiser</h3>
          {trip.fundraisingEnabled ? (
            <>
              <div className="text-sm text-gray-700">
                Raised {(raised / 100).toLocaleString(undefined, { style: 'currency', currency: trip.currency || 'USD' })}
                {fundraisingGoal ? ` of ${(fundraisingGoal / 100).toLocaleString(undefined, { style: 'currency', currency: trip.currency || 'USD' })}` : ''}
              </div>
              {fundraisingGoal ? (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-2 bg-amber-400"
                    style={{ width: `${Math.min(100, Math.round((raised / fundraisingGoal) * 100))}%` }}
                  />
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={handleDonate} disabled={donating}>
                  {donating ? 'Processing…' : 'Donate'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Fundraiser is not enabled for this trip.</p>
          )}
        </div>
      </div>

      {(trip.itineraryItems && trip.itineraryItems.length > 0) || (trip.travelSegments && trip.travelSegments.length > 0) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trip.itineraryItems && trip.itineraryItems.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Itinerary</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {trip.itineraryItems.map((item: any) => (
                  <li key={item.id} className="rounded border border-gray-100 bg-gray-50 p-2">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-600">
                      {item.startsAt ? new Date(item.startsAt).toLocaleString() : 'TBD'}
                      {item.endsAt ? ` → ${new Date(item.endsAt).toLocaleString()}` : ''}
                    </div>
                    {item.location ? <div className="text-xs text-gray-600">{item.location}</div> : null}
                    {item.description ? <p className="text-sm text-gray-700">{item.description}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {trip.travelSegments && trip.travelSegments.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Travel</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {trip.travelSegments.map((seg: any) => (
                  <li key={seg.id} className="rounded border border-gray-100 bg-gray-50 p-2">
                    <div className="font-medium text-gray-900">
                      {seg.type || 'Segment'} {seg.segmentNumber ? `• ${seg.segmentNumber}` : ''}
                    </div>
                    {seg.carrier ? <div className="text-xs text-gray-600">{seg.carrier}</div> : null}
                    <div className="text-xs text-gray-600">
                      {seg.departAt ? new Date(seg.departAt).toLocaleString() : 'Depart TBA'} → {seg.arriveAt ? new Date(seg.arriveAt).toLocaleString() : 'Arrive TBA'}
                    </div>
                    {seg.departLocation || seg.arriveLocation ? (
                      <div className="text-xs text-gray-600">
                        {seg.departLocation || 'TBA'} → {seg.arriveLocation || 'TBA'}
                      </div>
                    ) : null}
                    {seg.confirmationCode ? <div className="text-xs text-gray-600">Confirmation: {seg.confirmationCode}</div> : null}
                    {seg.notes ? <p className="text-sm text-gray-700">{seg.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-gray-800">Members</h3>
        <ul className="mt-2 divide-y divide-gray-100 rounded border border-gray-100 bg-gray-50">
          {(trip.members || []).map((m: any) => (
            <li key={m.id || m.user?.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {m.user?.profile?.avatarUrl ? (
                  <img src={m.user.profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-800">{m.user?.profile?.displayName || m.user?.email || 'Member'}</div>
                  <div className="text-xs text-gray-500">
                    Status: {m.status}
                    {m.travelPreferences?.intakeForm ? ' · Intake on file' : ''}
                    {m.waiverAcceptedAt ? ' · Waiver accepted' : ''}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {m.travelPreferences?.intakeForm ? (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIntakeMember(m)}>
                    View form
                  </Button>
                ) : null}
                {canManage && m.status !== 'APPROVED' && m.user?.id ? (
                  <>
                    <Button variant="primary" size="sm" onClick={() => handleApprove(m.user.id)} disabled={savingTrip}>
                      Approve
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReject(m.user.id)} disabled={savingTrip}>
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
          {trip.members?.length === 0 ? <li className="px-3 py-2 text-sm text-gray-500">No members yet.</li> : null}
        </ul>
      </div>

      <Modal isOpen={showJoinForm} onClose={() => (!joining ? setShowJoinForm(false) : null)} title="Join this trip">
        <TripJoinForm
          user={currentUser}
          tripName={trip?.name}
          submitting={joining}
          onCancel={() => (!joining ? setShowJoinForm(false) : null)}
          onSubmit={handleJoin}
        />
      </Modal>
      <Modal isOpen={showEditTrip} onClose={() => (!savingTrip ? setShowEditTrip(false) : null)} title="Edit trip">
        {initialEditValues ? (
          <TripForm
            initial={initialEditValues}
            isEdit
            submitting={savingTrip}
            onCancel={() => (!savingTrip ? setShowEditTrip(false) : null)}
            onSubmit={handleUpdateTrip}
          />
        ) : null}
        {canManage ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => handleUpdateStatus('COMPLETED')}
              disabled={savingTrip || trip?.status === 'COMPLETED'}
            >
              {trip?.status === 'COMPLETED' ? 'Completed' : 'Mark complete'}
            </Button>
            <Button variant="danger" onClick={() => handleUpdateStatus('ARCHIVED')} disabled={savingTrip}>
              Delete trip
            </Button>
          </div>
        ) : null}
      </Modal>
      <Modal
        isOpen={!!selectedIntakeMember}
        onClose={() => (!savingTrip ? setSelectedIntakeMember(null) : null)}
        title={`Join form: ${selectedIntakeMember?.user?.profile?.displayName || selectedIntakeMember?.user?.email || ''}`}
      >
        {selectedIntakeMember?.travelPreferences?.intakeForm ? (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2 text-sm text-gray-800">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Form submitted; Waiver accepted: {selectedIntakeMember?.waiverAcceptedAt ? 'Yes' : 'Unknown'}
              </div>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                Print
              </Button>
            </div>
            <Section title="Personal Information">
              {renderKV('Full legal name', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.fullLegalName)}
              {renderKV('Preferred name', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.preferredName)}
              {renderKV('Date of birth', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.dateOfBirth)}
              {renderKV('Gender', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.gender)}
              {renderKV('Address', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.address)}
              {renderKV('Phone', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.phone)}
              {renderKV('Guardian phone', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.guardianPhone)}
              {renderKV('Email', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.email)}
              {renderKV('Emergency contact', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.emergencyContact?.name)}
              {renderKV('Emergency relationship', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.emergencyContact?.relationship)}
              {renderKV('Emergency phone', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.emergencyContact?.phone)}
              {renderKV('Emergency email', selectedIntakeMember.travelPreferences.intakeForm.personalInfo?.emergencyContact?.email)}
            </Section>
            <Section title="Medical Information">
              {renderKV('Allergies', selectedIntakeMember.travelPreferences.intakeForm.medical?.allergies)}
              {renderKV('Conditions', selectedIntakeMember.travelPreferences.intakeForm.medical?.conditions)}
              {renderKV('Medications', selectedIntakeMember.travelPreferences.intakeForm.medical?.medications)}
              {renderKV('Dietary restrictions', selectedIntakeMember.travelPreferences.intakeForm.medical?.dietaryRestrictions)}
              {renderKV('Accessibility needs', selectedIntakeMember.travelPreferences.intakeForm.medical?.accessibilityNeeds)}
              {renderKV('Physician', selectedIntakeMember.travelPreferences.intakeForm.medical?.physicianName)}
              {renderKV('Physician phone', selectedIntakeMember.travelPreferences.intakeForm.medical?.physicianPhone)}
              {renderKV('Insurance provider', selectedIntakeMember.travelPreferences.intakeForm.medical?.insuranceProvider)}
              {renderKV('Insurance policy', selectedIntakeMember.travelPreferences.intakeForm.medical?.insurancePolicyNumber)}
              {renderKV('Consent first aid', selectedIntakeMember.travelPreferences.intakeForm.medical?.consentFirstAid ? 'Yes' : 'No')}
              {renderKV('Consent emergency care', selectedIntakeMember.travelPreferences.intakeForm.medical?.consentEmergencyCare ? 'Yes' : 'No')}
            </Section>
            <Section title="Passport / ID">
              {renderKV('Passport number', selectedIntakeMember.travelPreferences.intakeForm.passport?.passportNumber)}
              {renderKV('Expiration', selectedIntakeMember.travelPreferences.intakeForm.passport?.passportExpiration)}
              {renderKV('Country', selectedIntakeMember.travelPreferences.intakeForm.passport?.passportCountry)}
              {renderKV('Passport copy URL', selectedIntakeMember.travelPreferences.intakeForm.passport?.passportCopyUrl)}
            </Section>
            <Section title="Parent / Guardian">
              {renderKV('Guardian name', selectedIntakeMember.travelPreferences.intakeForm.guardian?.guardianName)}
              {renderKV('Guardian contact', selectedIntakeMember.travelPreferences.intakeForm.guardian?.guardianContact)}
              {renderKV('Permission to travel', selectedIntakeMember.travelPreferences.intakeForm.guardian?.permissionTravel ? 'Yes' : 'No')}
              {renderKV('Permission with leader', selectedIntakeMember.travelPreferences.intakeForm.guardian?.permissionWithLeader ? 'Yes' : 'No')}
              {renderKV('Signature', selectedIntakeMember.travelPreferences.intakeForm.guardian?.guardianSignature)}
              {renderKV('Signature date', selectedIntakeMember.travelPreferences.intakeForm.guardian?.guardianSignatureDate)}
            </Section>
            <Section title="Behavioral Agreements">
              {renderKV('Code of conduct', selectedIntakeMember.travelPreferences.intakeForm.agreements?.conduct ? 'Yes' : 'No')}
              {renderKV('Follow instructions', selectedIntakeMember.travelPreferences.intakeForm.agreements?.followInstructions ? 'Yes' : 'No')}
              {renderKV('Substance free', selectedIntakeMember.travelPreferences.intakeForm.agreements?.substanceFree ? 'Yes' : 'No')}
              {renderKV('Curfew/attendance', selectedIntakeMember.travelPreferences.intakeForm.agreements?.curfew ? 'Yes' : 'No')}
              {renderKV('Group expectations', selectedIntakeMember.travelPreferences.intakeForm.agreements?.expectations ? 'Yes' : 'No')}
              {renderKV('Media opt-out initials', selectedIntakeMember.travelPreferences.intakeForm.agreements?.mediaReleaseOptOutInitials)}
            </Section>
            <Section title="Waiver">
              {renderKV('Trip name', selectedIntakeMember.travelPreferences.intakeForm.waiver?.tripName)}
              {renderKV('Trip dates', selectedIntakeMember.travelPreferences.intakeForm.waiver?.tripDates)}
              {renderKV('Participant name', selectedIntakeMember.travelPreferences.intakeForm.waiver?.participantName)}
              {renderKV('Waiver accepted', selectedIntakeMember.waiverAcceptedAt ? 'Yes' : 'No')}
            </Section>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No intake data available.</div>
        )}
      </Modal>
    </div>
  );
}
