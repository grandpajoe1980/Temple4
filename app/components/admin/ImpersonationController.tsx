'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImpersonationBanner from './ImpersonationBanner';

const ImpersonationController = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const isActive = Boolean((session?.user as any)?.impersonationActive);
  const realName =
    ((session?.user as any)?.realUserName as string) ||
    ((session?.user as any)?.realUserEmail as string) ||
    'Administrator';
  const impersonatedName = session?.user?.name || session?.user?.email || 'User';

  const handleExit = useCallback(async () => {
    if (isEnding) {
      return;
    }

    setIsEnding(true);
    try {
      const response = await fetch('/api/admin/impersonate/end', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to end impersonation');
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to exit impersonation', error);
      alert('Failed to exit impersonation. Please try again.');
    } finally {
      setIsEnding(false);
    }
  }, [isEnding, router]);

  if (!isActive) {
    return null;
  }

  return (
    <ImpersonationBanner
      originalName={realName}
      impersonatedName={impersonatedName}
      onExit={handleExit}
      isEnding={isEnding}
    />
  );
};

export default ImpersonationController;
