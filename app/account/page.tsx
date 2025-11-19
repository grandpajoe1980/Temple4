import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getUserByEmail } from '@/lib/data';
import AccountSettingsPage from '../components/account/AccountSettingsPage';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/login');
  }
  
  const user = await getUserByEmail(session.user.email);
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return (
    <AccountSettingsPage 
      user={user}
    />
  );
}
