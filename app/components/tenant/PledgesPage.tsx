'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { EnrichedPledge, FundWithProgress, PledgeFrequency, PledgeStatus, TenantSettings } from '@/types';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';

interface PledgesPageProps {
  tenant: {
    id: string;
    name: string;
    settings: TenantSettings;
  };
  user: {
    id: string;
    profile: { displayName: string };
  };
}

const frequencyLabels: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  FAILED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

const PledgesPage: React.FC<PledgesPageProps> = ({ tenant, user }) => {
  const [pledges, setPledges] = useState<EnrichedPledge[]>([]);
  const [funds, setFunds] = useState<FundWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<EnrichedPledge | null>(null);
  
  // Form state
  const [fundId, setFundId] = useState('');
  const [amountCents, setAmountCents] = useState('');
  const [frequency, setFrequency] = useState<string>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dedicationNote, setDedicationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPledges();
    fetchFunds();
  }, [tenant.id]);

  const fetchPledges = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/pledges`);
      if (res.ok) {
        const data = await res.json();
        setPledges(data.pledges || []);
      }
    } catch (error) {
      console.error('Failed to fetch pledges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/funds`);
      if (res.ok) {
        const data = await res.json();
        setFunds(data || []);
        if (data.length > 0 && !fundId) {
          setFundId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  };

  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundId,
          amountCents: Math.round(parseFloat(amountCents) * 100),
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          isAnonymous,
          dedicationNote: dedicationNote || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setAmountCents('');
        setDedicationNote('');
        setEndDate('');
        fetchPledges();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create pledge');
      }
    } catch (error) {
      console.error('Failed to create pledge:', error);
      alert('Failed to create pledge');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePausePledge = async (pledgeId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/pledges/${pledgeId}/pause`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchPledges();
      }
    } catch (error) {
      console.error('Failed to pause pledge:', error);
    }
  };

  const handleResumePledge = async (pledgeId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/pledges/${pledgeId}/resume`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchPledges();
      }
    } catch (error) {
      console.error('Failed to resume pledge:', error);
    }
  };

  const handleCancelPledge = async (pledgeId: string) => {
    if (!confirm('Are you sure you want to cancel this recurring pledge? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/pledges/${pledgeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPledges();
      }
    } catch (error) {
      console.error('Failed to cancel pledge:', error);
    }
  };

  const activePledges = useMemo(() => pledges.filter(p => p.status === 'ACTIVE'), [pledges]);
  const pausedPledges = useMemo(() => pledges.filter(p => p.status === 'PAUSED' || p.status === 'FAILED'), [pledges]);
  const inactivePledges = useMemo(() => pledges.filter(p => p.status === 'CANCELLED' || p.status === 'COMPLETED'), [pledges]);

  if (!tenant.settings?.enableDonations || !tenant.settings?.enableRecurringPledges) {
    return (
      <Card>
        <div className="text-center py-12 space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">Recurring Pledges are not enabled</h3>
          <p className="text-gray-600">Please contact this community's administrator for giving options.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Pledges</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your recurring donations to {tenant.name}.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          + New Pledge
        </Button>
      </div>

      {/* Create Pledge Form */}
      {showCreateForm && (
        <Card title="Create Recurring Pledge" description="Set up automatic recurring donations.">
          <form onSubmit={handleCreatePledge} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fund</label>
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                required
              >
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name} ({fund.type})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount ($)"
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="1"
              value={amountCents}
              onChange={(e) => setAmountCents(e.target.value)}
              placeholder="25.00"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
              >
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date (Optional)"
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Input
              label="Dedication Note (Optional)"
              id="dedicationNote"
              name="dedicationNote"
              value={dedicationNote}
              onChange={(e) => setDedicationNote(e.target.value)}
              placeholder="In honor of..."
            />

            <ToggleSwitch
              label="Remain Anonymous"
              enabled={isAnonymous}
              onChange={setIsAnonymous}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Pledge'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card>
          <div className="text-center py-8 text-gray-500">Loading pledges...</div>
        </Card>
      ) : pledges.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No pledges yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create a recurring pledge to automatically support {tenant.name}.
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="mt-4">
              Create Your First Pledge
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Pledges */}
          {activePledges.length > 0 && (
            <Card title="Active Pledges">
              <div className="divide-y divide-gray-200">
                {activePledges.map((pledge) => (
                  <div key={pledge.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            ${(pledge.amountCents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">{frequencyLabels[pledge.frequency]}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[pledge.status]}`}>
                            {pledge.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {pledge.fund?.name || 'Unknown Fund'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Next charge: {new Date(pledge.nextChargeAt).toLocaleDateString()}
                        </p>
                        {pledge.dedicationNote && (
                          <p className="text-xs text-gray-500 mt-1 italic">{pledge.dedicationNote}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handlePausePledge(pledge.id)}>
                          Pause
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleCancelPledge(pledge.id)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                    {pledge.totalChargesCount > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Total contributed: ${(pledge.totalAmountCents / 100).toFixed(2)} ({pledge.totalChargesCount} payments)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Paused/Failed Pledges */}
          {pausedPledges.length > 0 && (
            <Card title="Paused / Needs Attention">
              <div className="divide-y divide-gray-200">
                {pausedPledges.map((pledge) => (
                  <div key={pledge.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            ${(pledge.amountCents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">{frequencyLabels[pledge.frequency]}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[pledge.status]}`}>
                            {pledge.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {pledge.fund?.name || 'Unknown Fund'}
                        </p>
                        {pledge.lastFailureReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Last error: {pledge.lastFailureReason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleResumePledge(pledge.id)}>
                          Resume
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleCancelPledge(pledge.id)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Inactive Pledges */}
          {inactivePledges.length > 0 && (
            <Card title="Past Pledges">
              <div className="divide-y divide-gray-200">
                {inactivePledges.map((pledge) => (
                  <div key={pledge.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500">
                            ${(pledge.amountCents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400">{frequencyLabels[pledge.frequency]}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[pledge.status]}`}>
                            {pledge.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {pledge.fund?.name || 'Unknown Fund'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Total contributed: ${(pledge.totalAmountCents / 100).toFixed(2)} ({pledge.totalChargesCount} payments)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PledgesPage;
