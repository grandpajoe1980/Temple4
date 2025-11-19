'use client';

import { useRouter } from 'next/navigation';
import ControlPanel from '@/app/components/tenant/ControlPanel';

interface TenantSettingsClientProps {
  tenant: any;
  user: any;
}

export default function TenantSettingsClient({ tenant, user }: TenantSettingsClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleUpdate = (updatedTenant: any) => {
    // Refresh to get the latest data from the server
    router.refresh();
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
      tenant={tenant}
      onUpdate={handleUpdate}
      currentUser={user}
      onImpersonate={handleImpersonate}
      onRefresh={handleRefresh}
    />
  );
}
