"use client"

import React, { useState, useEffect } from 'react';
import type { ResourceItem, EnrichedResourceItem } from '@/types';
import { getResourceItemsForTenant, getMembershipForUserInTenant, addResourceItem } from '@/lib/data';
import { can } from '@/lib/permissions';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ResourceForm from './forms/ResourceForm';
import ResourceItemCard from './ResourceItemCard';

interface ResourceCenterPageProps {
  tenant: any; // Has architectural issues, needs refactoring
  user: any;
  onRefresh?: () => void;
}

const ResourceCenterPage: React.FC<ResourceCenterPageProps> = ({ tenant, user, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState<EnrichedResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const membership = await getMembershipForUserInTenant(user.id, tenant.id);
        const memberStatus = membership?.status === 'APPROVED';
        setIsMember(memberStatus);
        const resourceData = await getResourceItemsForTenant(tenant.id, memberStatus);
        setResources(resourceData);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [tenant.id, user.id, onRefresh]);

  const canUpload = (can as any)(user, tenant, 'canUploadResources');

  const handleCreateResource = async (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => {
    await addResourceItem({
      ...data,
      tenantId: tenant.id,
      uploaderUserId: user.id,
    });
    onRefresh?.();
    setIsModalOpen(false);
    alert('Resource uploaded successfully!');
    // Reload resources
    const resourceData = await getResourceItemsForTenant(tenant.id, isMember);
    setResources(resourceData);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resource Center</h2>
            <p className="mt-1 text-sm text-gray-500">
              Downloadable files and resources from {tenant.name}.
            </p>
          </div>
        </div>
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <p className="text-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Center</h2>
          <p className="mt-1 text-sm text-gray-500">
            Downloadable files and resources from {tenant.name}.
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setIsModalOpen(true)}>+ Upload Resource</Button>
        )}
      </div>

      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <ResourceItemCard key={resource.id} resource={resource} currentUser={user} tenant={tenant} onUpdate={() => onRefresh?.()} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Resources Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no resources here yet. {canUpload ? 'Why not upload one?' : ''}
          </p>
        </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload a New Resource">
        <ResourceForm onSubmit={handleCreateResource} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ResourceCenterPage;