import React, { useState, useMemo } from 'react';
import type { Tenant, User, ResourceItem } from '../../types';
import { getResourceItemsForTenant, getMembershipForUserInTenant, addResourceItem } from '../../seed-data';
import { can } from '../../lib/permissions';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ResourceForm from './forms/ResourceForm';
import ResourceItemCard from './ResourceItemCard';

interface ResourceCenterPageProps {
  tenant: Tenant;
  user: User;
  onRefresh: () => void;
}

const ResourceCenterPage: React.FC<ResourceCenterPageProps> = ({ tenant, user, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const membership = useMemo(() => getMembershipForUserInTenant(user.id, tenant.id), [user.id, tenant.id]);
  const isMember = membership?.status === 'APPROVED';
  
  const resources = useMemo(() => getResourceItemsForTenant(tenant.id, isMember), [tenant.id, isMember, onRefresh]);

  const canUpload = can(user, tenant, 'canUploadResources');

  const handleCreateResource = (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => {
    addResourceItem({
      ...data,
      tenantId: tenant.id,
      uploaderUserId: user.id,
    });
    onRefresh();
    setIsModalOpen(false);
    alert('Resource uploaded successfully!');
  };

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
            <ResourceItemCard key={resource.id} resource={resource} currentUser={user} tenant={tenant} onUpdate={onRefresh} />
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