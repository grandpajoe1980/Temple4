'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './ui/Toast';
import ImpersonationController from './admin/ImpersonationController';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ImpersonationController />
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
