'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { 
  ArrowLeft, Calendar, Heart, Share2, Flower2, User, ChevronLeft, ChevronRight,
  Send, Loader2, DollarSign
} from 'lucide-react';
import Modal from '@/app/components/ui/Modal';

interface MemorialTribute {
  id: string;
  message: string;
  relationship: string | null;
  createdAt: string;
  user?: { displayName: string; avatarUrl: string | null } | null;
}

interface Memorial {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  story: string | null;
  photos: string[];
  tags: string[];
  privacy: string;
  viewCount: number;
  linkedFund?: { id: string; name: string } | null;
  submitter?: { displayName: string; avatarUrl: string | null } | null;
  tributes: MemorialTribute[];
}

interface Props {
  isAdmin?: boolean;
}

export default function MemorialDetailPage({ isAdmin = false }: Props) {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const memorialId = params.id as string;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [tributeMessage, setTributeMessage] = useState('');
  const [tributeRelationship, setTributeRelationship] = useState('');
  const [submittingTribute, setSubmittingTribute] = useState(false);
  const [tributes, setTributes] = useState<MemorialTribute[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStory, setEditStory] = useState('');
  const [editPrivacy, setEditPrivacy] = useState('PUBLIC');

  useEffect(() => {
    fetchMemorial();
  }, [tenantId, memorialId]);

  const fetchMemorial = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push(`/tenants/${tenantId}/memorials`);
          return;
        }
        throw new Error('Failed to fetch memorial');
      }
      const data = await res.json();
      setMemorial(data.memorial);
      // Normalize tributes: some API responses use `content` instead of `message`,
      // and `relationship` may be missing for older records. Ensure UI-friendly keys.
      const normalized = (data.memorial.tributes || []).map((t: any) => ({
        ...t,
        message: t.message ?? t.content ?? '',
        relationship: t.relationship ?? null,
      }));
      setTributes(normalized);
    } catch (error) {
      console.error('Error fetching memorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tributeMessage.trim()) return;

    setSubmittingTribute(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}/tributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: tributeMessage,
          relationship: tributeRelationship || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to submit tribute');
        return;
      }

      const data = await res.json();
      const newTribute = {
        ...data.tribute,
        message: data.tribute.message ?? data.tribute.content ?? '',
        relationship: data.tribute.relationship ?? null,
      };
      setTributes(prev => [newTribute, ...prev]);
      setTributeMessage('');
      setTributeRelationship('');
      alert(data.message);
    } catch (error) {
      console.error('Error submitting tribute:', error);
      alert('Failed to submit tribute');
    } finally {
      setSubmittingTribute(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `In Memory of ${memorial?.name}`,
          text: memorial?.story?.slice(0, 100) || `Remembering ${memorial?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-200 rounded mb-8" />
          <div className="h-96 bg-slate-200 rounded-lg mb-8" />
          <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl text-center">
        <Flower2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Memorial Not Found
        </h2>
        <Button onClick={() => router.push(`/tenants/${tenantId}/memorials`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Memorials
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push(`/tenants/${tenantId}/memorials`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Memorials
      </Button>

      {/* Photo Gallery */}
      <div className="mb-8">
        {memorial.photos && memorial.photos.length > 0 ? (
          <div className="relative">
            <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden">
              <img 
                src={memorial.photos[activePhotoIndex]} 
                alt={memorial.name}
                className="w-full h-full object-contain"
              />
            </div>
            {memorial.photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setActivePhotoIndex(prev => 
                    prev === 0 ? memorial.photos.length - 1 : prev - 1
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setActivePhotoIndex(prev => 
                    prev === memorial.photos.length - 1 ? 0 : prev + 1
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* Thumbnail Strip */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {memorial.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === activePhotoIndex 
                          ? 'border-purple-500 ring-2 ring-purple-200' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
            <User className="h-32 w-32 text-purple-300" />
          </div>
        )}
      </div>

      {/* Memorial Info */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {memorial.name}
            </h1>
            <div className="flex items-center gap-4 text-slate-500">
              {(memorial.birthDate || memorial.deathDate) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(memorial.birthDate)} — {formatDate(memorial.deathDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {isAdmin && (
              <>
                <Button variant="secondary" onClick={() => {
                  setEditName(memorial.name || '');
                  setEditStory(memorial.story || '');
                  setEditPrivacy(memorial.privacy || 'PUBLIC');
                  setEditOpen(true);
                }}>
                  Edit
                </Button>
                <Button variant="danger" onClick={async () => {
                  if (!confirm('Delete this memorial? This action cannot be undone.')) return;
                  try {
                    const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete memorial');
                    router.push(`/tenants/${tenantId}/memorials`);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to delete memorial');
                  }
                }}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {memorial.tags && memorial.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {memorial.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Story */}
        {memorial.story && (
          <Card title="Their Story" className="mb-6">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {memorial.story}
            </p>
          </Card>
        )}

        {/* Linked Memorial Fund */}
        {memorial.linkedFund && (
          <div className="mb-6 p-4 border border-purple-200 bg-purple-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">
                  Memorial Fund
                </p>
                <p className="font-semibold text-slate-900">
                  {memorial.linkedFund.name}
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/tenants/${tenantId}/donations/funds/${memorial.linkedFund!.id}`)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Donate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leave a Tribute */}
      <Card title="Leave a Tribute" className="mb-8">
        <form onSubmit={handleSubmitTribute} className="space-y-4">
          <Input
            placeholder="Your relationship (e.g., Friend, Family, Colleague)"
            value={tributeRelationship}
            onChange={(e) => setTributeRelationship(e.target.value)}
          />
          <textarea
            placeholder="Share a memory or message..."
            value={tributeMessage}
            onChange={(e) => setTributeMessage(e.target.value)}
            rows={4}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
          />
          <Button 
            type="submit" 
            disabled={submittingTribute || !tributeMessage.trim()}
          >
            {submittingTribute ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Tribute
          </Button>
        </form>
      </Card>

      {/* Tributes */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Tributes ({tributes.length})
        </h2>

        {tributes.length === 0 ? (
          <Card className="text-center">
            <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              Be the first to leave a tribute for {memorial.name}.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tributes.map((tribute) => (
              <div key={tribute.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {tribute.user?.avatarUrl ? (
                      <img 
                        src={tribute.user.avatarUrl} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">
                        {tribute.user?.displayName || 'Anonymous'}
                      </span>
                      {tribute.relationship && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {tribute.relationship}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 mb-2">
                      {tribute.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tribute.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editOpen && (
        <Modal isOpen={true} onClose={() => setEditOpen(false)} title="Edit Memorial">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Privacy</label>
              <select value={editPrivacy} onChange={(e) => setEditPrivacy(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="PUBLIC">Public</option>
                <option value="MEMBERS_ONLY">Members Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Story</label>
              <textarea value={editStory} onChange={(e) => setEditStory(e.target.value)} rows={6} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  const body: any = {};
                  if (editName.trim() !== (memorial.name || '')) body.name = editName.trim();
                  if (editStory !== (memorial.story || '')) body.story = editStory;
                  if (editPrivacy !== (memorial.privacy || 'PUBLIC')) body.privacy = editPrivacy;

                  const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorialId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to update memorial');
                  }
                  setEditOpen(false);
                  await fetchMemorial();
                } catch (err: any) {
                  console.error(err);
                  alert(err?.message || 'Failed to update memorial');
                }
              }}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
