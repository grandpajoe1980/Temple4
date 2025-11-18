'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { User, AuditLog } from '@/types';
import { ActionType } from '@/types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface AdminConsoleProps {
  onBack: () => void;
}

interface ApiAuditLog extends AuditLog {
  actorUser: User;
  effectiveUser?: User;
}

interface EnrichedAuditLog extends AuditLog {
    actorDisplayName: string;
    effectiveDisplayName?: string;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [logsRes, usersRes] = await Promise.all([
          fetch('/api/admin/audit-logs?limit=100'),
          fetch('/api/admin/users?limit=1000')
        ]);

        if (!logsRes.ok || !usersRes.ok) {
            throw new Error('Failed to fetch admin data');
        }

        const logsData = await logsRes.json();
        const usersData = await usersRes.json();

        setLogs(logsData.logs);
        setUsers(usersData.users);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  const enrichedLogs: EnrichedAuditLog[] = useMemo(() => {
    return logs.map(log => ({
        ...log,
        actorDisplayName: log.actorUser?.profile?.displayName || log.actorUserId,
        effectiveDisplayName: log.effectiveUser?.profile?.displayName || (log.effectiveUserId ? log.effectiveUserId : undefined),
    }));
  }, [logs]);
  
  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter(log => {
      if (actorFilter !== 'all' && log.actorUserId !== actorFilter) return false;
      if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
      if (startDateFilter) {
          const startDate = new Date(startDateFilter);
          if (log.createdAt < startDate) return false;
      }
      if (endDateFilter) {
          const endDate = new Date(endDateFilter);
          endDate.setHours(23, 59, 59, 999); // Include the whole day
          if (log.createdAt > endDate) return false;
      }
      return true;
    });
  }, [enrichedLogs, actorFilter, actionFilter, startDateFilter, endDateFilter]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Console: Audit Log</h1>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Console: Audit Log</h1>
          <p className="text-sm text-gray-500">View and filter all audited actions across the platform.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>&larr; Back</Button>
      </div>

      <Card title="Filter Logs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
                <label htmlFor="actor-filter" className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                <select id="actor-filter" value={actorFilter} onChange={e => setActorFilter(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900">
                    <option value="all">All Users</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.profile.displayName}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                <select id="action-filter" value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900">
                    <option value="all">All Actions</option>
                    {Object.values(ActionType).map(action => <option key={action} value={action}>{action}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" id="start-date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"/>
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" id="end-date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"/>
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
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actor</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Effective User</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Entity</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{log.createdAt.toLocaleString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.actorDisplayName}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.effectiveDisplayName || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.actionType}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.entityType ? `${log.entityType} (${log.entityId})` : 'N/A'}</td>
                                    <td className="px-3 py-4 text-xs text-gray-500">
                                        {log.metadata && <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap max-w-sm">{JSON.stringify(log.metadata, null, 2)}</pre>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
