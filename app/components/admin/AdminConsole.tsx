"use client"

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AuditLog, MembershipApprovalMode, MembershipStatus } from '@/types';
import { ActionType } from '@/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import ToggleSwitch from '../ui/ToggleSwitch';
import Link from 'next/link';
import EmailConfigPage from '../../admin/email-config/page';
import SecretsPage from '../../admin/secrets/page';

interface AdminConsoleProps {
  onBack: () => void;
}

interface ApiAuditLog extends Omit<AuditLog, 'createdAt'> {
  createdAt: string;
  actorUser: {
    id: string;
    profile?: { displayName: string } | null;
  } | null;
  effectiveUser?: {
    id: string;
    profile?: { displayName: string } | null;
  } | null;
}

interface EnrichedAuditLog extends AuditLog {
  actorDisplayName: string;
  effectiveDisplayName?: string;
}

interface AdminMembership {
  id: string;
  tenantId: string;
  status: MembershipStatus;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  roles: Array<{ id: string; role: string }>;
}

interface AdminUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  profile: { displayName: string } | null;
  memberships: AdminMembership[];
}

interface AdminTenantSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  settings?: {
    isPublic: boolean;
    membershipApprovalMode: MembershipApprovalMode;
  } | null;
  _count: {
    memberships: number;
  };
}

const tabs = ['Audit Logs', 'User Directory', 'Tenant Management', 'Email Configuration', 'Secrets'] as const;
type Tab = (typeof tabs)[number];

