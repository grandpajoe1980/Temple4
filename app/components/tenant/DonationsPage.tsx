"use client"

import React, { useEffect, useMemo, useState } from 'react';
import type { DonationSettings, EnrichedDonationRecord, FundWithProgress, TenantSettings } from '@/types';
// Use server API routes instead of importing server-only helpers
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';

interface DonationsPageProps {
  tenant: {
    id: string;
    name: string;
    settings: TenantSettings;
  };
  user: {
    id: string;
    profile: { displayName: string };
  };
  onRefresh?: () => void;
}

interface LeaderboardProps {
    tenant: DonationsPageProps['tenant'];
    donations: EnrichedDonationRecord[];
}

const formatTimeframeLabel = (timeframe?: DonationSettings['leaderboardTimeframe']) =>
    (timeframe ?? 'ALL_TIME').replace('_', ' ').toLowerCase();

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

const leaderboardTimeframeFilter = (
    donations: EnrichedDonationRecord[],
    timeframe: DonationSettings['leaderboardTimeframe'],
) => {
    if (timeframe === 'ALL_TIME') return donations;

    const now = new Date();
    const startDate = new Date(now);
    if (timeframe === 'YEARLY') {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
    }
    if (timeframe === 'MONTHLY') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    }

    return donations.filter((donation) => donation.donatedAt >= startDate);
};

