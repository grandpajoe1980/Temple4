"use client";

import { useRouter } from 'next/navigation';
import LandingPage from './landing/LandingPage';
import TenantSelector from './tenant/TenantSelector';
import UserMenu from './ui/UserMenu';
import { Session } from 'next-auth';

interface HomePageClientProps {
  session: Session | null;
  tenants: any[];
  allTenants: any[];
}

export default function HomePageClient({ session, tenants, allTenants }: HomePageClientProps) {
  const router = useRouter();

  if (!session || !session.user) {
    return <LandingPage onNavigateToLogin={() => router.push('/auth/login')} onSearch={(term) => router.push(`/explore?q=${term}`)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with User Menu */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900">Temple Platform</h1>
            <UserMenu user={session.user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12">
        <div className="max-w-2xl w-full px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Welcome, {session.user.name}</h2>
          <p className="text-center text-gray-600 mb-8">Select a temple to continue</p>
          <TenantSelector tenants={allTenants} onSelect={(tenantId) => router.push(`/tenants/${tenantId}`)} onCreateNew={() => router.push('/tenants/new')} />
        </div>
      </div>
    </div>
  );
}
