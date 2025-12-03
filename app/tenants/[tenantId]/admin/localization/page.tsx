import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import AdminLocalizationPage from '@/app/components/tenant/AdminLocalizationPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function LocalizationSettingsPage({ params }: PageProps) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is admin of this tenant
  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      userId: session.user.id,
      tenantId,
      roles: { some: { role: { in: ['ADMIN'] } } },
    },
  });

  if (!membership) {
    redirect(`/tenants/${tenantId}`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant) {
    redirect('/');
  }

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    settings: {
      enableTranslation: tenant.settings?.enableTranslation ?? false,
      translationSettings: tenant.settings?.translationSettings as {
        allowedLanguages: string[];
        defaultLanguage: string;
        autoTranslateUserContent: boolean;
        glossary?: Record<string, Record<string, string>>;
        rateLimitPerMinute?: number;
        costLimitPerMonth?: number;
        excludedFields?: string[];
      } | undefined,
    },
  };

  return <AdminLocalizationPage tenant={tenantData} />;
}
