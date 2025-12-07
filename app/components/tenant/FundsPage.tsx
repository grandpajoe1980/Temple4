'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { FundWithProgress, TenantSettings, DonationSettings } from '@/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';

interface FundsPageProps {
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

const DEFAULT_SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500];

const FundsPage: React.FC<FundsPageProps> = ({ tenant, user }) => {
  const [funds, setFunds] = useState<FundWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFund, setSelectedFund] = useState<FundWithProgress | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  
  // Donation form state
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [designationNote, setDesignationNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const settings = tenant.settings?.donationSettings as DonationSettings | undefined;
  const suggestedAmounts = settings?.suggestedAmounts?.length
    ? settings.suggestedAmounts
    : DEFAULT_SUGGESTED_AMOUNTS;

  useEffect(() => {
    fetchFunds();
  }, [tenant.id]);

  const fetchFunds = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/donations/funds`);
      if (res.ok) {
        const data = await res.json();
        setFunds(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;

    const amount = selectedAmount === 'custom' ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    setSubmitting(true);
    try {
      const displayName = user.profile?.displayName || 'Anonymous Donor';
      const res = await fetch(`/api/tenants/${tenant.id}/donations/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: selectedFund.currency,
          displayName,
          isAnonymousOnLeaderboard: isAnonymous,
          message,
          fundId: selectedFund.id,
          designationNote,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to submit donation');
      }

      setSubmitted(true);
      fetchFunds(); // Refresh fund progress
    } catch (error) {
      console.error('Failed to donate:', error);
      alert('Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDonateModal = (fund: FundWithProgress) => {
    setSelectedFund(fund);
    setShowDonateModal(true);
    setSubmitted(false);
    setSelectedAmount(50);
    setCustomAmount('');
    setMessage('');
    setDesignationNote('');
    setIsAnonymous(false);
  };

  const closeDonateModal = () => {
    setShowDonateModal(false);
    setSelectedFund(null);
  };

  // Group funds by type
  const fundsByType = useMemo(() => {
    const grouped: Record<string, FundWithProgress[]> = {};
    funds.forEach(fund => {
      const type = fund.type || 'OTHER';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(fund);
    });
    return grouped;
  }, [funds]);

  const typeLabels: Record<string, string> = {
    TITHE: 'Tithes',
    OFFERING: 'Offerings',
    PROJECT: 'Projects & Campaigns',
    SPECIAL: 'Special Giving',
    OTHER: 'Other Funds',
  };

  const typeDescriptions: Record<string, string> = {
    TITHE: 'Regular giving to support the general operations and ministry of our church.',
    OFFERING: 'Additional gifts beyond tithes to further support our mission.',
    PROJECT: 'Special projects and campaigns with specific goals and timelines.',
    SPECIAL: 'Designated giving for special purposes and needs.',
  };

  if (!tenant.settings?.enableDonations) {
    return (
      <Card>
        <div className="text-center py-12 space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">Donations are not enabled</h3>
          <p className="text-gray-600">Please contact this community's administrator for giving options.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Giving Opportunities</h2>
        <p className="mt-1 text-sm text-gray-500">
          Explore the different ways you can support the mission of {tenant.name}.
        </p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12 text-gray-500">Loading funds...</div>
        </Card>
      ) : funds.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No funds available</h3>
            <p className="mt-2 text-sm text-gray-500">
              Check back later for giving opportunities.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(fundsByType).map(([type, typeFunds]) => (
            <div key={type}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{typeLabels[type] || type}</h3>
                {typeDescriptions[type] && (
                  <p className="text-sm text-gray-600">{typeDescriptions[type]}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typeFunds.map((fund) => {
                  const progress = fund.goalAmountCents
                    ? Math.min(100, Math.round((fund.amountRaisedCents / fund.goalAmountCents) * 100))
                    : null;
                  const hasGoal = fund.goalAmountCents != null && fund.goalAmountCents > 0;

                  return (
                    <Card key={fund.id}>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{fund.name}</h4>
                          {fund.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{fund.description}</p>
                          )}
                        </div>

                        {hasGoal && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium tenant-text-primary">{progress}% funded</span>
                              <span className="text-gray-500">
                                ${(fund.amountRaisedCents / 100).toLocaleString()} of ${((fund.goalAmountCents ?? 0) / 100).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full tenant-bg-600 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {!hasGoal && fund.amountRaisedCents > 0 && (
                          <p className="text-sm text-gray-600">
                            ${(fund.amountRaisedCents / 100).toLocaleString()} raised
                          </p>
                        )}

                        {(fund.startDate || fund.endDate) && (
                          <p className="text-xs text-gray-500">
                            {fund.endDate
                              ? `Ends ${new Date(fund.endDate).toLocaleDateString()}`
                              : 'Ongoing'}
                          </p>
                        )}

                        <Button
                          onClick={() => openDonateModal(fund)}
                          className="w-full"
                        >
                          Give to {fund.name}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donation Modal */}
      {showDonateModal && selectedFund && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDonateModal} />
            
            <div className="relative inline-block w-full max-w-lg p-6 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl transform transition-all">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Thank You!</h3>
                  <p className="mt-2 text-gray-600">
                    Your gift to {selectedFund.name} is greatly appreciated.
                  </p>
                  <Button onClick={closeDonateModal} className="mt-6">
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleDonate}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Give to {selectedFund.name}</h3>
                      <p className="text-sm text-gray-500">{selectedFund.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDonateModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Amount ({selectedFund.currency})
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {suggestedAmounts.map((amount: number) => (
                          <button
                            type="button"
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            className={`p-3 text-center rounded-md border-2 font-semibold transition-colors ${
                              selectedAmount === amount
                                ? 'tenant-bg-100 border-[color:var(--primary)] tenant-text-primary'
                                : 'bg-white border-gray-300 hover:border-[color:var(--primary)]'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSelectedAmount('custom')}
                          className={`p-3 text-center rounded-md border-2 font-semibold transition-colors ${
                            selectedAmount === 'custom'
                              ? 'tenant-bg-100 border-[color:var(--primary)] tenant-text-primary'
                              : 'bg-white border-gray-300 hover:border-[color:var(--primary)]'
                          }`}
                        >
                          Other
                        </button>
                      </div>
                    </div>

                    {selectedAmount === 'custom' && (
                      <Input
                        label="Custom Amount"
                        id="customAmount"
                        type="number"
                        step="0.01"
                        min="1"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                      />
                    )}

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message (Optional)
                      </label>
                      <textarea
                        id="message"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Leave a note with your gift..."
                      />
                    </div>

                    <Input
                      label="Dedication (Optional)"
                      id="designationNote"
                      value={designationNote}
                      onChange={(e) => setDesignationNote(e.target.value)}
                      placeholder="In honor of..."
                    />

                    <ToggleSwitch
                      label="Remain anonymous on leaderboard"
                      enabled={isAnonymous}
                      onChange={setIsAnonymous}
                    />
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <Button type="button" variant="secondary" onClick={closeDonateModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Processing...' : 'Give Now'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundsPage;
