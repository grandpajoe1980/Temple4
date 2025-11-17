import React, { useState, useMemo } from 'react';
import type { Tenant, User, EnrichedCommunityPost } from '../../../types';
import { CommunityPostStatus } from '../../../types';
import { getCommunityPostsForTenant, updateCommunityPostStatus } from '../../../seed-data';
import Button from '../../ui/Button';

interface PrayerWallTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const PrayerWallTab: React.FC<PrayerWallTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const allPosts = useMemo(() => getCommunityPostsForTenant(tenant.id, true), [tenant.id, onRefresh]);
  const [statusFilter, setStatusFilter] = useState<CommunityPostStatus | 'ALL'>('ALL');

  const handleStatusChange = (postId: string, newStatus: CommunityPostStatus) => {
    if (window.confirm(`Are you sure you want to change this post's status to ${newStatus}?`)) {
        updateCommunityPostStatus(postId, newStatus, currentUser.id);
        onRefresh();
    }
  };
  
  const handleDelete = (postId: string) => {
    // For now, we'll just set the status to something that hides it. A real delete would be better.
     if (window.confirm(`Are you sure you want to delete this post? This cannot be undone.`)) {
        // This is a mock for delete. A real implementation would remove the record.
        updateCommunityPostStatus(postId, 'DELETED' as any, currentUser.id);
        onRefresh();
    }
  }

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'ALL') {
      return allPosts;
    }
    return allPosts.filter(post => post.status === statusFilter);
  }, [allPosts, statusFilter]);

  const statusFilters: (CommunityPostStatus | 'ALL')[] = ['ALL', CommunityPostStatus.PENDING_APPROVAL, CommunityPostStatus.PUBLISHED, CommunityPostStatus.FULFILLED];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Prayer Wall Moderation</h3>
        <p className="mt-1 text-sm text-gray-500">Manage all prayer requests and tangible needs submitted by members.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${
                statusFilter === status
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </nav>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Author</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Request</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPosts.map(post => (
                  <tr key={post.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                        <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                                <img className="h-10 w-10 rounded-full" src={post.authorAvatarUrl} alt={post.authorDisplayName} />
                            </div>
                            <div className="ml-4 font-medium text-gray-900">{post.authorDisplayName}</div>
                        </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                        <p className="line-clamp-3">{post.body}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {post.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 space-x-2">
                        {post.status === CommunityPostStatus.PENDING_APPROVAL && (
                            <Button size="sm" onClick={() => handleStatusChange(post.id, CommunityPostStatus.PUBLISHED)}>Approve</Button>
                        )}
                        {post.status === CommunityPostStatus.PUBLISHED && (
                             <Button size="sm" variant="secondary" onClick={() => handleStatusChange(post.id, CommunityPostStatus.FULFILLED)}>Mark as Fulfilled</Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => handleDelete(post.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerWallTab;