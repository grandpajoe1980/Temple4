'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ControlPanel from '@/app/components/tenant/ControlPanel';

interface TenantSettingsClientProps {
  tenant: any;
  user: any;
}

export default function TenantSettingsClient({ tenant, user }: TenantSettingsClientProps) {
  const router = useRouter();
  const [currentTenant, setCurrentTenant] = useState(tenant);

  useEffect(() => {
    setCurrentTenant(tenant);
  }, [tenant]);

  const persistUpdates = async (updates: any) => {
    const cleanSettings = (settings: any) => {
      if (!settings) return undefined;
      const { id, tenantId, ...rest } = settings;
      return rest;
    };

    const cleanBranding = (branding: any) => {
      if (!branding) return undefined;
      const { id, tenantId, ...rest } = branding;
      return rest;
    };

    const payload: any = { ...updates };

    if (payload.settings) {
      payload.settings = cleanSettings(payload.settings);
    }

    if (payload.branding) {
      payload.branding = cleanBranding(payload.branding);
    }

    const response = await fetch(`/api/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update tenant' }));
        // If the API returned structured validation errors, include them in the thrown message
        if (error && error.errors && typeof error.errors === 'object') {
          const details = Object.entries(error.errors)
            .map(([field, msgs]: any) => `${field}: ${(msgs || []).join(', ')}`)
            .join('; ');
          throw new Error(`${error.message || 'Failed to update tenant'} — ${details}`);
        }
        throw new Error(error.message || 'Failed to update tenant');
    }

    const updated = await response.json();
    setCurrentTenant(updated);
    return updated;
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleUpdate = (updatedTenant: any) => {
    setCurrentTenant(updatedTenant);
  };

  const handleImpersonate = async (targetUser: any) => {
    if (!confirm(`Are you sure you want to impersonate ${targetUser.profile?.displayName || targetUser.email}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetUserId: targetUser.id,
          reason: 'Control Panel impersonation'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start impersonation');
      }

      // Refresh the page to reflect the impersonated session
      router.refresh();
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      alert(error.message || 'Failed to start impersonation. Please try again.');
    }
  };

  return (
    <ControlPanel
      tenant={currentTenant}
      onUpdate={handleUpdate}
      onSave={persistUpdates}
      currentUser={user}
      onImpersonate={handleImpersonate}
      onRefresh={handleRefresh}
    />
  );
}
