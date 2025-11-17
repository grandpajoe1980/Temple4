"use client";

import { useRouter } from 'next/navigation';
import LandingPage from './landing/LandingPage';
import TenantSelector from './tenant/TenantSelector';
import { Session } from 'next-auth';
import { Tenant } from '@prisma/client';

interface HomePageClientProps {
  session: Session | null;
  tenants: Tenant[];
  allTenants: Tenant[];
}

export default function HomePageClient({ session, tenants, allTenants }: HomePageClientProps) {
  const router = useRouter();

  if (!session || !session.user) {
    return <LandingPage onNavigateToLogin={() => router.push('/auth/login')} onSearch={(term) => router.push(`/explore?q=${term}`)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Welcome, {session.user.name}</h1>
        <TenantSelector tenants={allTenants} onSelect={(tenantId) => router.push(`/tenants/${tenantId}`)} onCreateNew={() => router.push('/tenants/new')} />
      </div>
    </div>
  );
}
