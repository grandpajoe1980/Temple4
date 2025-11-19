"use client"

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminConsole from '../components/admin/AdminConsole';
import { useEffect } from 'react';

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    
    if (!session.user.isSuperAdmin) {
      router.push('/');
      return;
    }
  }, [session, status, router]);
  
  if (status === 'loading' || !session?.user?.isSuperAdmin) {
    return <div className="p-8">Loading...</div>;
  }
  
  return <AdminConsole onBack={() => router.push('/')} />;
}
