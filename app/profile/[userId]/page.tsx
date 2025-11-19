import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound, redirect } from 'next/navigation';
import { getUserById } from '@/lib/data';
import ProfileClientPage from './ProfileClientPage';
import ProfileViewPage from './ProfileViewPage';

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const user = await getUserById(resolvedParams.userId);

  if (!user) {
    return notFound();
  }

  const currentUserId = (session.user as any).id;
  const isSuperAdmin = (session.user as any).isSuperAdmin || false;
  const isOwnProfile = currentUserId === user.id;

  // If viewing own profile, show editable settings page
  if (isOwnProfile) {
    return <ProfileClientPage user={user} />;
  }

  // If viewing someone else's profile, show read-only view with action buttons
  return <ProfileViewPage profileUser={user} currentUserId={currentUserId} isSuperAdmin={isSuperAdmin} />;
}
