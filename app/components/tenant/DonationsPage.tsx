"use client"

import React, { useEffect, useMemo, useState } from 'react';
import type { DonationSettings, EnrichedDonationRecord } from '@/types';
// Use server API routes instead of importing server-only helpers
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';

interface DonationsPageProps {
  tenant: {
    id: string;
    name: string;
    settings: { donationSettings: DonationSettings };
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
    const timeframe = tenant.settings.donationSettings.leaderboardTimeframe;
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
        <Card title={`Top Donors (${timeframe.replace('_', ' ').toLowerCase()})`}>
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
  const defaultSettings: DonationSettings = {
    mode: 'EXTERNAL',
    currency: 'USD',
    suggestedAmounts: [],
    allowCustomAmounts: true,
    leaderboardEnabled: false,
    leaderboardVisibility: 'PUBLIC',
    leaderboardTimeframe: 'ALL_TIME',
  };

  const settings = tenant.settings?.donationSettings || defaultSettings;
  const suggestedAmounts = settings.suggestedAmounts || [];
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(
    () => suggestedAmounts[0] ?? 'custom',
  );
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [donations, setDonations] = useState<EnrichedDonationRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/donations/records`);
        if (!res.ok) throw new Error('Failed to load donations');
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
  }, [tenant.id]);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = selectedAmount === 'custom' ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid donation amount.');
        return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/donations/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: settings.currency,
            displayName: user.profile?.displayName,
            isAnonymousOnLeaderboard: isAnonymous,
            message,
          }),
        });
        if (!res.ok) throw new Error('Failed to submit donation');
        onRefresh?.();
        setIsSubmitted(true);
      } catch (error) {
        console.error('Failed to submit donation', error);
        alert('Failed to submit donation. Please try again later.');
      }
    })();
  };
  
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

  const renderContent = () => {
    if (settings.mode === 'EXTERNAL') {
      return (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-800">Donate to {tenant.name}</h3>
            <p className="mt-2 text-gray-600">This community accepts donations via an external service. Click the button below to be redirected.</p>
            <a href={settings.externalUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-6">Proceed to Donation Site</Button>
            </a>
          </div>
        </Card>
      );
    }

    return (
      <form onSubmit={handleDonate}>
        <Card title="Make a Donation" description={`Your support for ${tenant.name} is greatly appreciated.`}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select an Amount ({settings.currency})</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {settings.suggestedAmounts.map((amount: number) => (
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
  };

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
        <div className="lg:col-span-2">
            {renderContent()}
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
