"use client"

import React from 'react';
import type { Tenant, DonationSettings, FundWithProgress, FundType, FundVisibility } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface DonationsTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

interface FundFormState {
  name: string;
  description: string;
  type: FundType;
  visibility: FundVisibility;
  currency: string;
  goalAmount: string;
  minAmount: string;
  maxAmount: string;
  allowAnonymous: boolean;
}

interface DonationSummary {
  fundId: string;
  fundName: string;
  totalAmount: number;
  donationCount: number;
  currency: string;
}

const DEFAULT_SUGGESTED_AMOUNTS = [5, 10, 25, 50, 100];
const defaultDonationSettings: DonationSettings = {
  mode: 'EXTERNAL',
  externalUrl: '',
  currency: 'USD',
  suggestedAmounts: DEFAULT_SUGGESTED_AMOUNTS,
  allowCustomAmounts: true,
  leaderboardEnabled: false,
  leaderboardVisibility: 'PUBLIC',
  leaderboardTimeframe: 'ALL_TIME',
  paypalUrl: '',
  venmoHandle: '',
  zelleEmail: '',
  cashAppTag: '',
  mailingAddress: '',
  taxId: '',
  bankTransferInstructions: '',
  textToGiveNumber: '',
  otherGivingNotes: '',
  otherGivingLinks: [],
};

