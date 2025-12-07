'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './ui/Toast';
import ImpersonationController from './admin/ImpersonationController';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ImpersonationController />
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
