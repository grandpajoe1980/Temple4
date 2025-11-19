import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import ChatPage from '@/app/components/tenant/ChatPage';
import { can } from '@/lib/permissions';

export default async function TenantChatPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById((session.user as any).id);

  if (!tenant || !user) {
    redirect('/');
  }

  const canCreateGroupChats = await can(user as any, tenant as any, 'canCreateGroupChats');

  return <ChatPage tenant={tenant} user={user} canCreateGroupChats={canCreateGroupChats} />;
}
