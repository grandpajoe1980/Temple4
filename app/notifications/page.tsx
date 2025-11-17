import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getUserByEmail, getNotificationsForUser, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/data';
import NotificationPanel from '../components/notifications/NotificationPanel';

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
    <NotificationPanel 
      notifications={notifications}
      onClose={() => {}}
      onMarkAsRead={(id) => markNotificationAsRead(id)}
      onMarkAllAsRead={() => markAllNotificationsAsRead(user.id)}
      onNavigate={(link) => {}}
    />
  );
}