const AdminConsole: React.FC<AdminConsoleProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenantSummary[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Audit Logs');
  const [userSearch, setUserSearch] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch('/api/admin/audit-logs?limit=200');
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const data = await response.json();
        setLogs(data.logs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingLogs(false);
      }
    }
    fetchLogs();
  }, []);

  const fetchUsers = useCallback(async (query: string) => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ limit: '100', search: query });
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setUserSearchTerm(userSearch), 300);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    fetchUsers(userSearchTerm);
  }, [fetchUsers, userSearchTerm]);

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const data = await response.json();
      setTenants(data.tenants);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const [actorFilter, setActorFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const enrichedLogs: EnrichedAuditLog[] = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      createdAt: new Date(log.createdAt),
      actorDisplayName: log.actorUser?.profile?.displayName || log.actorUserId,
      effectiveDisplayName:
        log.effectiveUser?.profile?.displayName || (log.effectiveUserId ? log.effectiveUserId : undefined),
    }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      if (actorFilter !== 'all' && log.actorUserId !== actorFilter) return false;
      if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
      if (startDateFilter) {
        const startDate = new Date(startDateFilter);
        if (log.createdAt < startDate) return false;
      }
      if (endDateFilter) {
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999);
        if (log.createdAt > endDate) return false;
      }
      return true;
    });
  }, [enrichedLogs, actorFilter, actionFilter, startDateFilter, endDateFilter]);

  const handleImpersonate = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start impersonation');
      }

      setFeedback('Impersonation session started. Refresh to use the impersonated context.');
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : 'Failed to impersonate user');
    }
  };

  const handleTenantUpdate = async (
    tenantId: string,
    updates: Partial<{ settings: { isPublic?: boolean; membershipApprovalMode?: MembershipApprovalMode } }>
  ) => {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update tenant');
      }

      await loadTenants();
      setFeedback('Tenant settings updated.');
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : 'Failed to update tenant');
    }
  };

  const renderAuditLogs = () => {
    if (loadingLogs) {
      return <div className="text-center py-8 text-sm text-gray-500">Loading audit logs…</div>;
    }

    return (
      <>
        <Card title="Filter Logs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="actor-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Actor
              </label>
              <select
                id="actor-filter"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              >
                <option value="all">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.profile?.displayName || user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                id="action-filter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              >
                <option value="all">All Actions</option>
                {Object.values(ActionType).map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
        </Card>

        <div className="flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Effective User
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Entity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {log.createdAt.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.actorDisplayName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {log.effectiveDisplayName || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.actionType}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {log.entityType ? `${log.entityType} (${log.entityId})` : 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-xs text-gray-500">
                          {log.metadata && (
                            <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap max-w-sm">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderUserDirectory = () => (
    <>
      <Card title="Search Users">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Input
            label="Search by name or email"
            id="user-search"
            placeholder="Start typing to search users"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            containerClassName="lg:col-span-2"
          />
          <div className="text-sm text-gray-500 flex items-end">
            {loadingUsers ? 'Searching…' : `${users.length} result${users.length === 1 ? '' : 's'}`}
          </div>
        </div>
      </Card>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">User</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Memberships</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="font-semibold text-gray-900">{user.profile?.displayName || user.email}</div>
                  <div className="text-gray-500">{user.email}</div>
                  {user.isSuperAdmin && <span className="text-xs text-amber-600 font-semibold">Super Admin</span>}
                </td>
                <td className="px-3 py-4 text-sm text-gray-600">
                  <ul className="space-y-2">
                    {user.memberships.length === 0 && <li className="text-gray-400">No memberships</li>}
                    {user.memberships.map((membership) => (
                      <li key={membership.id} className="border border-gray-100 rounded-lg p-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{membership.tenant.name}</div>
                            <div className="text-xs text-gray-500">
                              Status: {membership.status} • Roles:{' '}
                              {membership.roles.length > 0
                                ? membership.roles.map((role) => role.role).join(', ')
                                : 'MEMBER'}
                            </div>
                          </div>
                          <Link
                            href={`/tenants/${membership.tenant.slug}`}
                            className="text-xs text-amber-600 font-semibold hover:underline"
                          >
                            Open
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 space-y-2">
                  <Button
                    size="sm"
                    onClick={() => handleImpersonate(user.id)}
                    className="w-full"
                    disabled={loadingUsers}
                  >
                    Impersonate
                  </Button>
                  <Link
                    href={`/profile/${user.id}`}
                    className="block text-center text-xs text-amber-600 font-semibold hover:underline"
                  >
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderTenantManagement = () => (
    <>
      {loadingTenants ? (
        <div className="text-center py-8 text-sm text-gray-500">Loading tenants…</div>
      ) : (
        tenants.map((tenant) => (
          <Card key={tenant.id} title={tenant.name}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Slug: {tenant.slug}</p>
                <p className="text-sm text-gray-600 mb-2">Members: {tenant._count.memberships}</p>
                {tenant.contactEmail && <p className="text-sm text-gray-600">Contact: {tenant.contactEmail}</p>}
                {tenant.phoneNumber && <p className="text-sm text-gray-600">Phone: {tenant.phoneNumber}</p>}
              </div>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Public Tenant"
                  enabled={Boolean(tenant.settings?.isPublic)}
                  description="Controls whether non-members can browse this tenant."
                  onChange={(enabled) => handleTenantUpdate(tenant.id, { settings: { isPublic: enabled } })}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Membership Approval Mode
                  </label>
                  <select
                    value={tenant.settings?.membershipApprovalMode || 'APPROVAL_REQUIRED'}
                    onChange={(e) =>
                      handleTenantUpdate(tenant.id, {
                        settings: { membershipApprovalMode: e.target.value as MembershipApprovalMode },
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                  >
                    <option value="OPEN">Open - auto approve</option>
                    <option value="APPROVAL_REQUIRED">Approval required</option>
                  </select>
                </div>
                <Link
                  href={`/tenants/${tenant.slug}`}
                  className="inline-flex items-center text-sm text-amber-600 font-semibold hover:underline"
                >
                  Visit tenant site →
                </Link>
              </div>
            </div>
          </Card>
        ))
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrator Control Panel</h1>
          <p className="text-sm text-gray-500">Audit activity, manage users, and oversee every tenant from one place.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          &larr; Back
        </Button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {feedback}
        </div>
      )}

      <Tabs tabs={[...tabs]} activeTab={activeTab} onTabClick={(tab) => setActiveTab(tab as Tab)} />

      {activeTab === 'Audit Logs' && renderAuditLogs()}
      {activeTab === 'User Directory' && renderUserDirectory()}
      {activeTab === 'Tenant Management' && renderTenantManagement()}
      {activeTab === 'Email Configuration' && <EmailConfigPage />}
      {activeTab === 'Secrets' && <SecretsPage />}
    </div>
  );
};

export default AdminConsole;
