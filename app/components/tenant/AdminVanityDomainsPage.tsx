'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import type { VanityDomain, VanityDomainStatus, VanityDomainType } from '@/types';

interface AdminVanityDomainsPageProps {
  tenantId: string;
}

interface VerificationInfo {
  type: string;
  name: string;
  value: string;
  instructions: string;
  attempts?: number;
  lastCheck?: string;
}

const STATUS_COLORS: Record<VanityDomainStatus, string> = {
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  DNS_VERIFIED: 'bg-blue-100 text-blue-800',
  SSL_PROVISIONING: 'bg-indigo-100 text-indigo-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SSL_EXPIRED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-gray-100 text-gray-600',
  ERROR: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<VanityDomainStatus, string> = {
  PENDING_VERIFICATION: 'Pending Verification',
  DNS_VERIFIED: 'DNS Verified',
  SSL_PROVISIONING: 'SSL Provisioning',
  ACTIVE: 'Active',
  SSL_EXPIRED: 'SSL Expired',
  DISABLED: 'Disabled',
  ERROR: 'Error',
};

const DOMAIN_TYPE_LABELS: Record<VanityDomainType, string> = {
  FULL_DOMAIN: 'Full Domain',
  SUBDOMAIN: 'Subdomain',
  PATH_PREFIX: 'Path Prefix',
};

export default function AdminVanityDomainsPage({ tenantId }: AdminVanityDomainsPageProps) {
  const [domains, setDomains] = useState<VanityDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<VanityDomain | null>(null);
  const [verification, setVerification] = useState<VerificationInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form state
  const [newDomain, setNewDomain] = useState({
    domain: '',
    domainType: 'FULL_DOMAIN' as VanityDomainType,
    isPrimary: false,
    forceHttps: true,
  });

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains`);
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        setFeatureEnabled(true);
      } else if (res.status === 403) {
        // Feature not enabled
        setFeatureEnabled(false);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDomain),
      });

      if (res.ok) {
        const data = await res.json();
        setDomains(prev => [data.domain, ...prev]);
        setVerification(data.verification);
        setSelectedDomain(data.domain);
        setAddModalOpen(false);
        setVerifyModalOpen(true);
        setNewDomain({
          domain: '',
          domainType: 'FULL_DOMAIN',
          isPrimary: false,
          forceHttps: true,
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      alert('Failed to add domain');
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains/${domainId}/verify`, {
        method: 'POST',
      });

      const data = await res.json();
      
      if (data.verified) {
        // Update domain in list
        setDomains(prev => prev.map(d => 
          d.id === domainId ? data.domain : d
        ));
        setVerifyModalOpen(false);
        setSelectedDomain(null);
        alert('Domain verified successfully!');
      } else {
        setVerification(data.instructions);
        alert(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Failed to verify domain:', error);
      alert('Failed to verify domain');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains/${domainId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDomains(prev => prev.filter(d => d.id !== domainId));
      } else {
        alert('Failed to delete domain');
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
      alert('Failed to delete domain');
    }
  };

  const handleToggleStatus = async (domain: VanityDomain) => {
    const action = domain.status === 'DISABLED' ? 'enable' : 'disable';
    
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains/${domain.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        setDomains(prev => prev.map(d => 
          d.id === domain.id ? data.domain : d
        ));
      } else {
        alert('Failed to update domain status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update domain status');
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (res.ok) {
        // Refresh to get updated primary flags
        fetchDomains();
      } else {
        alert('Failed to set as primary');
      }
    } catch (error) {
      console.error('Failed to set primary:', error);
      alert('Failed to set as primary');
    }
  };

  const openVerificationModal = async (domain: VanityDomain) => {
    setSelectedDomain(domain);
    
    // Fetch verification details
    try {
      const res = await fetch(`/api/tenants/${tenantId}/vanity-domains/${domain.id}`);
      if (res.ok) {
        const data = await res.json();
        setVerification(data.verification);
      }
    } catch (error) {
      console.error('Failed to fetch verification:', error);
    }
    
    setVerifyModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Vanity Domains</h2>
          <p className="text-slate-600 mb-6">
            Vanity domains are not enabled for your community. Enable this feature to use custom domains.
          </p>
          <Button onClick={() => setSettingsOpen(true)}>
            Enable Feature
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vanity Domains</h1>
          <p className="text-slate-600">Manage custom domains for your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            Add Domain
          </Button>
        </div>
      </div>

      {/* Domain List */}
      {domains.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No domains configured</h3>
          <p className="text-slate-600 mb-4">Add your first custom domain to get started.</p>
          <Button onClick={() => setAddModalOpen(true)}>Add Domain</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{domain.domain}</span>
                      {domain.isPrimary && (
                        <span className="px-2 py-0.5 text-xs font-medium tenant-bg-100 tenant-text-primary rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{DOMAIN_TYPE_LABELS[domain.domainType]}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[domain.status]}`}>
                        {STATUS_LABELS[domain.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.status === 'PENDING_VERIFICATION' && (
                    <Button size="sm" variant="secondary" onClick={() => openVerificationModal(domain)}>
                      Verify
                    </Button>
                  )}
                  {domain.status === 'ACTIVE' && !domain.isPrimary && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(domain.id)}>
                      Set Primary
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant={domain.status === 'DISABLED' ? 'secondary' : 'ghost'}
                    onClick={() => handleToggleStatus(domain)}
                  >
                    {domain.status === 'DISABLED' ? 'Enable' : 'Disable'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(domain.id)}>
                    Delete
                  </Button>
                </div>
              </div>
              
              {/* Domain Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">HTTPS:</span>
                  <span className="ml-2 font-medium">{domain.forceHttps ? 'Enforced' : 'Not enforced'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Requests:</span>
                  <span className="ml-2 font-medium">{domain.totalRequests.toLocaleString()}</span>
                </div>
                {domain.sslExpiresAt && (
                  <div>
                    <span className="text-slate-500">SSL Expires:</span>
                    <span className="ml-2 font-medium">{new Date(domain.sslExpiresAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Created:</span>
                  <span className="ml-2 font-medium">{new Date(domain.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      <Modal isOpen={addModalOpen} title="Add Custom Domain" onClose={() => setAddModalOpen(false)}>
          <div className="space-y-4">
            <Input
              label="Domain"
              placeholder="e.g., mychurch.org"
              value={newDomain.domain}
              onChange={(e) => setNewDomain(prev => ({ ...prev, domain: e.target.value }))}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Domain Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={newDomain.domainType}
                onChange={(e) => setNewDomain(prev => ({ ...prev, domainType: e.target.value as VanityDomainType }))}
              >
                <option value="FULL_DOMAIN">Full Domain (e.g., mychurch.org)</option>
                <option value="SUBDOMAIN">Subdomain (e.g., mychurch.example.com)</option>
                <option value="PATH_PREFIX">Path Prefix (e.g., example.com/mychurch)</option>
              </select>
            </div>

            <ToggleSwitch
              label="Set as Primary Domain"
              description="Use this domain as the main URL for your community"
              enabled={newDomain.isPrimary}
              onChange={(enabled) => setNewDomain(prev => ({ ...prev, isPrimary: enabled }))}
            />

            <ToggleSwitch
              label="Force HTTPS"
              description="Redirect all HTTP requests to HTTPS"
              enabled={newDomain.forceHttps}
              onChange={(enabled) => setNewDomain(prev => ({ ...prev, forceHttps: enabled }))}
            />
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={!newDomain.domain}>
              Add Domain
            </Button>
          </div>
        </Modal>

      {/* Verification Modal */}
      <Modal isOpen={verifyModalOpen && !!selectedDomain} title="Domain Verification" onClose={() => setVerifyModalOpen(false)}>
        {selectedDomain && (
          <>
            <div className="space-y-4">
              <p className="text-slate-600">
                To verify ownership of <strong>{selectedDomain.domain}</strong>, add the following DNS record:
              </p>

              {verification && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Record Type</label>
                    <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
                      {verification.type}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Name / Host</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm bg-white px-3 py-2 rounded border overflow-x-auto">
                        {verification.name}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(verification.name)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Value</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-xs bg-white px-3 py-2 rounded border overflow-x-auto break-all">
                        {verification.value}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(verification.value)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 text-blue-800 rounded-lg p-4 text-sm">
                <strong>Note:</strong> DNS changes can take up to 48 hours to propagate. 
                You can check verification status at any time.
              </div>

              {verification?.attempts && verification.attempts > 0 && (
                <p className="text-sm text-slate-500">
                  Verification attempts: {verification.attempts}
                  {verification.lastCheck && ` (last checked: ${new Date(verification.lastCheck).toLocaleString()})`}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
              <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={() => handleVerify(selectedDomain.id)} 
                disabled={verifying}
              >
                {verifying ? 'Verifying...' : 'Check Verification'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsOpen} title="Vanity Domain Settings" onClose={() => setSettingsOpen(false)}>
          <p className="text-slate-600 mb-4">
            Configure how vanity domains work for your community.
          </p>

          <div className="space-y-6">
            <ToggleSwitch
              label="Enable Vanity Domains"
              description="Allow custom domains for your community"
              enabled={featureEnabled}
              onChange={(enabled) => {
                // This would need to update tenant settings
                setFeatureEnabled(enabled);
              }}
            />

            <div className="tenant-bg-50 tenant-text-primary rounded-lg p-4 text-sm">
              <strong>Important:</strong> Before using custom domains, ensure you have:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Access to your domain&apos;s DNS settings</li>
                <li>Understanding of DNS record types (TXT, CNAME)</li>
                <li>Configured SSL certificates (automatic with verification)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
    </div>
  );
}
