'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import MemberSelect, { MemberOption } from '@/app/components/ui/MemberSelect';
import { TicketWithDetails, TicketStatus, TicketPriority, TicketCategory, TenantSettings } from '@/types';

interface AdminTicketsPageProps {
  tenantId: string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  TRIAGED: 'Triaged',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  TRIAGED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  WAITING: 'bg-orange-100 text-orange-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-700',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'text-slate-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600 font-semibold',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  GENERAL: 'General',
  TECHNICAL: 'Technical',
  BILLING: 'Billing',
  MEMBERSHIP: 'Membership',
  FACILITIES: 'Facilities',
  EVENTS: 'Events',
  OTHER: 'Other',
};

export default function AdminTicketsPage({ tenantId }: AdminTicketsPageProps) {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);
  const [showUnassigned, setShowUnassigned] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);

  const [newReply, setNewReply] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  
  // Create ticket modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'GENERAL' as TicketCategory,
    priority: 'NORMAL' as TicketPriority,
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    assigneeId: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterAssignee) params.set('assigneeId', filterAssignee);
      if (myTicketsOnly) params.set('myTickets', 'true');
      if (showUnassigned) params.set('unassigned', 'true');

      const response = await fetch(`/api/tenants/${tenantId}/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search, filterStatus, filterPriority, filterAssignee, myTicketsOnly, showUnassigned]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [tenantId]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members?status=APPROVED&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        // API returns enriched user objects from `getMembersForTenant` (user fields + `membership`)
        setMembers(data.members?.map((m: any) => ({
          id: m.id,
          displayName: m.profile?.displayName || m.membership?.displayName || m.email || 'Unknown',
          avatarUrl: m.profile?.avatarUrl,
          roles: m.membership?.roles?.map((r: any) => r.role) || [],
        })) || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTickets();
    fetchSettings();
    fetchMembers();
  }, [fetchTickets, fetchSettings, fetchMembers]);

  const openTicketDetail = async (ticket: TicketWithDetails) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets/${ticket.id}`);
      if (response.ok) {
        const fullTicket = await response.json();
        setSelectedTicket(fullTicket);
        setDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          openTicketDetail(selectedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleAssigneeChange = async (ticketId: string, assigneeId: string | null) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId }),
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          openTicketDetail(selectedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const handlePriorityChange = async (ticketId: string, priority: TicketPriority) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleAddReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets/${selectedTicket.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newReply,
          isInternal: isInternalNote,
        }),
      });

      if (response.ok) {
        setNewReply('');
        setIsInternalNote(false);
        openTicketDetail(selectedTicket);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleToggleTicketing = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableTicketing: enabled }),
      });

      if (response.ok) {
        setSettings((prev) => prev ? { ...prev, enableTicketing: enabled } : null);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.requesterName.trim() || !newTicket.requesterEmail.trim()) {
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        setNewTicket({
          subject: '',
          description: '',
          category: 'GENERAL',
          priority: 'NORMAL',
          requesterName: '',
          requesterEmail: '',
          requesterPhone: '',
          assigneeId: '',
        });
        setCreateModalOpen(false);
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    // Pre-fill with current user info if available
    if (session?.user) {
      setNewTicket((prev) => ({
        ...prev,
        requesterName: session.user?.name || '',
        requesterEmail: session.user?.email || '',
      }));
    }
    setCreateModalOpen(true);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleString();
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-600">Manage support requests and inquiries</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateModal}>
            + New Ticket
          </Button>
          <Button variant="secondary" onClick={() => setSettingsModalOpen(true)}>
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">
            {tickets.filter((t) => t.status === 'NEW').length}
          </div>
          <div className="text-sm text-slate-500">New Tickets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-sm text-slate-500">In Progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {tickets.filter((t) => !t.assigneeId && ['NEW', 'TRIAGED'].includes(t.status)).length}
          </div>
          <div className="text-sm text-slate-500">Unassigned</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {tickets.filter((t) => t.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(t.status)).length}
          </div>
          <div className="text-sm text-slate-500">Urgent</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | '')}
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TicketPriority | '')}
          >
            <option value="">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.displayName}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={myTicketsOnly}
              onChange={(e) => setMyTicketsOnly(e.target.checked)}
              className="rounded"
            />
            My Tickets
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
              className="rounded"
            />
            Unassigned Only
          </label>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 text-sm font-medium text-slate-600">#</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Subject</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Priority</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Requester</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Assignee</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Created</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-mono text-slate-500">
                    #{ticket.ticketNumber}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openTicketDetail(ticket)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="font-medium text-slate-900">{ticket.subject}</div>
                      <div className="text-xs text-slate-400">{CATEGORY_LABELS[ticket.category]}</div>
                    </button>
                  </td>
                  <td className="p-3">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                      className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_COLORS[ticket.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(ticket.id, e.target.value as TicketPriority)}
                      className={`text-xs border-0 bg-transparent ${PRIORITY_COLORS[ticket.priority]}`}
                    >
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{ticket.requesterName}</div>
                    <div className="text-xs text-slate-400">{ticket.requesterEmail}</div>
                  </td>
                  <td className="p-3">
                    <select
                      value={ticket.assigneeId || ''}
                      onChange={(e) => handleAssigneeChange(ticket.id, e.target.value || null)}
                      className="text-sm border border-slate-200 rounded px-2 py-1"
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>{member.displayName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {getTimeAgo(ticket.createdAt)}
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="secondary" onClick={() => openTicketDetail(ticket)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {tickets.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tickets found</h3>
          <p className="text-slate-600">Tickets submitted through the support form will appear here.</p>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      <Modal isOpen={detailModalOpen} title={`Ticket #${selectedTicket?.ticketNumber}`} onClose={() => setDetailModalOpen(false)}>
        {selectedTicket && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Header Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">{selectedTicket.subject}</h3>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`px-2 py-1 rounded-full ${STATUS_COLORS[selectedTicket.status]}`}>
                  {STATUS_LABELS[selectedTicket.status]}
                </span>
                <span className={PRIORITY_COLORS[selectedTicket.priority]}>
                  {PRIORITY_LABELS[selectedTicket.priority]} Priority
                </span>
                <span className="text-slate-500">
                  {CATEGORY_LABELS[selectedTicket.category]}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <div className="font-medium text-slate-700 mb-1">From: {selectedTicket.requesterName}</div>
                <div className="text-slate-500">{selectedTicket.requesterEmail}</div>
                {selectedTicket.requesterPhone && (
                  <div className="text-slate-500">{selectedTicket.requesterPhone}</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            </div>

            {/* SLA Info */}
            {(selectedTicket.slaResponseDue || selectedTicket.slaResolveDue) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-amber-800">SLA Targets</div>
                {selectedTicket.slaResponseDue && !selectedTicket.firstResponseAt && (
                  <div className={new Date(selectedTicket.slaResponseDue) < new Date() ? 'text-red-600' : 'text-amber-700'}>
                    First Response: {formatDate(selectedTicket.slaResponseDue)}
                    {new Date(selectedTicket.slaResponseDue) < new Date() && ' (BREACHED)'}
                  </div>
                )}
                {selectedTicket.slaResolveDue && !selectedTicket.resolvedAt && (
                  <div className={new Date(selectedTicket.slaResolveDue) < new Date() ? 'text-red-600' : 'text-amber-700'}>
                    Resolution: {formatDate(selectedTicket.slaResolveDue)}
                    {new Date(selectedTicket.slaResolveDue) < new Date() && ' (BREACHED)'}
                  </div>
                )}
              </div>
            )}

            {/* Conversation Thread */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-4">Conversation</h4>
              
              <div className="space-y-4 mb-4">
                {selectedTicket.updates?.map((update) => (
                  <div 
                    key={update.id} 
                    className={`p-3 rounded-lg ${
                      update.isSystemGenerated 
                        ? 'bg-slate-100 text-slate-500 text-sm italic' 
                        : update.isInternal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-white border border-slate-200'
                    }`}
                  >
                    {!update.isSystemGenerated && (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {update.author?.avatarUrl ? (
                            <img src={update.author.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs">
                              {update.authorName[0]}
                            </div>
                          )}
                          <span className="font-medium text-sm">{update.authorName}</span>
                          {update.isInternal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Internal</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(update.createdAt)}</span>
                      </div>
                    )}
                    <p className={update.isSystemGenerated ? '' : 'text-sm text-slate-700'}>{update.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="space-y-3">
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  rows={3}
                  placeholder="Write a reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    Internal note (not visible to requester)
                  </label>
                  <Button onClick={handleAddReply} disabled={!newReply.trim()}>
                    {isInternalNote ? 'Add Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <div className="flex gap-2">
                {selectedTicket.status !== 'RESOLVED' && (
                  <Button variant="secondary" onClick={() => handleStatusChange(selectedTicket.id, 'RESOLVED')}>
                    Mark Resolved
                  </Button>
                )}
                {selectedTicket.status !== 'CLOSED' && (
                  <Button variant="secondary" onClick={() => handleStatusChange(selectedTicket.id, 'CLOSED')}>
                    Close Ticket
                  </Button>
                )}
              </div>
              <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModalOpen} title="Ticketing Settings" onClose={() => setSettingsModalOpen(false)}>
        <div className="space-y-6">
          <ToggleSwitch
            label="Enable Ticketing"
            description="Allow support ticket submissions and management"
            enabled={settings?.enableTicketing ?? false}
            onChange={handleToggleTicketing}
          />

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-900 mb-3">SLA Targets</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">Urgent:</span> 1 hour response, 4 hour resolution</p>
              <p><span className="font-medium">High:</span> 4 hour response, 24 hour resolution</p>
              <p><span className="font-medium">Normal:</span> 8 hour response, 72 hour resolution</p>
              <p><span className="font-medium">Low:</span> 24 hour response, 1 week resolution</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-900 mb-3">Categories</h4>
            <p className="text-sm text-slate-500">
              Available categories: General, Technical, Billing, Membership, Facilities, Events, Other
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setSettingsModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal isOpen={createModalOpen} title="Create New Ticket" onClose={() => setCreateModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={newTicket.description}
              onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTicket.category}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, category: e.target.value as TicketCategory }))}
              >
                {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTicket.priority}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, priority: e.target.value as TicketPriority }))}
              >
                {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((pri) => (
                  <option key={pri} value={pri}>{PRIORITY_LABELS[pri]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-900 mb-3">Requester Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <Input
                  value={newTicket.requesterName}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, requesterName: e.target.value }))}
                  placeholder="Requester name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <Input
                  type="email"
                  value={newTicket.requesterEmail}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, requesterEmail: e.target.value }))}
                  placeholder="requester@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <Input
                  value={newTicket.requesterPhone}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, requesterPhone: e.target.value }))}
                  placeholder="(optional)"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
            <MemberSelect
              members={members}
              value={newTicket.assigneeId}
              onChange={(value) => setNewTicket((prev) => ({ ...prev, assigneeId: value }))}
              placeholder="Unassigned"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket} 
              disabled={creating || !newTicket.subject.trim() || !newTicket.requesterName.trim() || !newTicket.requesterEmail.trim()}
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
