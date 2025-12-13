"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User, EnrichedResourceItem, ResourceItem } from '@/types';
// Use API endpoints instead of importing server helpers
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import ResourceForm from '../forms/ResourceForm';
import useTranslation from '@/app/hooks/useTranslation';

interface ResourceCenterTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const ResourceCenterTab: React.FC<ResourceCenterTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<EnrichedResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/resources`);
        const items = res.ok ? await res.json() : [];
        const normalized = (items || []).map((r: any) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt) : new Date() }));
        setResources(normalized);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResources();
  }, [tenant.id, onRefresh]);

  const handleCreateResource = async (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create resource');
      onRefresh();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(t('settings.resources.addFailed'));
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm(t('settings.resources.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/resources/${resourceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete resource');
      onRefresh();
    } catch (e) {
      console.error(e);
      alert(t('settings.resources.deleteFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.resources.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.resources.description')}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.resources.managementTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.resources.managementDesc')}</p>
        </div>
        <Button data-test="add-resource-trigger" onClick={() => setIsModalOpen(true)}>{t('settings.resources.addResource')}</Button>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{t('settings.resources.titleHeader')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.resources.uploader')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.resources.visibility')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.resources.type')}</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {resources.map(resource => (
                  <tr key={resource.id}>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="font-medium text-gray-900">{resource.title}</div>
                      <div className="text-gray-500 line-clamp-1">{resource.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{resource.uploaderDisplayName}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{resource.visibility.replace('_', ' ')}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{resource.fileType}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(resource.id)}>{t('common.delete')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest="add-resource-modal" title={t('settings.resources.addNewResource')}>
        <ResourceForm onSubmit={handleCreateResource} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ResourceCenterTab;