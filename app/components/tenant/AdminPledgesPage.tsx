'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { EnrichedPledge, PledgeSettings, FundWithProgress } from '@/types';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';

interface AdminPledgesPageProps {
  tenantId: string;
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

const AdminPledgesPage: React.FC<AdminPledgesPageProps> = ({ tenantId }) => {
  const [pledges, setPledges] = useState<EnrichedPledge[]>([]);
  const [settings, setSettings] = useState<PledgeSettings | null>(null);
  const [funds, setFunds] = useState<FundWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingResult, setProcessingResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pledges' | 'settings'>('pledges');
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');
  
  // Settings form state
  const [maxFailures, setMaxFailures] = useState(3);
  const [retryInterval, setRetryInterval] = useState(24);
  const [gracePeriod, setGracePeriod] = useState(7);
  const [autoResume, setAutoResume] = useState(true);
  const [dunningDays, setDunningDays] = useState('3,7,14');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchPledges();
    fetchSettings();
    fetchFunds();
  }, [tenantId]);

  const fetchPledges = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (fundFilter) params.append('fundId', fundFilter);
      
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges?${params}`);
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

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setMaxFailures(data.maxFailuresBeforePause);
        setRetryInterval(data.retryIntervalHours);
        setGracePeriod(data.gracePeriodDays);
        setAutoResume(data.autoResumeOnSuccess);
        setDunningDays(Array.isArray(data.dunningEmailDays) ? data.dunningEmailDays.join(',') : '3,7,14');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/funds?includeArchived=true`);
      if (res.ok) {
        const data = await res.json();
        setFunds(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  };

  const handleProcessPledges = async (action: 'process' | 'retry') => {
    setProcessingResult(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges/process?action=${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setProcessingResult(data.message);
        fetchPledges();
      } else {
        setProcessingResult('Failed to process pledges');
      }
    } catch (error) {
      setProcessingResult('Error processing pledges');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxFailuresBeforePause: maxFailures,
          retryIntervalHours: retryInterval,
          gracePeriodDays: gracePeriod,
          autoResumeOnSuccess: autoResume,
          dunningEmailDays: dunningDays.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d)),
        }),
      });
      if (res.ok) {
        fetchSettings();
        alert('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOverrideNextCharge = async (pledgeId: string, newDate: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges/${pledgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminOverride: {
            nextChargeAt: new Date(newDate).toISOString(),
          },
        }),
      });
      if (res.ok) {
        fetchPledges();
      }
    } catch (error) {
      console.error('Failed to override next charge:', error);
    }
  };

  const handleForceStatus = async (pledgeId: string, status: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/donations/pledges/${pledgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminOverride: { status },
        }),
      });
      if (res.ok) {
        fetchPledges();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const active = pledges.filter(p => p.status === 'ACTIVE');
    const totalMonthly = active.reduce((sum, p) => {
      let multiplier = 1;
      switch (p.frequency) {
        case 'WEEKLY': multiplier = 4.33; break;
        case 'BIWEEKLY': multiplier = 2.17; break;
        case 'MONTHLY': multiplier = 1; break;
        case 'QUARTERLY': multiplier = 0.33; break;
        case 'YEARLY': multiplier = 0.083; break;
      }
      return sum + (p.amountCents * multiplier);
    }, 0);
    
    return {
      total: pledges.length,
      active: active.length,
      paused: pledges.filter(p => p.status === 'PAUSED').length,
      failed: pledges.filter(p => p.status === 'FAILED').length,
      estimatedMonthly: totalMonthly / 100,
    };
  }, [pledges]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pledge Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage recurring pledges and processing settings.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Pledges</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
            <p className="text-sm text-gray-500">Paused</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold tenant-text-primary">${stats.estimatedMonthly.toFixed(0)}</p>
            <p className="text-sm text-gray-500">Est. Monthly</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pledges')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pledges'
                ? 'border-[color:var(--primary)] tenant-text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pledges
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-[color:var(--primary)] tenant-text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {activeTab === 'pledges' && (
        <>
          {/* Processing Actions */}
          <Card title="Manual Processing">
            <div className="flex flex-wrap gap-4 items-center">
              <Button onClick={() => handleProcessPledges('process')}>
                Process Due Pledges
              </Button>
              <Button variant="secondary" onClick={() => handleProcessPledges('retry')}>
                Retry Failed Pledges
              </Button>
              {processingResult && (
                <span className="text-sm text-gray-600">{processingResult}</span>
              )}
            </div>
          </Card>

          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
                <select
                  value={fundFilter}
                  onChange={(e) => { setFundFilter(e.target.value); }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Funds</option>
                  {funds.map(fund => (
                    <option key={fund.id} value={fund.id}>{fund.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={fetchPledges}>Apply Filters</Button>
              </div>
            </div>
          </Card>

          {/* Pledges List */}
          <Card title={`Pledges (${pledges.length})`}>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : pledges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pledges found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fund</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Charge</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pledges.map((pledge) => (
                      <tr key={pledge.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {pledge.isAnonymous ? 'Anonymous' : (pledge.user?.profile?.displayName || pledge.userId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {pledge.fund?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ${(pledge.amountCents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {frequencyLabels[pledge.frequency]}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[pledge.status]}`}>
                            {pledge.status}
                          </span>
                          {pledge.failureCount > 0 && (
                            <span className="ml-2 text-xs text-red-600">({pledge.failureCount} failures)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(pledge.nextChargeAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          ${(pledge.totalAmountCents / 100).toFixed(2)} ({pledge.totalChargesCount})
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            {pledge.status === 'ACTIVE' && (
                              <Button size="sm" variant="secondary" onClick={() => handleForceStatus(pledge.id, 'PAUSED')}>
                                Pause
                              </Button>
                            )}
                            {(pledge.status === 'PAUSED' || pledge.status === 'FAILED') && (
                              <Button size="sm" variant="primary" onClick={() => handleForceStatus(pledge.id, 'ACTIVE')}>
                                Resume
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'settings' && (
        <Card title="Pledge Processing Settings" description="Configure how recurring pledges are processed.">
          <div className="space-y-6 max-w-xl">
            <div>
              <Input
                label="Max failures before pause"
                id="maxFailures"
                type="number"
                min="1"
                max="10"
                value={maxFailures.toString()}
                onChange={(e) => setMaxFailures(parseInt(e.target.value, 10))}
              />
              <p className="mt-1 text-sm text-gray-500">Number of consecutive failures before a pledge is automatically paused.</p>
            </div>

            <div>
              <Input
                label="Retry interval (hours)"
                id="retryInterval"
                type="number"
                min="1"
                max="168"
                value={retryInterval.toString()}
                onChange={(e) => setRetryInterval(parseInt(e.target.value, 10))}
              />
              <p className="mt-1 text-sm text-gray-500">Hours to wait before retrying a failed pledge.</p>
            </div>

            <div>
              <Input
                label="Grace period (days)"
                id="gracePeriod"
                type="number"
                min="0"
                max="30"
                value={gracePeriod.toString()}
                onChange={(e) => setGracePeriod(parseInt(e.target.value, 10))}
              />
              <p className="mt-1 text-sm text-gray-500">Days after a missed charge before considering the pledge at risk.</p>
            </div>

            <div>
              <Input
                label="Dunning email days"
                id="dunningDays"
                value={dunningDays}
                onChange={(e) => setDunningDays(e.target.value)}
                placeholder="3,7,14"
              />
              <p className="mt-1 text-sm text-gray-500">Comma-separated days after failure to send reminder emails (e.g., 3,7,14).</p>
            </div>

            <ToggleSwitch
              label="Auto-resume on successful payment"
              enabled={autoResume}
              onChange={setAutoResume}
            />

            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminPledgesPage;
