'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Tabs from '@/app/components/ui/Tabs';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import Modal from '@/app/components/ui/Modal';
import { 
  Flower2, Clock, CheckCircle, XCircle, Eye, Trash2, 
  Calendar, User, Search, RefreshCw, AlertCircle, Settings
} from 'lucide-react';

interface Memorial {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  story: string | null;
  photos: string[];
  tags: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  privacy: string;
  viewCount: number;
  createdAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterRelationship: string | null;
  rejectionReason: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMemorialsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [viewingMemorial, setViewingMemorial] = useState<Memorial | null>(null);
  const [rejectingMemorial, setRejectingMemorial] = useState<Memorial | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    enableMemorials: true,
    autoApproveTributes: true,
    requireModeration: true,
  });

  useEffect(() => {
    fetchMemorials();
  }, [tenantId, activeTab, pagination.page]);

  const fetchMemorials = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/tenants/${tenantId}/memorials`, window.location.origin);
      url.searchParams.set('page', pagination.page.toString());
      url.searchParams.set('limit', pagination.limit.toString());
      url.searchParams.set('status', activeTab.toUpperCase());
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch memorials');
      
      const data = await res.json();
      setMemorials(data.memorials || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Error fetching memorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (memorialId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} memorial`);
      }

      await fetchMemorials();
      setViewingMemorial(null);
      setRejectingMemorial(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error moderating memorial:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (memorialId: string) => {
    if (!confirm('Are you sure you want to delete this memorial? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete memorial');
      
      await fetchMemorials();
      setViewingMemorial(null);
    } catch (error) {
      console.error('Error deleting memorial:', error);
      alert('Failed to delete memorial');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 text-xs font-medium text-yellow-700"><Clock className="h-3 w-3" />Pending</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" />Rejected</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{status}</span>;
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending Review', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Flower2 className="h-8 w-8 text-purple-600" />
            Memorial Management
          </h1>
          <p className="text-slate-600 mt-1">
            Review and moderate memorial submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchMemorials()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search memorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMemorials()}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchMemorials}>Search</Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPagination(p => ({ ...p, page: 1 })); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'tenant-border-200 tenant-text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : memorials.length === 0 ? (
        <Card className="text-center">
          {activeTab === 'pending' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-slate-500">No pending memorials to review.</p>
            </>
          ) : (
            <>
              <Flower2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Memorials</h3>
              <p className="text-slate-500">No {activeTab} memorials found.</p>
            </>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {memorials.map((memorial) => (
            <div key={memorial.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden">
                  {memorial.photos && memorial.photos.length > 0 ? (
                    <img 
                      src={memorial.photos[0]} 
                      alt={memorial.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-10 w-10 text-purple-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">
                        {memorial.name}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(memorial.birthDate)} - {formatDate(memorial.deathDate)}
                      </p>
                    </div>
                    {getStatusBadge(memorial.status)}
                  </div>

                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {memorial.story || 'No story provided'}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Submitted by: {memorial.submitterName || 'Unknown'}</span>
                    <span>•</span>
                    <span>{formatDate(memorial.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {memorial.viewCount} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setViewingMemorial(memorial)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {memorial.status === 'PENDING' && (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => handleModerate(memorial.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => setRejectingMemorial(memorial)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Memorial Modal */}
      {viewingMemorial && (
        <Modal isOpen={true} onClose={() => setViewingMemorial(null)} title={viewingMemorial.name}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(viewingMemorial.status)}
              <span className="text-sm text-slate-500">
                {formatDate(viewingMemorial.birthDate)} - {formatDate(viewingMemorial.deathDate)}
              </span>
            </div>

            {/* Photos */}
            {viewingMemorial.photos && viewingMemorial.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {viewingMemorial.photos.map((photo, i) => (
                  <img 
                    key={i} 
                    src={photo} 
                    alt={`Photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Story */}
            {viewingMemorial.story && (
              <div>
                <h4 className="font-semibold mb-2">Life Story</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {viewingMemorial.story}
                </p>
              </div>
            )}

            {/* Tags */}
            {viewingMemorial.tags && viewingMemorial.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {viewingMemorial.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submitter Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Submitter Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {viewingMemorial.submitterName || 'N/A'}</p>
                <p><strong>Email:</strong> {viewingMemorial.submitterEmail || 'N/A'}</p>
                <p><strong>Relationship:</strong> {viewingMemorial.submitterRelationship || 'N/A'}</p>
                <p><strong>Privacy:</strong> {viewingMemorial.privacy}</p>
              </div>
            </div>

            {/* Rejection reason if rejected */}
            {viewingMemorial.status === 'REJECTED' && viewingMemorial.rejectionReason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Rejection Reason
                </h4>
                <p className="text-sm text-red-600">
                  {viewingMemorial.rejectionReason}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {viewingMemorial.status === 'PENDING' && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setRejectingMemorial(viewingMemorial);
                      setViewingMemorial(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleModerate(viewingMemorial.id, 'approve')}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => handleDelete(viewingMemorial.id)}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Memorial Modal */}
      {rejectingMemorial && (
        <Modal 
          isOpen={true} 
          onClose={() => { setRejectingMemorial(null); setRejectionReason(''); }}
          title="Reject Memorial"
        >
          <p className="text-sm text-slate-600 mb-4">
            Provide a reason for rejecting the memorial for "{rejectingMemorial.name}".
            This will be sent to the submitter.
          </p>

          <textarea
            placeholder="Reason for rejection (optional but recommended)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary-rgb))] focus:border-transparent mb-4"
          />

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setRejectingMemorial(null); setRejectionReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleModerate(rejectingMemorial.id, 'reject')}
              disabled={actionLoading}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <Modal 
          isOpen={true} 
          onClose={() => setSettingsOpen(false)}
          title="Memorial Settings"
        >
          <p className="text-sm text-slate-600 mb-6">
            Configure how memorials work for your community
          </p>

          <div className="space-y-6">
            <ToggleSwitch 
              label="Enable Memorials"
              description="Allow community members to submit memorials"
              enabled={settings.enableMemorials}
              onChange={(enabled) => setSettings(s => ({ ...s, enableMemorials: enabled }))}
            />

            <ToggleSwitch 
              label="Require Moderation"
              description="Memorials require admin approval before publishing"
              enabled={settings.requireModeration}
              onChange={(enabled) => setSettings(s => ({ ...s, requireModeration: enabled }))}
            />

            <ToggleSwitch 
              label="Auto-Approve Tributes"
              description="Automatically approve tribute messages from members"
              enabled={settings.autoApproveTributes}
              onChange={(enabled) => setSettings(s => ({ ...s, autoApproveTributes: enabled }))}
            />
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button>
              Save Settings
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
