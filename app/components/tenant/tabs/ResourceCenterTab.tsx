"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User, EnrichedResourceItem, ResourceItem } from '@/types';
import { getResourceItemsForTenant, addResourceItem, deleteResourceItem } from '@/lib/data';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import ResourceForm from '../forms/ResourceForm';

interface ResourceCenterTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const ResourceCenterTab: React.FC<ResourceCenterTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const [resources, setResources] = useState<EnrichedResourceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      try {
        const items = await getResourceItemsForTenant(tenant.id, true);
        setResources(items);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResources();
  }, [tenant.id, onRefresh]);

  const handleCreateResource = async (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => {
    await addResourceItem({
      ...data,
      tenantId: tenant.id,
      uploaderUserId: currentUser.id,
    });
    onRefresh();
    setIsModalOpen(false);
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      await deleteResourceItem(resourceId, currentUser.id);
      onRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Resource Center Management</h3>
          <p className="mt-1 text-sm text-gray-500">Manage your tenant's downloadable resources and files.</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Resource Management</h3>
          <p className="mt-1 text-sm text-gray-500">Manage all downloadable resources for your members.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Resource</Button>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploader</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Visibility</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
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
                      <Button variant="danger" size="sm" onClick={() => handleDelete(resource.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Resource">
        <ResourceForm onSubmit={handleCreateResource} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ResourceCenterTab;