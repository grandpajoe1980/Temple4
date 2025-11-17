import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/data';
import ProfileClientPage from './ProfileClientPage';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // Or redirect to login page
    return notFound();
  }

  const user = await getUserById(params.userId);

  if (!user) {
    return notFound();
  }

  return <ProfileClientPage user={user} />;
}
