import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getUserByEmail, getNotificationsForUser } from '@/lib/data';
import NotificationsPageClient from './NotificationsPageClient';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/login');
  }
  
  const user = await getUserByEmail(session.user.email);
  
  if (!user) {
    redirect('/auth/login');
  }
  
  const notifications = await getNotificationsForUser(user.id);
  
  return (
    <NotificationsPageClient 
      notifications={notifications}
      userId={user.id}
    />
  );
}
