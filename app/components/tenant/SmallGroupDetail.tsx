"use client";

import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';
import useTranslation from '@/app/hooks/useTranslation';


interface SmallGroupDetailProps {
  tenantId: string;
  groupId: string | null;
  currentUser: any;
  onClose?: () => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export default function SmallGroupDetail({ tenantId, groupId, currentUser, onClose, onRefresh, isAdmin }: SmallGroupDetailProps) {
  const { t } = useTranslation();
  const [group, setGroup] = useState<any>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'members' | 'resources' | 'announcements' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', meetingSchedule: '', isActive: true, isHidden: false });
  const [resources, setResources] = useState<any[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState<string | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', url: '' });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '' });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [tenantUsersLoading, setTenantUsersLoading] = useState(false);
  const [tenantUsersError, setTenantUsersError] = useState<string | null>(null);
  const [showTenantUsersModal, setShowTenantUsersModal] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveInProgress, setLeaveInProgress] = useState(false);

  const currentMembership = group?.members?.find((m: any) => m.user?.id === currentUser?.id && m.status !== 'REJECTED' && m.status !== 'BANNED');

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`);
        if (!res.ok) {
          // try to extract error details from body
          let body: any = null;
          try {
            body = await res.json();
          } catch (_) {
            try { body = await res.text(); } catch (_) { body = null; }
          }
          const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || res.statusText || `HTTP ${res.status}`);
          console.error(`Failed to load group ${groupId}: ${msg}`);
          // surface server message in the UI
          setGroup(null);
          setGroupError(String(msg));
          return;
        }

        const data = await res.json();
        setGroup(data);
        setGroupError(null);
      } catch (err: any) {
        console.error('Failed to load group', err instanceof Error ? err.message : err);
        setGroup(null);
        setGroupError(err?.message ? String(err.message) : 'Failed to load group');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, tenantId]);

  useEffect(() => {
    if (!group) return;
    setForm({
      name: group.name || '',
      description: group.description || '',
      meetingSchedule: group.meetingSchedule || '',
      isActive: typeof group.isActive === 'boolean' ? group.isActive : true,
      isHidden: typeof group.isHidden === 'boolean' ? group.isHidden : false,
    });
  }, [group]);

  useEffect(() => {
    if (!groupId || tab !== 'resources') return;
    let mounted = true;
    (async () => {
      setResLoading(true);
      setResError(null);
      try {
        const r = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/resources`);
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error((body && body.message) || r.statusText || `HTTP ${r.status}`);
        }
        const data = await r.json();
        if (!mounted) return;
        setResources(Array.isArray(data.items) ? data.items : []);
      } catch (err: any) {
        console.error('Failed to load resources', err);
        if (mounted) setResError(err?.message || 'Failed to load resources');
      } finally {
        if (mounted) setResLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId, tenantId, tab]);

  useEffect(() => {
    if (!groupId || tab !== 'announcements') return;
    let mounted = true;
    (async () => {
      setAnnLoading(true);
      setAnnError(null);
      try {
        const r = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/announcements`);
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error((body && body.message) || r.statusText || `HTTP ${r.status}`);
        }
        const data = await r.json();
        if (!mounted) return;
        setAnnouncements(Array.isArray(data.items) ? data.items : []);
      } catch (err: any) {
        console.error('Failed to load announcements', err);
        if (mounted) setAnnError(err?.message || 'Failed to load announcements');
      } finally {
        if (mounted) setAnnLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId, tenantId, tab]);

  if (!groupId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">{t('detail.smallGroup.selectGroup')}</p>
      </div>
    );
  }

  if (loading) return <div className="p-6 bg-white rounded-lg shadow-sm">{t('common.loading')}</div>;

  if (!group) return <div className="p-6 bg-white rounded-lg shadow-sm">{groupError || t('detail.smallGroup.notFound')}</div>;

  const isCurrentUserLeader =
    group.leader?.id === currentUser?.id ||
    (group.members || []).some(
      (mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER')
    );

  const handleConfirmLeave = async () => {
    if (isCurrentUserLeader) {
      alert('Leaders must nominate a new leader before leaving the group.');
      setShowLeaveConfirm(false);
      return;
    }
    if (!currentMembership) {
      setShowLeaveConfirm(false);
      return;
    }
    try {
      setLeaveInProgress(true);
      const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/members/${currentUser.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to leave group');
      }
      if (onRefresh) onRefresh();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Unable to leave the group.');
    } finally {
      setLeaveInProgress(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-500">{group.meetingSchedule}</p>
              <p className="mt-2 text-sm text-gray-700">{group.description}</p>
            </div>
            <div className="flex space-x-2">
              {currentMembership && (
                <Button
                  variant="secondary"
                  className={isCurrentUserLeader ? 'opacity-50 cursor-not-allowed' : ''}
                  onClick={() => {
                    if (isCurrentUserLeader) {
                      alert('Leaders must nominate a new leader before leaving the group.');
                      return;
                    }
                    setShowLeaveConfirm(true);
                  }}
                >
                  {t('detail.smallGroup.leaveGroup')}
                </Button>
              )}
              <Button variant="ghost" onClick={() => onClose && onClose()}>{t('common.close')}</Button>
              <Button onClick={() => { if (onRefresh) onRefresh(); }}>{t('detail.smallGroup.refresh')}</Button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <nav className="flex space-x-4">
            <button onClick={() => setTab('overview')} className={`px-3 py-1 rounded ${tab === 'overview' ? 'bg-white shadow' : ''}`}>{t('detail.smallGroup.tabs.overview')}</button>
            <button onClick={() => setTab('members')} className={`px-3 py-1 rounded ${tab === 'members' ? 'bg-white shadow' : ''}`}>{t('detail.smallGroup.tabs.members')}</button>
            <button onClick={() => setTab('resources')} className={`px-3 py-1 rounded ${tab === 'resources' ? 'bg-white shadow' : ''}`}>{t('detail.smallGroup.tabs.resources')}</button>
            <button onClick={() => setTab('announcements')} className={`px-3 py-1 rounded ${tab === 'announcements' ? 'bg-white shadow' : ''}`}>{t('detail.smallGroup.tabs.announcements')}</button>
            <button onClick={() => setTab('settings')} className={`px-3 py-1 rounded ${tab === 'settings' ? 'bg-white shadow' : ''}`}>{t('common.settings')}</button>
          </nav>
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700">{t('detail.smallGroup.tabs.overview')}</h4>
              <p className="mt-2 text-sm text-gray-600">{group.description}</p>
              <div className="mt-4">
                <strong>{t('detail.smallGroup.schedule')}:</strong> {group.meetingSchedule}
              </div>
              <div className="mt-2">
                <strong>{t('detail.smallGroup.location')}:</strong> {group.locationName || t('detail.smallGroup.tbd')}
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700">{t('detail.smallGroup.tabs.members')}</h4>
              {(() => {
                const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                const canManageMembers = isLeader || !!isAdmin || !!(currentUser as any)?.isSuperAdmin;
                if (!canManageMembers) return null;
                return (
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        try {
                          setTenantUsersLoading(true);
                          setTenantUsersError(null);
                          const rUsers = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/tenant-users`);
                          if (!rUsers.ok) {
                            let body: any = null;
                            try { body = await rUsers.json(); } catch (_) { try { body = await rUsers.text(); } catch (_) { body = null; } }
                            const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || rUsers.statusText || `HTTP ${rUsers.status}`);
                            throw new Error(msg);
                          }
                          const payload = await rUsers.json();
                          const users: any[] = payload.users || [];
                          setTenantUsers(users);
                          setShowTenantUsersModal(true);
                        } catch (err: any) {
                          console.error('Failed to load tenant users', err);
                          setTenantUsersError(err?.message ? String(err.message) : 'Failed to load users');
                          alert(err?.message ? String(err.message) : 'Failed to load users');
                        } finally {
                          setTenantUsersLoading(false);
                        }
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                      {t('detail.smallGroup.addMember')}
                    </button>
                  </div>
                );
              })()}
              <ul className="mt-3 space-y-2">
                {(group.members || []).map((m: any) => (
                  <li key={m.user?.id || m.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserLink userId={m.user?.id} className="flex items-center space-x-3">
                        <Avatar src={m.user?.profile?.avatarUrl || '/placeholder-avatar.svg'} name={m.user?.profile?.displayName || m.user?.email} size="sm" />
                        <div>
                          <div className="text-sm font-medium">{m.user?.profile?.displayName || m.user?.email}</div>
                          <div className="text-xs text-gray-500">{m.role}</div>
                        </div>
                      </UserLink>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        {m.status === 'PENDING' && (
                          <span className="text-xs text-yellow-600 mr-1">Pending</span>
                        )}
                        {/* leader/admin actions */}
                        {(() => {
                          const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                          const canManage = isLeader || !!isAdmin || !!(currentUser as any)?.isSuperAdmin;
                          if (!canManage) return null;

                          return (
                            <div className="flex items-center space-x-2">
                              {m.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Approve this membership?')) return;
                                      try {
                                        const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/members/${m.user.id}/approve`, { method: 'POST' });
                                        if (!res.ok) throw new Error('Approve failed');
                                        const updatedGroup = await (await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`)).json();
                                        setGroup(updatedGroup);
                                      } catch (err) {
                                        console.error(err);
                                        alert('Failed to approve member');
                                      } finally {
                                        setLoading(false);
                                        if (onRefresh) onRefresh();
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Reject this request?')) return;
                                      try {
                                        const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/members/${m.user.id}/reject`, { method: 'POST' });
                                        if (!res.ok) throw new Error('Reject failed');
                                        const updatedGroup = await (await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`)).json();
                                        setGroup(updatedGroup);
                                      } catch (err) {
                                        console.error(err);
                                        alert('Failed to reject member');
                                      } finally {
                                        setLoading(false);
                                        if (onRefresh) onRefresh();
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm('Remove this member from the group?')) return;
                                  try {
                                    setLoading(true);
                                    const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/members/${m.user.id}`, { method: 'DELETE' });
                                    if (!res.ok && res.status !== 204) {
                                      let body: any = null;
                                      try { body = await res.json(); } catch (_) { try { body = await res.text(); } catch (_) { body = null; } }
                                      const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || res.statusText || `HTTP ${res.status}`);
                                      throw new Error(String(msg));
                                    }

                                    // refresh group after successful remove
                                    const r = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`);
                                    if (!r.ok) {
                                      let body: any = null;
                                      try { body = await r.json(); } catch (_) { try { body = await r.text(); } catch (_) { body = null; } }
                                      const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || r.statusText || `HTTP ${r.status}`);
                                      throw new Error(`Failed to refresh group: ${msg}`);
                                    }
                                    const data = await r.json();
                                    setGroup(data);
                                  } catch (err: any) {
                                    console.error('Remove member error:', err);
                                    alert((err && err.message) ? String(err.message) : 'Failed to remove member');
                                  } finally {
                                    setLoading(false);
                                    if (onRefresh) onRefresh();
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {showTenantUsersModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                  <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowTenantUsersModal(false)} />
                  <div className="bg-white rounded shadow-lg z-10 w-full max-w-xl">
                    <div className="p-4 border-b flex justify-between items-center">
                      <h4 className="text-sm font-semibold">Select a member to add</h4>
                      <button className="text-sm text-gray-600" onClick={() => setShowTenantUsersModal(false)}>Close</button>
                    </div>
                    <div className="p-4">
                      {tenantUsersLoading && <div className="text-sm text-gray-500">Loading users…</div>}
                      {tenantUsersError && <div className="text-sm text-red-600">{tenantUsersError}</div>}
                      {!tenantUsersLoading && tenantUsers.length === 0 && <div className="text-sm text-gray-500">No users found.</div>}
                      <ul className="divide-y divide-gray-100">
                        {tenantUsers.map(u => (
                          <li key={u.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer" onClick={async () => {
                            if (!confirm(`Add ${u.displayName || u.email} to this group?`)) return;
                            try {
                              setAddingUserId(u.id);
                              const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id }) });
                              if (!res.ok) {
                                let body: any = null;
                                try { body = await res.json(); } catch (_) { try { body = await res.text(); } catch (_) { body = null; } }
                                const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || res.statusText || `HTTP ${res.status}`);
                                throw new Error(String(msg));
                              }
                              alert('Member added');
                              // refresh group
                              setLoading(true);
                              const r = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`);
                              const data = await r.json();
                              setGroup(data);
                              setShowTenantUsersModal(false);
                            } catch (err: any) {
                              console.error('Add member failed', err);
                              alert(err?.message ? String(err.message) : 'Failed to add member');
                            } finally {
                              setAddingUserId(null);
                              setLoading(false);
                            }
                          }}>
                            <UserLink userId={u.id} onClick={(e) => e.stopPropagation()}>
                              <Avatar src={u.profile?.avatarUrl || '/placeholder-avatar.svg'} name={u.profile?.displayName || u.email} size="md" className="w-10 h-10 rounded-full mr-4" />
                            </UserLink>
                            <div className="flex-1">
                              <UserLink userId={u.id} onClick={(e) => e.stopPropagation()} className="font-medium text-sm">
                                <span className="font-medium text-sm">{u.profile?.displayName || u.email}</span>
                              </UserLink>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </div>
                            <div>
                              {addingUserId === u.id ? <span className="text-xs text-gray-500">Adding…</span> : <button className="text-xs text-indigo-600">Add</button>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'resources' && (
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">{t('detail.smallGroup.tabs.resources')}</h4>
                {(() => {
                  const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                  const canManage = isLeader || !!isAdmin;
                  if (!canManage) return null;
                  return (
                    <div>
                      <button onClick={() => setShowResourceModal(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">{t('detail.smallGroup.addResource')}</button>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-3">
                {resLoading && <div className="text-sm text-gray-500">Loading resources…</div>}
                {resError && <div className="text-sm text-red-600">{resError}</div>}
                {!resLoading && resources.length === 0 && <div className="text-sm text-gray-500">{t('detail.smallGroup.noResources')}</div>}
                <ul className="mt-2 space-y-3">
                  {resources.map(r => (
                    <li key={r.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{r.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{r.description}</div>
                          {r.url && (
                            <div className="mt-2">
                              <a className="text-xs text-indigo-600" href={r.url} target="_blank" rel="noreferrer">Open resource</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {showResourceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowResourceModal(false)} />
                  <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-lg">
                    <h4 className="text-sm font-semibold">Add Resource</h4>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Title</label>
                        <input className="w-full border rounded px-2 py-1" value={resourceForm.title} onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Description</label>
                        <textarea className="w-full border rounded px-2 py-1" rows={3} value={resourceForm.description} onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">URL (optional)</label>
                        <input className="w-full border rounded px-2 py-1" value={resourceForm.url} onChange={e => setResourceForm(f => ({ ...f, url: e.target.value }))} />
                      </div>
                      <div className="flex items-center space-x-2 justify-end">
                        <button onClick={() => setShowResourceModal(false)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                        <button
                          onClick={async () => {
                            try {
                              const title = (resourceForm.title || '').trim();
                              if (!title) return alert('Title required');

                              const payload = { title, description: resourceForm.description || '', url: resourceForm.url || null };
                              const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/resources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                              if (!res.ok) {
                                const body = await res.json().catch(() => ({}));
                                throw new Error(body?.message || 'Failed to create resource');
                              }
                              const created = await res.json();
                              setResources(r => [created, ...r]);
                              setShowResourceModal(false);
                              setResourceForm({ title: '', description: '', url: '' });
                            } catch (err: any) {
                              console.error(err);
                              alert(err?.message ? String(err.message) : 'Failed to create resource');
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'announcements' && (
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">{t('detail.smallGroup.tabs.announcements')}</h4>
                {(() => {
                  const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                  const canManage = isLeader || !!isAdmin;
                  if (!canManage) return null;
                  return (
                    <div>
                      <button onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm({ title: '', body: '' }); setShowAnnModal(true); }} className="px-3 py-1 bg-indigo-600 text-white rounded">{t('detail.smallGroup.newAnnouncement')}</button>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-3">
                {annLoading && <div className="text-sm text-gray-500">Loading announcements…</div>}
                {annError && <div className="text-sm text-red-600">{annError}</div>}
                {!annLoading && announcements.length === 0 && <div className="text-sm text-gray-500">{t('detail.smallGroup.noAnnouncements')}</div>}
                <ul className="mt-2 space-y-3">
                  {announcements.map(a => (
                    <li key={a.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{a.title}</div>
                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{a.body}</div>
                          <div className="text-xs text-gray-400 mt-2">{a.authorUserId ? `By ${a.authorUserId} • ` : ''}{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                        </div>
                        {(() => {
                          const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                          const canManage = isLeader || !!isAdmin;
                          if (!canManage) return null;
                          return (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingAnnouncementId(a.id);
                                  setAnnouncementForm({ title: a.title || '', body: a.body || '' });
                                  setShowAnnModal(true);
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 rounded"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Delete this announcement?')) return;
                                  try {
                                    const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/announcements/${a.id}`, { method: 'DELETE' });
                                    if (!res.ok) throw new Error('Delete failed');
                                    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
                                  } catch (err) {
                                    console.error(err);
                                    alert('Failed to delete announcement');
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {showAnnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAnnModal(false)} />
                  <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-lg">
                    <h4 className="text-sm font-semibold">{editingAnnouncementId ? 'Edit Announcement' : 'New Announcement'}</h4>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Title</label>
                        <input className="w-full border rounded px-2 py-1" value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Body</label>
                        <textarea className="w-full border rounded px-2 py-1" rows={5} value={announcementForm.body} onChange={e => setAnnouncementForm(f => ({ ...f, body: e.target.value }))} />
                      </div>
                      <div className="flex items-center space-x-2 justify-end">
                        <button onClick={() => setShowAnnModal(false)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                        <button
                          onClick={async () => {
                            try {
                              if (!announcementForm.title || !announcementForm.body) return alert('Title and body required');
                              if (editingAnnouncementId) {
                                const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/announcements/${editingAnnouncementId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: announcementForm.title, body: announcementForm.body }) });
                                if (!res.ok) {
                                  const body = await res.json().catch(() => ({}));
                                  throw new Error(body?.message || 'Failed to update');
                                }
                                const updated = await res.json();
                                setAnnouncements(prev => prev.map(p => p.id === updated.id ? updated : p));
                              } else {
                                const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: announcementForm.title, body: announcementForm.body }) });
                                if (!res.ok) {
                                  const body = await res.json().catch(() => ({}));
                                  throw new Error(body?.message || 'Failed to create');
                                }
                                const created = await res.json();
                                setAnnouncements(prev => [created, ...prev]);
                              }
                              setShowAnnModal(false);
                              setEditingAnnouncementId(null);
                              setAnnouncementForm({ title: '', body: '' });
                            } catch (err) {
                              console.error(err);
                              alert('Failed to save announcement');
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700">{t('common.settings')}</h4>
              <p className="mt-2 text-sm text-gray-500">{t('detail.smallGroup.settingsNote')}</p>
              {(() => {
                const isLeader = group.leader?.id === currentUser?.id || (group.members || []).some((mm: any) => mm.user?.id === currentUser?.id && (mm.role === 'LEADER' || mm.role === 'CO_LEADER'));
                const canEdit = isLeader || !!isAdmin;
                if (!canEdit) {
                  return (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600">Contact a group leader if you need to change these details.</p>
                      <div className="rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{group.name}</div>
                        <div className="mt-1 text-gray-600">{group.description || 'No description provided.'}</div>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-600">
                          <div>
                            <div className="font-semibold text-gray-800">Schedule</div>
                            <div>{group.meetingSchedule || 'Not set'}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Visibility</div>
                            <div>{group.isHidden ? 'Hidden from discovery' : 'Visible to members'}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Status</div>
                            <div>{group.isActive ? 'Active' : 'Inactive'}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Leader</div>
                            <div>{group.leader?.profile?.displayName || group.leader?.email || 'Assigned leader'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (editing) {
                  return (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Name</label>
                        <input className="w-full border rounded px-2 py-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Description</label>
                        <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Schedule</label>
                        <input className="w-full border rounded px-2 py-1" value={form.meetingSchedule} onChange={e => setForm(f => ({ ...f, meetingSchedule: e.target.value }))} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                          <span className="text-sm text-gray-600">Active</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={form.isHidden} onChange={e => setForm(f => ({ ...f, isHidden: e.target.checked }))} />
                          <span className="text-sm text-gray-600">Hidden</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={async () => {
                            // Save
                            try {
                              setSaving(true);
                              const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  name: form.name,
                                  description: form.description,
                                  meetingSchedule: form.meetingSchedule,
                                  isActive: form.isActive,
                                  isHidden: form.isHidden,
                                }),
                              });
                              if (!res.ok) {
                                const body = await res.json().catch(() => ({}));
                                throw new Error(body?.message || 'Failed to save group');
                              }
                              // refresh group
                              const r = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`);
                              const data = await r.json();
                              setGroup(data);
                              setEditing(false);
                              if (onRefresh) onRefresh();
                            } catch (err) {
                              console.error(err);
                              alert('Failed to save changes');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded"
                          disabled={saving}
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-100 text-gray-800 rounded">Cancel</button>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this group? This action cannot be undone.')) return;
                            try {
                              setSaving(true);
                              const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Failed to delete group');
                              if (onRefresh) onRefresh();
                              if (onClose) onClose();
                            } catch (err) {
                              console.error(err);
                              alert('Failed to delete group');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="ml-2 px-3 py-1 bg-red-50 text-red-700 rounded"
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mt-4">
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => setEditing(true)}>Edit Group</button>
                    <button className="ml-2 px-3 py-1 bg-gray-100 text-gray-800 rounded">Manage Leaders</button>
                    <button
                      className={`ml-2 px-3 py-1 ${group.isHidden ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'} rounded`}
                      onClick={async () => {
                        const target = !group.isHidden;
                        if (!confirm(`${target ? 'Hide' : 'Unhide'} this group from discovery? Members will still see it if hidden.`)) return;
                        try {
                          setSaving(true);
                          const res = await fetch(`/api/tenants/${tenantId}/small-groups/${groupId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isHidden: target }) });
                          if (!res.ok) {
                            const body = await res.json().catch(() => ({}));
                            throw new Error(body?.message || 'Failed to update hidden state');
                          }
                          const updated = await res.json();
                          setGroup(updated);
                          alert(`Group ${updated.isHidden ? 'hidden' : 'visible'}`);
                        } catch (err) {
                          console.error(err);
                          alert('Failed to update group hidden setting');
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {group.isHidden ? 'Unhide Group' : 'Hide Group'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => !leaveInProgress && setShowLeaveConfirm(false)} />
          <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-md">
            <h4 className="text-base font-semibold text-gray-900">Leave this group?</h4>
            <p className="mt-2 text-sm text-gray-600">
              You will lose access to group discussions, resources, and announcements. You can request to rejoin later.
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)} disabled={leaveInProgress}>
                Stay in Group
              </Button>
              <Button variant="danger" onClick={handleConfirmLeave} disabled={leaveInProgress}>
                {leaveInProgress ? 'Leaving…' : 'Confirm Leave'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
