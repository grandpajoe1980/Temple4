'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { 
  Heart, Search, Calendar, Plus, ChevronLeft, ChevronRight,
  User, Eye, Flower2
} from 'lucide-react';

interface Memorial {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  story: string | null;
  photos: string[];
  tags: string[];
  viewCount: number;
  linkedFund?: { id: string; name: string } | null;
  submitter?: { displayName: string; avatarUrl: string | null } | null;
  _count?: { tributes: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  isAdmin?: boolean;
}

export default function MemorialGalleryPage({ isAdmin = false }: Props) {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchMemorials();
  }, [tenantId, pagination.page]);

  const fetchMemorials = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/tenants/${tenantId}/memorials`, window.location.origin);
      url.searchParams.set('page', pagination.page.toString());
      url.searchParams.set('limit', pagination.limit.toString());
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchMemorials();
  };

  const getLifespan = (birth: string | null, death: string | null) => {
    if (!birth && !death) return '';
    const birthYear = birth ? new Date(birth).getFullYear() : '?';
    const deathYear = death ? new Date(death).getFullYear() : '?';
    return `${birthYear} - ${deathYear}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-purple-100 rounded-full">
            <Flower2 className="h-12 w-12 text-purple-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          In Loving Memory
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Honoring the lives of those who have touched our hearts. Their memories live on in our community.
        </p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search memorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Button onClick={() => router.push(`/tenants/${tenantId}/memorials/submit`)}>
          <Plus className="h-4 w-4 mr-2" />
          Submit Memorial
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
              <div className="h-48 bg-slate-200 rounded-t-xl" />
              <div className="p-4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && memorials.length === 0 && (
        <Card className="text-center">
          <Flower2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Memorials Yet
          </h3>
          <p className="text-slate-500 mb-6">
            Be the first to honor a loved one's memory.
          </p>
          <Button onClick={() => router.push(`/tenants/${tenantId}/memorials/submit`)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit the First Memorial
          </Button>
        </Card>
      )}

      {/* Memorial Grid */}
      {!loading && memorials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {memorials.map((memorial) => (
            <div 
              key={memorial.id} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/tenants/${tenantId}/memorials/${memorial.id}`)}
            >
              {/* Photo */}
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100">
                {/* Admin actions overlay */}
                {isAdmin && (
                  <div className="absolute z-10 top-2 right-2 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/tenants/${tenantId}/memorials/${memorial.id}`); }}
                      className="inline-flex items-center gap-1 bg-white/90 text-slate-700 px-2 py-1 rounded shadow-sm text-xs"
                      title="Edit memorial"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('Delete this memorial? This action cannot be undone.')) return;
                        try {
                          const res = await fetch(`/api/tenants/${tenantId}/memorials/${memorial.id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Failed to delete memorial');
                          // Refresh list
                          fetchMemorials();
                        } catch (err) {
                          console.error(err);
                          alert('Failed to delete memorial');
                        }
                      }}
                      className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded shadow-sm text-xs"
                      title="Delete memorial"
                    >
                      Delete
                    </button>
                  </div>
                )}
                {memorial.photos && memorial.photos.length > 0 ? (
                  <img 
                    src={memorial.photos[0]} 
                    alt={memorial.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <User className="h-20 w-20 text-purple-300" />
                  </div>
                )}
                {/* View count overlay */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {memorial.viewCount}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-1">
                  {memorial.name}
                </h3>
                <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getLifespan(memorial.birthDate, memorial.deathDate)}
                </p>
                
                {memorial.story && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {memorial.story}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span>{memorial._count?.tributes || 0} tributes</span>
                  </div>
                  {memorial.linkedFund && (
                    <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Fund
                    </span>
                  )}
                </div>

                {/* Tags */}
                {memorial.tags && memorial.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {memorial.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                    {memorial.tags.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        +{memorial.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="secondary"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Total count */}
      {!loading && pagination.total > 0 && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Showing {memorials.length} of {pagination.total} memorials
        </p>
      )}
    </div>
  );
}
