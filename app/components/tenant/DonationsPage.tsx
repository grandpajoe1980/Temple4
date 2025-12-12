"use client"

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import type { DonationSettings, EnrichedDonationRecord, FundWithProgress, TenantSettings } from '@/types';
// Use server API routes instead of importing server-only helpers
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import useTranslation from '@/app/hooks/useTranslation';

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
  const { t } = useTranslation();
  const timeframe = tenant.settings?.donationSettings?.leaderboardTimeframe ?? 'ALL_TIME';
  const filteredDonations = useMemo(
    () => leaderboardTimeframeFilter(donations, timeframe),
    [donations, timeframe],
  );

  const aggregatedDonations = useMemo(() => {
    const userTotals: { [key: string]: { total: number; name: string; avatar?: string; userId?: string | number | null } } = {};

    filteredDonations.forEach((donation) => {
      if (donation.isAnonymousOnLeaderboard) {
        return;
      }
      const key = donation.userId || donation.displayName;
      if (!userTotals[key]) {
        userTotals[key] = { total: 0, name: donation.displayName, avatar: donation.userAvatarUrl, userId: donation.userId };
      }
      userTotals[key].total += donation.amount;
    });

    return Object.values(userTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

  }, [filteredDonations]);

  return (
    <Card title={t('donations.topDonors', { timeframe: formatTimeframeLabel(timeframe) })}>
      {aggregatedDonations.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {aggregatedDonations.map((donor, index) => (
            <li key={donor.name + index} className="py-3 flex items-center">
              <div className="w-8 text-lg font-bold text-gray-400">{index + 1}</div>
              <div className={`flex-1 flex items-center ${!donor.avatar ? 'pl-2' : ''}`}>
                {donor.userId ? (
                  <UserLink userId={donor.userId} className="flex items-center space-x-3">
                    {donor.avatar ? (
                      <Avatar src={donor.avatar} name={donor.name} size="md" className="h-10 w-10" />
                    ) : (
                      <div className="w-10" />
                    )}
                    <div className={`${!donor.avatar && 'ml-8'}`}>
                      <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                    </div>
                  </UserLink>
                ) : (
                  <>
                    {donor.avatar && <Avatar src={donor.avatar} name={donor.name} size="md" className="h-10 w-10" />}
                    <div className={`ml-3 ${!donor.avatar && 'ml-10'}`}>
                      <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm font-semibold tenant-text-primary">
                ${donor.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">{t('donations.noDonationsToDisplay')}</p>
      )}
    </Card>
  )
}


const DonationsPage: React.FC<DonationsPageProps> = ({ tenant, user, onRefresh }) => {
  const { t } = useTranslation();
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
          <h3 className="text-2xl font-bold text-gray-900">{t('donations.thankYou')}</h3>
          <p className="mt-2 text-gray-600">{t('donations.thankYouMessage', { name: tenant.name })}</p>
          <Button onClick={() => setIsSubmitted(false)} className="mt-6">{t('donations.makeAnother')}</Button>
        </div>
      </Card>
    );
  }

  const renderGivingOptions = () => {
    const hasGivingOptions = givingMethods.length > 0 || settings.taxId;
    if (!hasGivingOptions) return null;

    return (
      <Card title={t('donations.waysToGive')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {givingMethods.map((method) => (
              <div key={method.key} className="p-4 rounded-lg border border-gray-200 bg-white">
                <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                {method.href ? (
                  <a className="tenant-text-primary break-words" href={method.href} target="_blank" rel="noopener noreferrer">
                    {method.value}
                  </a>
                ) : (
                  <p className={`text-sm text-gray-700 whitespace-pre-wrap ${method.isMultiline ? '' : 'break-words'}`}>
                    {method.value}
                  </p>
                )}
                {/* QR Code for Venmo - helps mobile users scan to open Venmo app */}
                {method.key === 'venmo' && method.href && (
                  <div className="mt-3 flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(method.href)}`}
                      alt="Venmo QR Code"
                      className="rounded border border-gray-100"
                      width={120}
                      height={120}
                    />
                    <p className="text-xs text-gray-500 mt-1">Scan to open Venmo</p>
                  </div>
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
        <Card title={t('donations.chooseFund')}>
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        </Card>
      );
    }

    if (funds.length === 0) {
      return (
        <Card title={t('donations.chooseFund')}>
          <p className="text-sm text-gray-600">{t('donations.noActiveFunds')}</p>
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
                className={`w-full text-left rounded-lg border p-4 transition hover:border-[color:var(--primary)] ${selectedFundId === fund.id ? 'border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-wide tenant-text-primary">{fund.type}</p>
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
                      <p className="text-sm font-semibold tenant-text-primary">{progress}% funded</p>
                      <p className="text-xs text-gray-500">
                        ${(fund.amountRaisedCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} / {((fund.goalAmountCents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
                {progress !== null && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full tenant-active" style={{ width: `${progress}%` }} />
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
            <div className="rounded-lg tenant-bg-50 p-3 text-sm tenant-text-primary">
              <p className="font-semibold">{selectedFund.name}</p>
              {selectedFund.goalAmountCents && (
                <p className="mt-1">Goal: {(selectedFund.goalAmountCents / 100).toLocaleString(undefined, { style: 'currency', currency: selectedFund.currency })}</p>
              )}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Select a Pledge Amount ({selectedFund?.currency || settings.currency})</label>
              <span className="text-xs font-medium tenant-text-primary">Adds to the leaderboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestedAmounts.map((amount: number) => (
                <button type="button" key={amount} onClick={() => setSelectedAmount(amount)}
                  className={`p-4 text-center rounded-md border-2 font-semibold transition-colors ${selectedAmount === amount ? 'tenant-bg-100 border-[color:var(--primary)] text-[color:var(--primary)]' : 'bg-white border-gray-300 hover:border-[color:var(--primary)]/40'}`}
                >
                  ${amount}
                </button>
              ))}
              {settings.allowCustomAmounts && (
                <button type="button" onClick={() => setSelectedAmount('custom')}
                  className={`p-4 text-center rounded-md border-2 font-semibold transition-colors ${selectedAmount === 'custom' ? 'tenant-bg-100 border-[color:var(--primary)] text-[color:var(--primary)]' : 'bg-white border-gray-300 hover:border-[color:var(--primary)]/40'}`}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900"
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
          <Button type="submit">{t('donations.donateNow')}</Button>
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
          <h3 className="text-xl font-semibold text-gray-800">{t('donations.notEnabled')}</h3>
          <p className="text-gray-600">{t('donations.contactAdmin')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[color:var(--primary)]/10 to-orange-50 p-8 md:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 tenant-bg-50 rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100 rounded-full -ml-24 -mb-24 opacity-50" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Support {tenant.name}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Your generosity makes a difference. Every gift, no matter the size, helps us continue our mission
            and serve our community. Thank you for partnering with us.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button onClick={() => { if (funds[0]) setSelectedFundId(funds[0].id); }}>
              {t('menu.giveNow')}
            </Button>
            <Link href={`/tenants/${tenant.id}/donations/funds`}>
              <Button variant="secondary">{t('donations.browseAllFunds')}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {funds.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold tenant-text-primary">{funds.length}</p>
              <p className="text-sm text-gray-500">{t('donations.activeFunds')}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold tenant-text-primary">
                ${funds.reduce((sum, f) => sum + f.amountRaisedCents, 0) / 100 >= 1000
                  ? `${(funds.reduce((sum, f) => sum + f.amountRaisedCents, 0) / 100000).toFixed(1)}k`
                  : (funds.reduce((sum, f) => sum + f.amountRaisedCents, 0) / 100).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{t('donations.totalRaised')}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold tenant-text-primary">
                {funds.filter(f => f.goalAmountCents && f.amountRaisedCents >= f.goalAmountCents).length}
              </p>
              <p className="text-sm text-gray-500">{t('donations.goalsMet')}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold tenant-text-primary">
                {settings.leaderboardEnabled ? donations.length : '—'}
              </p>
              <p className="text-sm text-gray-500">{t('donations.donors')}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Funds */}
          {funds.length > 0 && (
            <Card title={t('donations.featuredGiving')} description={t('donations.featuredGivingDesc')}>
              <div className="space-y-4">
                {funds.slice(0, 3).map((fund) => {
                  const progress = fund.goalAmountCents
                    ? Math.min(100, Math.round((fund.amountRaisedCents / fund.goalAmountCents) * 100))
                    : null;
                  return (
                    <button
                      type="button"
                      key={fund.id}
                      onClick={() => setSelectedFundId(fund.id)}
                      className={`w-full text-left rounded-lg border p-4 transition hover:border-[color:var(--primary)] ${selectedFundId === fund.id ? 'border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20 tenant-bg-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs uppercase tracking-wide tenant-text-primary font-medium">{fund.type}</p>
                          <p className="text-lg font-semibold text-gray-900">{fund.name}</p>
                          {fund.description && <p className="text-sm text-gray-600 line-clamp-2">{fund.description}</p>}
                        </div>
                        {progress !== null && (
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm font-semibold tenant-text-primary">{progress}%</p>
                            <p className="text-xs text-gray-500">
                              ${(fund.amountRaisedCents / 100).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {progress !== null && (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full bg-[color:var(--primary)]" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
                {funds.length > 3 && (
                  <div className="text-center pt-2">
                    <Link href={`/tenants/${tenant.id}/donations/funds`} className="text-sm font-medium tenant-text-primary hover:text-[color:var(--primary)]">
                      View all {funds.length} funds →
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          )}

          {renderContent()}
          {renderGivingOptions()}
        </div>
        <div className="lg:col-span-1 space-y-6">
          {settings.leaderboardEnabled && (
            <Leaderboard tenant={tenant} donations={donations} />
          )}

          {/* Impact Section */}
          <Card title={t('donations.yourImpact')}>
            <div className="space-y-4 text-sm text-gray-600">
              <p>When you give to {tenant.name}, you&apos;re supporting:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[color:var(--primary)] mt-0.5">✓</span>
                  <span>Weekly worship services and programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[color:var(--primary)] mt-0.5">✓</span>
                  <span>Community outreach and missions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[color:var(--primary)] mt-0.5">✓</span>
                  <span>Youth and children&apos;s ministry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[color:var(--primary)] mt-0.5">✓</span>
                  <span>Facility maintenance and improvements</span>
                </li>
              </ul>
              {settings.taxId && (
                <p className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                  Tax-deductible. Tax ID: {settings.taxId}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DonationsPage;
