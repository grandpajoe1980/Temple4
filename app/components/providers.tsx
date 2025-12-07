'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './ui/Toast';
import ImpersonationController from './admin/ImpersonationController';
import { ThemeProvider } from './ThemeProvider';
import { PageHeaderProvider } from './ui/PageHeaderContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PageHeaderProvider>
          <ImpersonationController />
          <ToastProvider>{children}</ToastProvider>
        </PageHeaderProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