const DonationsTab: React.FC<DonationsTabProps> = ({ tenant, onUpdate, onSave }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const settings = { ...defaultDonationSettings, ...(tenant.settings.donationSettings || {}) };
  const suggestedAmounts =
    settings.suggestedAmounts && settings.suggestedAmounts.length > 0
      ? settings.suggestedAmounts
      : DEFAULT_SUGGESTED_AMOUNTS;
  const [funds, setFunds] = React.useState<FundWithProgress[]>([]);
  const [fundsLoading, setFundsLoading] = React.useState(false);
  const [editingFundId, setEditingFundId] = React.useState<string | null>(null);
  const [fundForm, setFundForm] = React.useState<FundFormState>({
    name: '',
    description: '',
    type: 'TITHE',
    visibility: 'PUBLIC',
    currency: settings.currency,
    goalAmount: '',
    minAmount: '',
    maxAmount: '',
    allowAnonymous: true,
  });
  const [csvText, setCsvText] = React.useState('');
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);

  // Reporting state
  const [reportStartDate, setReportStartDate] = React.useState<string>('');
  const [reportEndDate, setReportEndDate] = React.useState<string>('');
  const [reportFundId, setReportFundId] = React.useState<string>('');
  const [donationSummaries, setDonationSummaries] = React.useState<DonationSummary[]>([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportTotal, setReportTotal] = React.useState<{ amount: number; count: number } | null>(null);

  const handleSettingsChange = (field: keyof DonationSettings, value: any) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        donationSettings: {
          ...settings,
          [field]: value,
        },
      },
    });
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const amounts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      handleSettingsChange('suggestedAmounts', amounts);
  }

  const serializeOtherGivingLinks = (links?: Array<{ label: string; url: string }>) =>
    (links || []).map(link => `${link.label} | ${link.url}`).join('\n');

  const handleOtherLinksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const links = e.target.value
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [label, url] = line.split('|').map(part => part.trim());
        if (!label || !url) return null;
        return { label, url };
      })
      .filter(Boolean) as Array<{ label: string; url: string }>;
    handleSettingsChange('otherGivingLinks', links);
  };

  const resetFundForm = React.useCallback(() => {
    setFundForm({
      name: '',
      description: '',
      type: 'TITHE',
      visibility: 'PUBLIC',
      currency: settings.currency,
      goalAmount: '',
      minAmount: '',
      maxAmount: '',
      allowAnonymous: true,
    });
    setEditingFundId(null);
  }, [settings.currency]);

  const loadFunds = React.useCallback(async () => {
    setFundsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/funds?includeArchived=true`);
      if (res.ok) {
        const data = await res.json();
        setFunds(data || []);
      }
    } catch (error) {
      console.error('Failed to load funds', error);
    } finally {
      setFundsLoading(false);
    }
  }, [tenant.id]);

  const loadAuditLogs = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/admin/audit-logs`);
      if (!res.ok) return;
      const data = await res.json();
      const filtered = (data || []).filter((log: any) =>
        ['DONATION_FUND_CREATED', 'DONATION_FUND_UPDATED', 'DONATION_FUND_ARCHIVED'].includes(log.actionType)
      );
      setAuditLogs(filtered);
    } catch (error) {
      console.error('Failed to load audit logs', error);
    }
  }, [tenant.id]);

  React.useEffect(() => {
    loadFunds();
    loadAuditLogs();
  }, [loadFunds, loadAuditLogs]);

  React.useEffect(() => {
    if (!editingFundId) {
      setFundForm((prev) => ({ ...prev, currency: settings.currency }));
    }
  }, [editingFundId, settings.currency]);

  const parseCurrencyInput = (value: string) => {
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : Math.round(parsed * 100);
  };

  const handleFundSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: fundForm.name,
        description: fundForm.description || undefined,
        type: fundForm.type,
        visibility: fundForm.visibility,
        currency: fundForm.currency,
        goalAmountCents: parseCurrencyInput(fundForm.goalAmount),
        minAmountCents: parseCurrencyInput(fundForm.minAmount),
        maxAmountCents: parseCurrencyInput(fundForm.maxAmount),
        allowAnonymous: fundForm.allowAnonymous,
      };
      const url = editingFundId
        ? `/api/tenants/${tenant.id}/donations/funds/${editingFundId}`
        : `/api/tenants/${tenant.id}/donations/funds`;
      const method = editingFundId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to save fund');
      }
      resetFundForm();
      await loadFunds();
      await loadAuditLogs();
      alert(editingFundId ? 'Fund updated' : 'Fund created');
    } catch (error: any) {
      alert(error.message || 'Failed to save fund');
    }
  };

  const handleEditFund = (fund: FundWithProgress) => {
    setEditingFundId(fund.id);
    setFundForm({
      name: fund.name,
      description: fund.description || '',
      type: fund.type,
      visibility: fund.visibility,
      currency: fund.currency,
      goalAmount: fund.goalAmountCents ? (fund.goalAmountCents / 100).toString() : '',
      minAmount: fund.minAmountCents ? (fund.minAmountCents / 100).toString() : '',
      maxAmount: fund.maxAmountCents ? (fund.maxAmountCents / 100).toString() : '',
      allowAnonymous: fund.allowAnonymous,
    });
  };

  const handleArchiveFund = async (fundId: string) => {
    if (!confirm('Archive this fund? Existing donation history will be preserved.')) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/funds/${fundId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive fund');
      await loadFunds();
      await loadAuditLogs();
    } catch (error: any) {
      alert(error.message || 'Unable to archive fund');
    }
  };

  const exportCsv = () => {
    const header = 'name,type,visibility,currency,goalAmountCents,amountRaisedCents,allowAnonymous';
    const rows = funds
      .map((fund) => [fund.name, fund.type, fund.visibility, fund.currency, fund.goalAmountCents ?? '', fund.amountRaisedCents ?? 0, fund.allowAnonymous].join(','))
      .join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tenant.slug}-funds.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n').slice(1);
    for (const line of lines) {
      const [name, type, visibility, currency, goalAmountCents, , allowAnonymous] = line.split(',');
      if (!name) continue;
      const payload = {
        name,
        type: (type || 'TITHE') as any,
        visibility: (visibility || 'PUBLIC') as any,
        currency: currency || settings.currency,
        goalAmountCents: goalAmountCents ? parseInt(goalAmountCents, 10) : null,
        allowAnonymous: allowAnonymous !== 'false',
      };
      await fetch(`/api/tenants/${tenant.id}/donations/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    await loadFunds();
    await loadAuditLogs();
    setCsvText('');
    alert('Import complete');
  };

  // Generate donation report from fund data
  // Note: This shows running totals from fund data. For date-filtered reports,
  // use the CSV export which fetches actual records.
  const loadDonationReport = React.useCallback(async () => {
    setReportLoading(true);
    try {
      // Calculate summaries from current fund data
      const summaries: DonationSummary[] = funds
        .filter(f => !reportFundId || f.id === reportFundId)
        .map(fund => ({
          fundId: fund.id,
          fundName: fund.name,
          totalAmount: fund.amountRaisedCents / 100,
          donationCount: 0,
          currency: fund.currency,
        }));

      setDonationSummaries(summaries);
      
      const total = summaries.reduce((acc, s) => ({
        amount: acc.amount + s.totalAmount,
        count: acc.count + s.donationCount,
      }), { amount: 0, count: 0 });
      
      setReportTotal(total);
    } catch (error) {
      console.error('Failed to load donation report', error);
    } finally {
      setReportLoading(false);
    }
  }, [funds, reportFundId]);

  // Load report when filters change or funds are loaded
  React.useEffect(() => {
    if (funds.length > 0) {
      loadDonationReport();
    }
  }, [funds, loadDonationReport]);

  // Export donation records as CSV
  const exportDonationsCsv = async () => {
    try {
      const params = new URLSearchParams();
      params.set('export', 'csv');
      if (reportStartDate) params.set('startDate', reportStartDate);
      if (reportEndDate) params.set('endDate', reportEndDate);
      if (reportFundId) params.set('fundId', reportFundId);

      const res = await fetch(`/api/tenants/${tenant.id}/donations/records?${params.toString()}`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to export donations');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donations-${tenant.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || 'Failed to export donations');
    }
  };

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Donation Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Configure how your community can receive donations. The main “Enable Donations” toggle is in the <span className="font-semibold text-amber-700">Features</span> tab.</p>
        </div>
        
        <div className="space-y-6">
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">Donation Mode</label>
              <select
                id="mode"
                name="mode"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={settings.mode}
                onChange={(e) => handleSettingsChange('mode', e.target.value as 'EXTERNAL' | 'INTEGRATED')}
              >
                <option value="EXTERNAL">External Link (e.g., PayPal, GoFundMe)</option>
                <option value="INTEGRATED">Integrated Form (Mock)</option>
              </select>
            </div>

            {settings.mode === 'EXTERNAL' && (
                <Input 
                    label="External Donation URL"
                    id="externalUrl"
                    name="externalUrl"
                    type="url"
                    value={settings.externalUrl || ''}
                    onChange={e => handleSettingsChange('externalUrl', e.target.value)}
                    placeholder="https://www.paypal.com/donate/..."
                />
            )}
        </div>
        
         <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Donation Form</h3>
            <p className="mt-1 text-sm text-gray-500">Customize the integrated donation form.</p>
        </div>
        <div className="space-y-6">
             <Input 
                label="Currency"
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={e => handleSettingsChange('currency', e.target.value.toUpperCase())}
                placeholder="USD"
                className="w-24"
            />
            <Input 
                label="Suggested Amounts (comma-separated)"
                id="suggestedAmounts"
                name="suggestedAmounts"
                value={suggestedAmounts.join(', ')}
                onChange={handleAmountChange}
                placeholder="5, 10, 25, 50, 100"
            />
             <ToggleSwitch
                label="Allow Custom Amounts"
                description="Let donors enter an amount not listed above."
                enabled={settings.allowCustomAmounts}
                onChange={enabled => handleSettingsChange('allowCustomAmounts', enabled)}
            />
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Ways to Give</h3>
          <p className="mt-1 text-sm text-gray-500">Add the giving methods your congregation supports. URLs and handles are shown on the donations page.</p>
        </div>
        <div className="space-y-4">
          <Input
            label="PayPal Link"
            id="paypalUrl"
            name="paypalUrl"
            type="url"
            value={settings.paypalUrl}
            onChange={e => handleSettingsChange('paypalUrl', e.target.value)}
            placeholder="https://www.paypal.com/donate/..."
          />
          <Input
            label="Venmo Handle"
            id="venmoHandle"
            name="venmoHandle"
            value={settings.venmoHandle}
            onChange={e => handleSettingsChange('venmoHandle', e.target.value)}
            placeholder="@yourchurch"
          />
          <Input
            label="Zelle Email"
            id="zelleEmail"
            name="zelleEmail"
            type="email"
            value={settings.zelleEmail}
            onChange={e => handleSettingsChange('zelleEmail', e.target.value)}
            placeholder="giving@yourchurch.org"
          />
          <Input
            label="Cash App Tag"
            id="cashAppTag"
            name="cashAppTag"
            value={settings.cashAppTag}
            onChange={e => handleSettingsChange('cashAppTag', e.target.value)}
            placeholder="$YourChurch"
          />
          <Input
            label="Text-to-Give Number"
            id="textToGiveNumber"
            name="textToGiveNumber"
            value={settings.textToGiveNumber}
            onChange={e => handleSettingsChange('textToGiveNumber', e.target.value)}
            placeholder="(555) 123-4567"
          />
          <div>
            <label htmlFor="mailingAddress" className="block text-sm font-medium text-gray-700 mb-1">Mailing Address for Checks</label>
            <textarea
              id="mailingAddress"
              name="mailingAddress"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.mailingAddress}
              onChange={e => handleSettingsChange('mailingAddress', e.target.value)}
              placeholder={"123 Main St\nCity, ST 12345"}
            />
          </div>
          <div>
            <label htmlFor="bankTransferInstructions" className="block text-sm font-medium text-gray-700 mb-1">Bank Transfer / ACH Instructions</label>
            <textarea
              id="bankTransferInstructions"
              name="bankTransferInstructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.bankTransferInstructions}
              onChange={e => handleSettingsChange('bankTransferInstructions', e.target.value)}
              placeholder="Routing number, account number, and any notes."
            />
          </div>
          <Input
            label="Tax ID / EIN"
            id="taxId"
            name="taxId"
            value={settings.taxId}
            onChange={e => handleSettingsChange('taxId', e.target.value)}
            placeholder="12-3456789"
          />
          <div>
            <label htmlFor="otherGivingLinks" className="block text-sm font-medium text-gray-700 mb-1">Other Giving Links (one per line, Label | URL)</label>
            <textarea
              id="otherGivingLinks"
              name="otherGivingLinks"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={serializeOtherGivingLinks(settings.otherGivingLinks)}
              onChange={handleOtherLinksChange}
              placeholder={"Cryptocurrency | https://yourlink\nEmployer Matching | https://matching.example.com"}
            />
          </div>
          <div>
            <label htmlFor="otherGivingNotes" className="block text-sm font-medium text-gray-700 mb-1">Other Instructions</label>
            <textarea
              id="otherGivingNotes"
              name="otherGivingNotes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.otherGivingNotes}
              onChange={e => handleSettingsChange('otherGivingNotes', e.target.value)}
              placeholder="e.g., stock donations, in-service giving boxes, planned giving."
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Leaderboard</h3>
        </div>
        <div className="space-y-6">
            <ToggleSwitch
                label="Enable Leaderboard"
                description="Show a list of top donors on the donations page."
                enabled={settings.leaderboardEnabled}
                onChange={enabled => handleSettingsChange('leaderboardEnabled', enabled)}
            />
            {settings.leaderboardEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="leaderboardVisibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                      <select id="leaderboardVisibility" name="leaderboardVisibility" className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                         value={settings.leaderboardVisibility} onChange={e => handleSettingsChange('leaderboardVisibility', e.target.value as 'PUBLIC' | 'MEMBERS_ONLY')}
                      >
                        <option value="MEMBERS_ONLY">Members Only</option>
                        <option value="PUBLIC">Public</option>
                      </select>
                    </div>
                     <div>
                      <label htmlFor="leaderboardTimeframe" className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                      <select id="leaderboardTimeframe" name="leaderboardTimeframe" className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                        value={settings.leaderboardTimeframe} onChange={e => handleSettingsChange('leaderboardTimeframe', e.target.value as 'ALL_TIME' | 'YEARLY' | 'MONTHLY')}
                      >
                        <option value="ALL_TIME">All Time</option>
                        <option value="YEARLY">This Year</option>
                        <option value="MONTHLY">This Month</option>
                      </select>
                    </div>
                </div>
            )}
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Funds & Designations</h3>
          <p className="mt-1 text-sm text-gray-500">Create dedicated funds with visibility rules, guardrails, and goal tracking.</p>
        </div>
        <div className="space-y-4">
          <form onSubmit={handleFundSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fund Name" id="fundName" name="fundName" value={fundForm.name} onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fundType">Fund Type</label>
              <select
                id="fundType"
                name="fundType"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                value={fundForm.type}
                onChange={(e) => setFundForm({ ...fundForm, type: e.target.value as any })}
              >
                <option value="TITHE">Tithe</option>
                <option value="OFFERING">Offering</option>
                <option value="PROJECT">Project</option>
                <option value="SPECIAL">Special</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fundVisibility">Visibility</label>
              <select
                id="fundVisibility"
                name="fundVisibility"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                value={fundForm.visibility}
                onChange={(e) => setFundForm({ ...fundForm, visibility: e.target.value as any })}
              >
                <option value="PUBLIC">Public</option>
                <option value="MEMBERS_ONLY">Members Only</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
            <Input label="Currency" id="fundCurrency" name="fundCurrency" value={fundForm.currency} onChange={(e) => setFundForm({ ...fundForm, currency: e.target.value.toUpperCase() })} />
            <Input label="Goal Amount" id="fundGoal" name="fundGoal" type="number" value={fundForm.goalAmount} onChange={(e) => setFundForm({ ...fundForm, goalAmount: e.target.value })} placeholder="e.g., 10000" />
            <Input label="Min Amount" id="fundMin" name="fundMin" type="number" value={fundForm.minAmount} onChange={(e) => setFundForm({ ...fundForm, minAmount: e.target.value })} placeholder="Optional" />
            <Input label="Max Amount" id="fundMax" name="fundMax" type="number" value={fundForm.maxAmount} onChange={(e) => setFundForm({ ...fundForm, maxAmount: e.target.value })} placeholder="Optional" />
            <ToggleSwitch label="Allow Anonymous" enabled={fundForm.allowAnonymous} onChange={(enabled) => setFundForm({ ...fundForm, allowAnonymous: enabled })} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fundDescription">Description</label>
              <textarea id="fundDescription" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" value={fundForm.description} onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })} placeholder="How will these gifts be used?" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={resetFundForm}>{editingFundId ? 'Cancel' : 'Reset'}</Button>
              <Button type="submit">{editingFundId ? 'Update Fund' : 'Add Fund'}</Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={exportCsv}>Export CSV</Button>
            <Button type="button" variant="secondary" onClick={handleImport}>Import from CSV</Button>
            <p className="text-xs text-gray-500">Columns: name,type,visibility,currency,goalAmountCents,amountRaisedCents,allowAnonymous</p>
          </div>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            rows={3}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV rows here to import"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">Fund List</h4>
              {fundsLoading && <span className="text-xs text-gray-500">Loading…</span>}
            </div>
            {funds.length === 0 && !fundsLoading && (
              <p className="text-sm text-gray-600">No funds yet. Add your first fund to start tracking donations.</p>
            )}
            <div className="space-y-3">
              {funds.map((fund) => {
                const progress = fund.goalAmountCents ? Math.min(100, Math.round((fund.amountRaisedCents / fund.goalAmountCents) * 100)) : null;
                return (
                  <div key={fund.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-amber-700">{fund.type}</p>
                        <p className="text-lg font-semibold text-gray-900">{fund.name}</p>
                        <p className="text-xs text-gray-500">{fund.visibility} · {fund.currency}</p>
                        {fund.description && <p className="text-sm text-gray-600 mt-1">{fund.description}</p>}
                        <p className="text-sm text-gray-700 mt-2">Raised {(fund.amountRaisedCents / 100).toLocaleString(undefined, { style: 'currency', currency: fund.currency })}{fund.goalAmountCents ? ` of ${(fund.goalAmountCents / 100).toLocaleString(undefined, { style: 'currency', currency: fund.currency })}` : ''}</p>
                        {progress !== null && (
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="secondary" onClick={() => handleEditFund(fund)}>Edit</Button>
                        {!fund.archivedAt && <Button type="button" variant="secondary" onClick={() => handleArchiveFund(fund.id)}>Archive</Button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donation Reporting Section */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900">Donation Reports</h4>
              <p className="text-sm text-gray-500 mt-1">View donation summaries by fund and export records.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  value={reportFundId}
                  onChange={(e) => setReportFundId(e.target.value)}
                >
                  <option value="">All Funds</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>{fund.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={exportDonationsCsv}>
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Fund Summaries */}
            {reportLoading ? (
              <p className="text-sm text-gray-500">Loading report...</p>
            ) : (
              <div className="space-y-3">
                {donationSummaries.length === 0 ? (
                  <p className="text-sm text-gray-600">No donation data available.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {donationSummaries.map((summary) => (
                        <div key={summary.fundId} className="rounded-lg border border-gray-200 p-4 bg-white">
                          <h5 className="font-medium text-gray-900">{summary.fundName}</h5>
                          <p className="text-2xl font-bold text-amber-600 mt-1">
                            {summary.totalAmount.toLocaleString(undefined, { style: 'currency', currency: summary.currency })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Total raised</p>
                        </div>
                      ))}
                    </div>
                    
                    {reportTotal && reportTotal.amount > 0 && (
                      <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Total Across All Funds</span>
                          <span className="text-2xl font-bold text-amber-700">
                            {reportTotal.amount.toLocaleString(undefined, { style: 'currency', currency: settings.currency })}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-md font-semibold text-gray-900">Recent Fund Activity (Audit Log)</h4>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-600">No fund changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                {auditLogs.slice(0, 10).map((log) => (
                  <li key={log.id} className="p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.actionType}</span>
                      <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.metadata?.fund?.name && <p className="text-xs text-gray-600">{log.metadata.fund.name}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="text-right border-t border-gray-200 pt-6">
            <Button
              disabled={isSaving}
              onClick={async () => {
                try {
                  setIsSaving(true);
                  await onSave({ settings: { ...tenant.settings } });
                  alert('Donation settings saved');
                } catch (error: any) {
                  alert(error.message || 'Failed to save donation settings');
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    </div>
  );
};

export default DonationsTab;
