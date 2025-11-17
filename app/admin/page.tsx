'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminConsole from '../components/admin/AdminConsole';
import { getUserByEmail } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { User } from '@/types';

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadUser() {
      if (status === 'loading') return;
      
      if (!session?.user?.email) {
        router.push('/auth/login');
        return;
      }
      
      try {
        const userData = await getUserByEmail(session.user.email);
        if (!userData || !userData.isSuperAdmin) {
          router.push('/');
          return;
        }
        setUser(userData as any);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [session, status, router]);
  
  if (loading || !user) {
    return <div className="p-8">Loading...</div>;
  }
  
  return <AdminConsole onBack={() => router.push('/')} />;
}
