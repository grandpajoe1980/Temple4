"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Tenant, User, EnrichedCommunityPost } from '@/types';
import { CommunityPostStatus } from '@/types';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import useTranslation from '@/app/hooks/useTranslation';

async function fetchCommunityPosts(tenantId: string, includePrivate?: boolean) {
  const search = includePrivate ? '?includePrivate=true' : '';
  const response = await fetch(`/api/tenants/${tenantId}/community-posts${search}`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Unable to load community posts');
  }

  return response.json();
}

async function updateCommunityPostStatus(tenantId: string, postId: string, status: CommunityPostStatus) {
  const response = await fetch(`/api/tenants/${tenantId}/community-posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Unable to update post status');
  }

  return response.json();
}

interface PrayerWallTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

const PrayerWallTab: React.FC<PrayerWallTabProps> = ({ tenant, currentUser, onRefresh, onUpdate, onSave }) => {
  const { t } = useTranslation();
  const [allPosts, setAllPosts] = useState<EnrichedCommunityPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<CommunityPostStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const posts = await fetchCommunityPosts(tenant.id, true);
        setAllPosts(posts as any);
      } catch (error) {
        console.error('Failed to load support request posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, [tenant.id, onRefresh]);

  const handleStatusChange = async (postId: string, newStatus: CommunityPostStatus) => {
    if (window.confirm(`Are you sure you want to change this post's status to ${newStatus}?`)) {
      await updateCommunityPostStatus(tenant.id, postId, newStatus);
      onRefresh();
    }
  };

  const handleDelete = async (postId: string) => {
    // For now, we'll just set the status to something that hides it. A real delete would be better.
    if (window.confirm(`Are you sure you want to delete this post? This cannot be undone.`)) {
      // This is a mock for delete. A real implementation would remove the record.
      await updateCommunityPostStatus(tenant.id, postId, 'DELETED' as any);
      onRefresh();
    }
  }

  const handleAutoApproveToggle = (enabled: boolean) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        autoApproveSupportRequests: enabled,
      },
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await onSave({ settings: { ...tenant.settings } });
      onRefresh();
      alert(t('settings.prayerWall.saved'));
    } catch (error: any) {
      alert(error.message || t('settings.prayerWall.saveFailed'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'ALL') {
      return allPosts;
    }
    return allPosts.filter(post => post.status === statusFilter);
  }, [allPosts, statusFilter]);

  const statusFilters: (CommunityPostStatus | 'ALL')[] = ['ALL', CommunityPostStatus.PENDING_APPROVAL, CommunityPostStatus.PUBLISHED, CommunityPostStatus.FULFILLED];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.prayerWall.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.prayerWall.description')}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.prayerWall.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.prayerWall.description')}</p>
      </div>

      <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <ToggleSwitch
          label={t('settings.prayerWall.autoApprove')}
          description={t('settings.prayerWall.autoApproveDesc')}
          enabled={tenant.settings.autoApproveSupportRequests}
          onChange={handleAutoApproveToggle}
        />
        <div className="text-right">
          <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? t('common.saving') : t('settings.prayerWall.saveSettings')}
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${statusFilter === status
                  ? 'border-[color:var(--primary)] tenant-text-primary'
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
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{t('settings.prayerWall.author')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.prayerWall.request')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.smallGroups.status')}</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPosts.map((post: any) => (
                  <tr key={post.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <UserLink userId={post.authorUserId}>
                            <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size="md" />
                          </UserLink>
                        </div>
                        <div className="ml-4 font-medium text-gray-900">
                          <UserLink userId={post.authorUserId} className="inline-block">
                            {post.authorDisplayName}
                          </UserLink>
                        </div>
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
                        <Button size="sm" onClick={() => handleStatusChange(post.id, CommunityPostStatus.PUBLISHED)}>{t('common.approve')}</Button>
                      )}
                      {post.status === CommunityPostStatus.PUBLISHED && (
                        <Button size="sm" variant="secondary" onClick={() => handleStatusChange(post.id, CommunityPostStatus.FULFILLED)}>{t('settings.prayerWall.markFulfilled')}</Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(post.id)}>{t('common.delete')}</Button>
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