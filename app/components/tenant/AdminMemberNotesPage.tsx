'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import { MemberNoteWithDetails, HospitalVisitWithDetails, NoteCategory, NoteVisibility, FollowUpStatus, TenantSettings } from '@/types';

interface AdminMemberNotesPageProps {
  tenantId: string;
}

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  GENERAL: 'General',
  CARE: 'Care',
  HOSPITAL: 'Hospital',
  MENTORSHIP: 'Mentorship',
  PERSONAL_CARE: 'Personal Care',
  COUNSELING: 'Counseling',
  SUPPORT: 'Support',
  FOLLOW_UP: 'Follow-Up',
};

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  GENERAL: 'bg-slate-100 text-slate-700',
  CARE: 'bg-pink-100 text-pink-700',
  HOSPITAL: 'bg-red-100 text-red-700',
  MENTORSHIP: 'bg-green-100 text-green-700',
  PERSONAL_CARE: 'bg-purple-100 text-purple-700',
  COUNSELING: 'bg-indigo-100 text-indigo-700',
  SUPPORT: 'bg-blue-100 text-blue-700',
  FOLLOW_UP: 'bg-orange-100 text-orange-700',
};

const VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  PRIVATE: 'Private',
  STAFF: 'Staff',
  LEADERSHIP: 'Leadership',
  ADMIN_ONLY: 'Admin Only',
};

const VISIBILITY_ICONS: Record<NoteVisibility, string> = {
  PRIVATE: '🔒',
  STAFF: '👥',
  LEADERSHIP: '👔',
  ADMIN_ONLY: '🔐',
};

const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
  ESCALATED: 'Escalated',
};

const FOLLOWUP_STATUS_COLORS: Record<FollowUpStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-slate-100 text-slate-700',
  ESCALATED: 'bg-red-100 text-red-700',
};

export default function AdminMemberNotesPage({ tenantId }: AdminMemberNotesPageProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<MemberNoteWithDetails[]>([]);
  const [hospitalVisits, setHospitalVisits] = useState<HospitalVisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'hospital' | 'follow-ups'>('notes');
  
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | ''>('');
  const [filterVisibility, setFilterVisibility] = useState<NoteVisibility | ''>('');
  const [filterFollowUpStatus, setFilterFollowUpStatus] = useState<FollowUpStatus | ''>('');
  const [myNotesOnly, setMyNotesOnly] = useState(false);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MemberNoteWithDetails | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<HospitalVisitWithDetails | null>(null);

  const [members, setMembers] = useState<Array<{ id: string; displayName: string; avatarUrl?: string }>>([]);
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; displayName: string; avatarUrl?: string }>>([]);

  // New note form
  const [newNote, setNewNote] = useState({
    memberId: '',
    category: 'GENERAL' as NoteCategory,
    visibility: 'STAFF' as NoteVisibility,
    title: '',
    content: '',
    followUpDate: '',
    assignedToId: '',
    tags: '',
  });

  // New hospital visit form
  const [newVisit, setNewVisit] = useState({
    memberId: '',
    hospitalName: '',
    roomNumber: '',
    visitDate: new Date().toISOString().split('T')[0],
    duration: '',
    supportOffered: false,
    serviceProvided: false,
    familyContacted: false,
    notes: '',
    outcome: '',
    nextSteps: '',
    followUpDate: '',
    followUpAssignedToId: '',
  });

  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterVisibility) params.set('visibility', filterVisibility);
      if (filterFollowUpStatus) params.set('followUpStatus', filterFollowUpStatus);
      if (myNotesOnly && session?.user?.id) params.set('authorId', session.user.id);
      if (needsFollowUp) params.set('hasFollowUp', 'true');

      const response = await fetch(`/api/tenants/${tenantId}/member-notes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filterCategory, filterVisibility, filterFollowUpStatus, myNotesOnly, needsFollowUp, session?.user?.id]);

  const fetchHospitalVisits = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/hospital-visits`);
      if (response.ok) {
        const data = await response.json();
        setHospitalVisits(data.visits || []);
      }
    } catch (error) {
      console.error('Error fetching hospital visits:', error);
    }
  }, [tenantId]);

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
      const response = await fetch(`/api/tenants/${tenantId}/members?status=APPROVED`);
      if (response.ok) {
        const data = await response.json();
        const allMembers = data.members?.map((m: { user: { id: string; profile?: { displayName: string; avatarUrl?: string } } }) => ({
          id: m.user.id,
          displayName: m.user.profile?.displayName || 'Unknown',
          avatarUrl: m.user.profile?.avatarUrl,
        })) || [];
        setMembers(allMembers);
        
        const staff = data.members?.filter((m: { roles?: Array<{ role: string }> }) => 
          m.roles?.some((r) => ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role))
        ).map((m: { user: { id: string; profile?: { displayName: string; avatarUrl?: string } } }) => ({
          id: m.user.id,
          displayName: m.user.profile?.displayName || 'Unknown',
          avatarUrl: m.user.profile?.avatarUrl,
        })) || [];
        setStaffMembers(staff);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchNotes();
    fetchHospitalVisits();
    fetchSettings();
    fetchMembers();
  }, [fetchNotes, fetchHospitalVisits, fetchSettings, fetchMembers]);

  const handleCreateNote = async () => {
    if (!newNote.memberId || !newNote.content) {
      alert('Please select a member and enter note content');
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}/member-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNote,
          followUpDate: newNote.followUpDate || null,
          assignedToId: newNote.assignedToId || null,
        }),
      });

      if (response.ok) {
        setNoteModalOpen(false);
        setNewNote({
          memberId: '',
          category: 'GENERAL',
          visibility: 'STAFF',
          title: '',
          content: '',
          followUpDate: '',
          assignedToId: '',
          tags: '',
        });
        fetchNotes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const handleCreateVisit = async () => {
    if (!newVisit.memberId || !newVisit.visitDate) {
      alert('Please select a member and visit date');
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}/hospital-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVisit,
          duration: newVisit.duration ? parseInt(newVisit.duration) : null,
          followUpDate: newVisit.followUpDate || null,
          followUpAssignedToId: newVisit.followUpAssignedToId || null,
        }),
      });

      if (response.ok) {
        setVisitModalOpen(false);
        setNewVisit({
          memberId: '',
          hospitalName: '',
          roomNumber: '',
          visitDate: new Date().toISOString().split('T')[0],
          duration: '',
          supportOffered: false,
          serviceProvided: false,
          familyContacted: false,
          notes: '',
          outcome: '',
          nextSteps: '',
          followUpDate: '',
          followUpAssignedToId: '',
        });
        fetchHospitalVisits();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create visit');
      }
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('Failed to create visit');
    }
  };

  const handleUpdateNoteStatus = async (noteId: string, status: FollowUpStatus) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/member-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          followUpStatus: status,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        fetchNotes();
        if (selectedNote?.id === noteId) {
          const updated = await response.json();
          setSelectedNote(updated);
        }
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/member-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDetailModalOpen(false);
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableMemberNotes: settings?.enableMemberNotes }),
      });

      if (response.ok) {
        setSettingsModalOpen(false);
        fetchSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const openNoteDetail = (note: MemberNoteWithDetails) => {
    setSelectedNote(note);
    setDetailModalOpen(true);
  };

  const filteredNotes = notes.filter(note => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      note.title?.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.member.displayName.toLowerCase().includes(searchLower)
    );
  });

  const pendingFollowUps = notes.filter(n => 
    n.followUpDate && 
    n.followUpStatus && 
    ['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(n.followUpStatus)
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Member Notes & Care</h1>
          <p className="text-slate-600">Track member care, visits, and follow-ups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSettingsModalOpen(true)}>
            ⚙️ Settings
          </Button>
          <Button variant="secondary" onClick={() => setVisitModalOpen(true)}>
            🏥 Log Visit
          </Button>
          <Button onClick={() => setNoteModalOpen(true)}>
            ➕ Add Note
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px ${
            activeTab === 'notes'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          📝 Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('hospital')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px ${
            activeTab === 'hospital'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          🏥 Hospital Visits ({hospitalVisits.length})
        </button>
        <button
          onClick={() => setActiveTab('follow-ups')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px ${
            activeTab === 'follow-ups'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          📋 Follow-Ups ({pendingFollowUps.length})
        </button>
      </div>

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <>
          {/* Filters */}
          <Card>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as NoteCategory | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value as NoteVisibility | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Visibility</option>
                  {Object.entries(VISIBILITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={filterFollowUpStatus}
                  onChange={(e) => setFilterFollowUpStatus(e.target.value as FollowUpStatus | '')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Follow-Up Status</option>
                  {Object.entries(FOLLOWUP_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={myNotesOnly}
                    onChange={(e) => setMyNotesOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600">My notes only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsFollowUp}
                    onChange={(e) => setNeedsFollowUp(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600">Needs follow-up</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Notes List */}
          <div className="space-y-4">
            {filteredNotes.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-slate-500">
                  <p className="text-lg">No notes found</p>
                  <p className="text-sm">Create a note to start tracking member care</p>
                </div>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id}>
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => openNoteDetail(note)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[note.category]}`}>
                            {CATEGORY_LABELS[note.category]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {VISIBILITY_ICONS[note.visibility]} {VISIBILITY_LABELS[note.visibility]}
                          </span>
                          {note.followUpStatus && (
                            <span className={`px-2 py-0.5 rounded text-xs ${FOLLOWUP_STATUS_COLORS[note.followUpStatus]}`}>
                              {FOLLOWUP_STATUS_LABELS[note.followUpStatus]}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-slate-800 truncate">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {note.content}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>👤 {note.member.displayName}</span>
                          <span>✍️ {note.author.displayName}</span>
                          <span>📅 {formatDate(note.createdAt)}</span>
                          {note.followUpDate && (
                            <span className="text-orange-600">
                              📋 Follow-up: {formatDate(note.followUpDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      {note.followUpStatus && note.followUpStatus !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateNoteStatus(note.id, 'COMPLETED');
                          }}
                        >
                          ✓ Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Hospital Visits Tab */}
      {activeTab === 'hospital' && (
        <div className="space-y-4">
          {hospitalVisits.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-slate-500">
                <p className="text-lg">No hospital visits recorded</p>
                <p className="text-sm">Log a visit to start tracking hospital care</p>
              </div>
            </Card>
          ) : (
            hospitalVisits.map((visit) => (
              <Card key={visit.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800">
                        🏥 Visit to {visit.member.displayName}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {visit.hospitalName || 'Hospital not specified'}
                        {visit.roomNumber && ` - Room ${visit.roomNumber}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visit.supportOffered && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            🤝 Support Offered
                          </span>
                        )}
                        {visit.serviceProvided && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            ✅ Service Provided
                          </span>
                        )}
                        {visit.familyContacted && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            👪 Family Contacted
                          </span>
                        )}
                      </div>
                      {visit.notes && (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {visit.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>🧑‍⚕️ Visitor: {visit.visitor.displayName}</span>
                        <span>📅 {formatDateTime(visit.visitDate)}</span>
                        {visit.duration && <span>⏱️ {visit.duration} min</span>}
                        {visit.followUpDate && (
                          <span className="text-orange-600">
                            📋 Follow-up: {formatDate(visit.followUpDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Follow-Ups Tab */}
      {activeTab === 'follow-ups' && (
        <div className="space-y-4">
          {pendingFollowUps.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-slate-500">
                <p className="text-lg">No pending follow-ups</p>
                <p className="text-sm">All follow-ups have been completed</p>
              </div>
            </Card>
          ) : (
            pendingFollowUps.map((note) => (
              <Card key={note.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${note.followUpStatus ? FOLLOWUP_STATUS_COLORS[note.followUpStatus] : ''}`}>
                          {note.followUpStatus ? FOLLOWUP_STATUS_LABELS[note.followUpStatus] : ''}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[note.category]}`}>
                          {CATEGORY_LABELS[note.category]}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-800">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Member: {note.member.displayName}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={`font-medium ${
                          note.followUpDate && new Date(note.followUpDate) < new Date() 
                            ? 'text-red-600' 
                            : 'text-orange-600'
                        }`}>
                          📅 Due: {note.followUpDate ? formatDate(note.followUpDate) : ''}
                        </span>
                        {note.assignedTo && (
                          <span className="text-slate-500">
                            👤 Assigned to: {note.assignedTo.displayName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {note.followUpStatus === 'PENDING' && (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateNoteStatus(note.id, 'IN_PROGRESS')}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        onClick={() => handleUpdateNoteStatus(note.id, 'COMPLETED')}
                      >
                        ✓ Complete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Note Modal */}
      <Modal isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="Add Member Note">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Member *</label>
            <select
              value={newNote.memberId}
              onChange={(e) => setNewNote({ ...newNote, memberId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select a member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={newNote.category}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value as NoteCategory })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
              <select
                value={newNote.visibility}
                onChange={(e) => setNewNote({ ...newNote, visibility: e.target.value as NoteVisibility })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(VISIBILITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{VISIBILITY_ICONS[key as NoteVisibility]} {label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <Input
              placeholder="Note title (optional)"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Enter note content..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-Up Date</label>
              <Input
                type="date"
                value={newNote.followUpDate}
                onChange={(e) => setNewNote({ ...newNote, followUpDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
              <select
                value={newNote.assignedToId}
                onChange={(e) => setNewNote({ ...newNote, assignedToId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">No assignment</option>
                {staffMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <Input
              placeholder="Enter tags separated by commas"
              value={newNote.tags}
              onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>
              Create Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Hospital Visit Modal */}
      <Modal isOpen={visitModalOpen} onClose={() => setVisitModalOpen(false)} title="Log Hospital Visit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Member *</label>
            <select
              value={newVisit.memberId}
              onChange={(e) => setNewVisit({ ...newVisit, memberId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select a member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
              <Input
                placeholder="Hospital name"
                value={newVisit.hospitalName}
                onChange={(e) => setNewVisit({ ...newVisit, hospitalName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
              <Input
                placeholder="Room #"
                value={newVisit.roomNumber}
                onChange={(e) => setNewVisit({ ...newVisit, roomNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visit Date *</label>
              <Input
                type="datetime-local"
                value={newVisit.visitDate}
                onChange={(e) => setNewVisit({ ...newVisit, visitDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
              <Input
                type="number"
                placeholder="Duration"
                value={newVisit.duration}
                onChange={(e) => setNewVisit({ ...newVisit, duration: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newVisit.supportOffered}
                onChange={(e) => setNewVisit({ ...newVisit, supportOffered: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">🤝 Support Offered</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newVisit.serviceProvided}
                onChange={(e) => setNewVisit({ ...newVisit, serviceProvided: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">✅ Service Provided</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newVisit.familyContacted}
                onChange={(e) => setNewVisit({ ...newVisit, familyContacted: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">👪 Family Contacted</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={newVisit.notes}
              onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
              placeholder="Visit notes..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Outcome</label>
              <Input
                placeholder="Visit outcome"
                value={newVisit.outcome}
                onChange={(e) => setNewVisit({ ...newVisit, outcome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Steps</label>
              <Input
                placeholder="Next steps"
                value={newVisit.nextSteps}
                onChange={(e) => setNewVisit({ ...newVisit, nextSteps: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-Up Date</label>
              <Input
                type="date"
                value={newVisit.followUpDate}
                onChange={(e) => setNewVisit({ ...newVisit, followUpDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-Up Assigned To</label>
              <select
                value={newVisit.followUpAssignedToId}
                onChange={(e) => setNewVisit({ ...newVisit, followUpAssignedToId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">No assignment</option>
                {staffMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVisitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVisit}>
              Log Visit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Note Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Note Details">
        {selectedNote && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-sm ${CATEGORY_COLORS[selectedNote.category]}`}>
                {CATEGORY_LABELS[selectedNote.category]}
              </span>
              <span className="text-sm text-slate-500">
                {VISIBILITY_ICONS[selectedNote.visibility]} {VISIBILITY_LABELS[selectedNote.visibility]}
              </span>
              {selectedNote.followUpStatus && (
                <span className={`px-2 py-1 rounded text-sm ${FOLLOWUP_STATUS_COLORS[selectedNote.followUpStatus]}`}>
                  {FOLLOWUP_STATUS_LABELS[selectedNote.followUpStatus]}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-slate-800">
                {selectedNote.title || 'Untitled Note'}
              </h3>
              <p className="text-sm text-slate-500">
                Re: {selectedNote.member.displayName}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedNote.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Author:</span>{' '}
                <span className="font-medium">{selectedNote.author.displayName}</span>
              </div>
              <div>
                <span className="text-slate-500">Created:</span>{' '}
                <span className="font-medium">{formatDateTime(selectedNote.createdAt)}</span>
              </div>
              {selectedNote.followUpDate && (
                <div>
                  <span className="text-slate-500">Follow-Up:</span>{' '}
                  <span className="font-medium">{formatDate(selectedNote.followUpDate)}</span>
                </div>
              )}
              {selectedNote.assignedTo && (
                <div>
                  <span className="text-slate-500">Assigned To:</span>{' '}
                  <span className="font-medium">{selectedNote.assignedTo.displayName}</span>
                </div>
              )}
            </div>

            {selectedNote.tags && (
              <div className="flex flex-wrap gap-1">
                {selectedNote.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="danger" onClick={() => handleDeleteNote(selectedNote.id)}>
                🗑️ Delete
              </Button>
              <div className="flex gap-2">
                {selectedNote.followUpStatus && selectedNote.followUpStatus !== 'COMPLETED' && (
                  <Button onClick={() => handleUpdateNoteStatus(selectedNote.id, 'COMPLETED')}>
                    ✓ Mark Complete
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="Member Notes Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <h4 className="font-medium">Enable Member Notes</h4>
              <p className="text-sm text-slate-500">Allow staff to create and manage member notes</p>
            </div>
            <ToggleSwitch
              label="Enable Member Notes"
              enabled={settings?.enableMemberNotes ?? true}
              onChange={(enabled) => setSettings(s => s ? { ...s, enableMemberNotes: enabled } : null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
