'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  const bannerRef = useRef<HTMLDivElement | null>(null);

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

      // Force a full page reload to refresh the session
      window.location.reload();
    } catch (error) {
      console.error('Failed to exit impersonation', error);
      alert('Failed to exit impersonation. Please try again.');
      setIsEnding(false);
    }
  }, [isEnding]);

  useEffect(() => {
    const root = document.documentElement;

    const updateOffset = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--impersonation-banner-offset', `${height}px`);
    };

    if (!isActive) {
      root.style.setProperty('--impersonation-banner-offset', '0px');
      return;
    }

    updateOffset();
    window.addEventListener('resize', updateOffset);

    return () => {
      window.removeEventListener('resize', updateOffset);
      root.style.setProperty('--impersonation-banner-offset', '0px');
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <ImpersonationBanner
      ref={bannerRef}
      originalName={realName}
      impersonatedName={impersonatedName}
      onExit={handleExit}
      isEnding={isEnding}
    />
  );
};

export default ImpersonationController;
