"use client"

import React, { useState, useEffect } from 'react';
import type { ResourceItem, EnrichedResourceItem, Tenant, User } from '@/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ResourceForm from './forms/ResourceForm';
import ResourceItemCard from './ResourceItemCard';
import CommunityChips from './CommunityChips';
import { useSetPageHeader } from '../ui/PageHeaderContext';

interface ResourceCenterPageProps {
  tenant: Tenant;
  user: User;
  onRefresh?: () => void;
}

const ResourceCenterPage: React.FC<ResourceCenterPageProps> = ({ tenant, user, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState<EnrichedResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);
  const setPageHeader = useSetPageHeader();
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch server-computed tenant context (membership + permissions)
        const meRes = await fetch(`/api/tenants/${tenant.id}/me`);
        const meJson = meRes.ok ? await meRes.json() : null;
        const memberStatus = !!meJson?.membership && meJson.membership.status === 'APPROVED';
        setIsMember(memberStatus);
        setPermissions(meJson?.permissions ?? null);
        setCanUpload(Boolean(meJson?.permissions?.canUploadResources));

        // Fetch resources via API route (server enforces visibility)
        const resourcesRes = await fetch(`/api/tenants/${tenant.id}/resources`);
        const resourceData = resourcesRes.ok ? await resourcesRes.json() : [];
        const normalized = (resourceData || []).map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        }));
        setResources(normalized);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [tenant.id, user.id, onRefresh]);

  // Update page header when canUpload changes
  useEffect(() => {
    setPageHeader({
      title: 'Resources',
      actions: canUpload ? (
        <Button size="sm" data-test="upload-resource-trigger" onClick={() => setIsModalOpen(true)}>+ New</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [canUpload, setPageHeader]);

  // handle create resource via API
  const handleCreateResource = async (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to create resource');
      }
      const created = await res.json();
      const createdNorm = { ...created, createdAt: created.createdAt ? new Date(created.createdAt) : new Date() };
      setResources(prev => [createdNorm, ...prev]);
      onRefresh?.();
      setIsModalOpen(false);
      alert('Resource uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload resource:', error);
      alert('Failed to upload resource');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <CommunityChips tenantId={tenant.id} />
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <p className="text-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={tenant.id} />

      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <ResourceItemCard key={resource.id} resource={resource} currentUser={user} tenant={tenant} permissions={permissions ?? undefined} onUpdate={() => onRefresh?.()} />
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
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest="upload-resource-modal" title="Upload a New Resource">
        <ResourceForm onSubmit={handleCreateResource} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ResourceCenterPage;