const Leaderboard: React.FC<LeaderboardProps> = ({ tenant, donations }) => {
    const timeframe = tenant.settings?.donationSettings?.leaderboardTimeframe ?? 'ALL_TIME';
    const filteredDonations = useMemo(
        () => leaderboardTimeframeFilter(donations, timeframe),
        [donations, timeframe],
    );

    const aggregatedDonations = useMemo(() => {
        const userTotals: { [key: string]: { total: number; name: string; avatar?: string } } = {};

        filteredDonations.forEach((donation) => {
            if (donation.isAnonymousOnLeaderboard) {
                return;
            }
            const key = donation.userId || donation.displayName;
            if (!userTotals[key]) {
                userTotals[key] = { total: 0, name: donation.displayName, avatar: donation.userAvatarUrl };
            }
            userTotals[key].total += donation.amount;
        });

        return Object.values(userTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

    }, [filteredDonations]);

    return (
        <Card title={`Top Donors (${formatTimeframeLabel(timeframe)})`}>
            {aggregatedDonations.length > 0 ? (
                 <ul className="divide-y divide-gray-200">
                    {aggregatedDonations.map((donor, index) => (
                        <li key={donor.name + index} className="py-3 flex items-center">
                            <div className="w-8 text-lg font-bold text-gray-400">{index + 1}</div>
                             {donor.avatar && <img className="h-10 w-10 rounded-full" src={donor.avatar} alt={donor.name} />}
                            <div className={`flex-1 ${!donor.avatar && 'ml-10'}`}>
                                <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                            </div>
                            <p className="text-sm font-semibold text-amber-700">
                                ${donor.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">No donations to display for this period.</p>
            )}
        </Card>
    )
}


const DonationsPage: React.FC<DonationsPageProps> = ({ tenant, user, onRefresh }) => {
  const settings = { ...defaultDonationSettings, ...(tenant.settings?.donationSettings || {}) };
  const suggestedAmounts = settings.suggestedAmounts?.length
    ? settings.suggestedAmounts
    : DEFAULT_SUGGESTED_AMOUNTS;
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(
    () => suggestedAmounts[0] ?? 'custom',
  );
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [donations, setDonations] = useState<EnrichedDonationRecord[]>([]);
  const [funds, setFunds] = useState<FundWithProgress[]>([]);
  const [fundsLoading, setFundsLoading] = useState(true);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [designationNote, setDesignationNote] = useState('');
  const selectedFund = useMemo(() => funds.find((fund) => fund.id === selectedFundId) || null, [funds, selectedFundId]);

  useEffect(() => {
    let isMounted = true;
    setFundsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/donations/funds`);
        if (!res.ok) {
          console.warn('Unable to load funds', res.status);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setFunds(data || []);
          if (!selectedFundId && data?.length) {
            setSelectedFundId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch funds', error);
      } finally {
        if (isMounted) setFundsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  useEffect(() => {
    let isMounted = true;
    // If leaderboards are not enabled for this tenant, skip fetching leaderboard records
    if (!settings.leaderboardEnabled) {
      setDonations([]);
      return () => { isMounted = false; };
    }

    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/donations/records`);
        if (!res.ok) {
          // Non-OK responses are expected in some cases (e.g. permission/disabled).
          // Read the server message for debugging but don't throw to avoid noisy errors.
          const err = await res.json().catch(() => ({}));
          console.debug('Donations API returned non-OK response', res.status, err);
          return;
        }
        const data = await res.json();
        // API returns { leaderboard, timeframe }
        const records = data.leaderboard || [];
        if (isMounted) setDonations(records.map((r: any) => ({ ...r, donatedAt: new Date(r.donatedAt) })));
      } catch (error) {
        console.error('Failed to load donations', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [settings.leaderboardEnabled, tenant.id]);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = selectedAmount === 'custom' ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid donation amount.');
        return;
    }
    if (!selectedFundId) {
      alert('Please choose a fund to support.');
      return;
    }
    const displayName = (user.profile?.displayName || '').trim() || 'Anonymous Donor';
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/donations/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: settings.currency,
            displayName,
            isAnonymousOnLeaderboard: isAnonymous,
            message,
            fundId: selectedFundId,
            designationNote,
          }),
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to submit donation');
        }
        onRefresh?.();
        setIsSubmitted(true);
      } catch (error) {
        console.error('Failed to submit donation', error);
        alert('Failed to submit donation. Please try again later.');
      }
    })();
  };
  
  const givingMethods = useMemo(() => {
    const methods: Array<{ key: string; label: string; value: string; href?: string; isMultiline?: boolean }> = [];

    if (settings.paypalUrl) methods.push({ key: 'paypal', label: 'PayPal', value: settings.paypalUrl, href: settings.paypalUrl });
    if (settings.venmoHandle) {
      const handle = settings.venmoHandle.replace('@', '');
      methods.push({
        key: 'venmo',
        label: 'Venmo',
        value: `@${handle}`,
        href: `https://venmo.com/${handle}`,
      });
    }
    if (settings.zelleEmail) methods.push({ key: 'zelle', label: 'Zelle', value: settings.zelleEmail });
    if (settings.cashAppTag) {
      const tag = settings.cashAppTag.replace(/^\$/, '');
      methods.push({ key: 'cashapp', label: 'Cash App', value: `$${tag}`, href: `https://cash.app/$${tag}` });
    }
    if (settings.textToGiveNumber) methods.push({ key: 'text', label: 'Text-to-Give', value: settings.textToGiveNumber });
    if (settings.bankTransferInstructions) methods.push({
      key: 'bank',
      label: 'Bank Transfer / ACH',
      value: settings.bankTransferInstructions,
      isMultiline: true,
    });
    if (settings.mailingAddress) methods.push({
      key: 'check',
      label: 'Mail a Check',
      value: settings.mailingAddress,
      isMultiline: true,
    });
    settings.otherGivingLinks?.forEach((link, index) => {
      if (link.label && link.url) {
        methods.push({ key: `other-${index}`, label: link.label, value: link.url, href: link.url });
      }
    });
    if (settings.otherGivingNotes) methods.push({
      key: 'other-notes',
      label: 'Other Ways to Give',
      value: settings.otherGivingNotes,
      isMultiline: true,
    });

    return methods;
  }, [settings.bankTransferInstructions, settings.cashAppTag, settings.mailingAddress, settings.otherGivingLinks, settings.otherGivingNotes, settings.paypalUrl, settings.textToGiveNumber, settings.venmoHandle, settings.zelleEmail]);

  if (isSubmitted) {
      return (
        <Card>
            <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
                <p className="mt-2 text-gray-600">Your generous donation to {tenant.name} is greatly appreciated.</p>
                <Button onClick={() => setIsSubmitted(false)} className="mt-6">Make Another Donation</Button>
            </div>
        </Card>
      );
  }

  const renderGivingOptions = () => {
    const hasGivingOptions = givingMethods.length > 0 || settings.taxId;
    if (!hasGivingOptions) return null;

    return (
      <Card title="Ways to Give">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {givingMethods.map((method) => (
              <div key={method.key} className="p-4 rounded-lg border border-gray-200 bg-white">
                <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                {method.href ? (
                  <a className="text-amber-700 break-words" href={method.href} target="_blank" rel="noopener noreferrer">
                    {method.value}
                  </a>
                ) : (
                  <p className={`text-sm text-gray-700 whitespace-pre-wrap ${method.isMultiline ? '' : 'break-words'}`}>
                    {method.value}
                  </p>
                )}
              </div>
            ))}
          </div>
          {settings.taxId && (
            <p className="text-sm text-gray-600">
              Tax ID / EIN: <span className="font-medium text-gray-900">{settings.taxId}</span>
            </p>
          )}
        </div>
      </Card>
    );
  };

  const renderFundSelector = () => {
    if (fundsLoading) {
      return (
        <Card title="Choose a Fund">
          <p className="text-sm text-gray-600">Loading available funds…</p>
        </Card>
      );
    }

    if (funds.length === 0) {
      return (
        <Card title="Choose a Fund">
          <p className="text-sm text-gray-600">No active funds are available right now. Please check back later.</p>
        </Card>
      );
    }

    return (
      <Card title="Choose a Fund" description="Pick where you want your gift to be designated.">
        <div className="grid grid-cols-1 gap-4">
          {funds.map((fund) => {
            const progress = fund.goalAmountCents
              ? Math.min(100, Math.round((fund.amountRaisedCents / fund.goalAmountCents) * 100))
              : null;
            return (
              <button
                type="button"
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`w-full text-left rounded-lg border p-4 transition hover:border-amber-500 ${selectedFundId === fund.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-wide text-amber-700">{fund.type}</p>
                    <p className="text-lg font-semibold text-gray-900">{fund.name}</p>
                    {fund.description && <p className="text-sm text-gray-600">{fund.description}</p>}
                    <p className="text-xs text-gray-500">
                      {fund.visibility === 'MEMBERS_ONLY' ? 'Members only' : fund.visibility === 'HIDDEN' ? 'Hidden' : 'Public'} · {fund.currency}
                    </p>
                    {(fund.startDate || fund.endDate) && (
                      <p className="text-xs text-gray-500">
                        {fund.startDate ? `Starts ${new Date(fund.startDate).toLocaleDateString()}` : 'Open now'}
                        {' '}• {fund.endDate ? `Ends ${new Date(fund.endDate).toLocaleDateString()}` : 'No end date'}
                      </p>
                    )}
                    {(fund.minAmountCents || fund.maxAmountCents) && (
                      <p className="text-xs text-gray-600">{fund.minAmountCents ? `Min ${(fund.minAmountCents / 100).toFixed(2)}` : ''} {fund.maxAmountCents ? `Max ${(fund.maxAmountCents / 100).toFixed(2)}` : ''}</p>
                    )}
                  </div>
                  {progress !== null && (
                    <div className="text-right min-w-[120px]">
                      <p className="text-sm font-semibold text-amber-700">{progress}% funded</p>
                      <p className="text-xs text-gray-500">
                        ${(fund.amountRaisedCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} / {(fund.goalAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
                {progress !== null && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderPledgeForm = (subtitle?: string) => (
    <form onSubmit={handleDonate}>
      <Card title={`Make a Donation${selectedFund ? ` to ${selectedFund.name}` : ''}`} description={subtitle || `Your support for ${tenant.name} is greatly appreciated.`}>
        <div className="space-y-6">
          {selectedFund && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">{selectedFund.name}</p>
              {selectedFund.goalAmountCents && (
                <p className="mt-1">Goal: {(selectedFund.goalAmountCents / 100).toLocaleString(undefined, { style: 'currency', currency: selectedFund.currency })}</p>
              )}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Select a Pledge Amount ({selectedFund?.currency || settings.currency})</label>
              <span className="text-xs font-medium text-amber-700">Adds to the leaderboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestedAmounts.map((amount: number) => (
                <button type="button" key={amount} onClick={() => setSelectedAmount(amount)}
                  className={`p-4 text-center rounded-md border-2 font-semibold transition-colors ${selectedAmount === amount ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-300 hover:border-amber-400'}`}
                >
                  ${amount}
                </button>
              ))}
              {settings.allowCustomAmounts && (
                   <button type="button" onClick={() => setSelectedAmount('custom')}
                      className={`p-4 text-center rounded-md border-2 font-semibold transition-colors ${selectedAmount === 'custom' ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-300 hover:border-amber-400'}`}
                   >
                      Custom
                  </button>
              )}
            </div>
          </div>
          {selectedAmount === 'custom' && settings.allowCustomAmounts && (
              <Input 
                  label="Custom Amount"
                  id="customAmount"
                  name="customAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="e.g., 75.50"
                  required
              />
          )}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea id="message" name="message" rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={message} onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Input
            label="Dedication or designation note"
            id="designationNote"
            name="designationNote"
            value={designationNote}
            onChange={(e) => setDesignationNote(e.target.value)}
            placeholder="e.g., In honor of our youth group"
          />
          <ToggleSwitch
              label="Remain Anonymous on Leaderboard"
              enabled={isAnonymous}
              onChange={setIsAnonymous}
          />
        </div>
         <div className="text-right border-t border-gray-200 pt-6 mt-6">
              <Button type="submit">Donate Now</Button>
          </div>
      </Card>
    </form>
  );

  const renderContent = () => {
    if (fundsLoading) {
      return <Card><p className="py-6 text-center text-sm text-gray-600">Loading donation experience…</p></Card>;
    }

    if (!selectedFund && funds.length === 0) {
      return (
        <Card>
          <div className="py-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800">No active funds yet</h3>
            <p className="mt-2 text-sm text-gray-600">Admins can add funds in the Donations settings to start receiving designated gifts.</p>
          </div>
        </Card>
      );
    }

    if (!selectedFund) {
      return (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-700">Select a fund to continue.</p>
          </div>
        </Card>
      );
    }

    if (settings.mode === 'EXTERNAL') {
      return (
        <>
          <Card>
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-800">Donate to {tenant.name}</h3>
              <p className="mt-2 text-gray-600">This community accepts donations via an external service. Click the button below to be redirected.</p>
              <a href={settings.externalUrl} target="_blank" rel="noopener noreferrer">
                <Button className="mt-6">Proceed to Donation Site</Button>
              </a>
            </div>
          </Card>
          {renderPledgeForm('Pledge an amount to be counted toward the leaderboard, then complete payment on the external site.')}
        </>
      );
    }

    return renderPledgeForm();
  };

  if (!tenant.settings?.enableDonations) {
    return (
      <Card>
        <div className="text-center py-12 space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">Donations are not enabled</h3>
          <p className="text-gray-600">Please contact this community’s administrator for giving options.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Donations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Support the mission and work of {tenant.name}.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {renderFundSelector()}
            {renderContent()}
            {renderGivingOptions()}
        </div>
        <div className="lg:col-span-1">
             {settings.leaderboardEnabled && (
                <Leaderboard tenant={tenant} donations={donations} />
            )}
        </div>
      </div>
    </div>
  );
};

export default DonationsPage;
