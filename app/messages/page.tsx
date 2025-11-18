import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getUserByEmail, getConversationsForUser } from '@/lib/data';
import MessagesPageClient from './MessagesPageClient';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/login');
  }
  
  const user = await getUserByEmail(session.user.email);
  
  if (!user) {
    redirect('/auth/login');
  }
  
  const conversations = await getConversationsForUser(user.id);
  
  return <MessagesPageClient user={user as any} initialConversations={conversations as any} />; {/* TODO: Type mismatch - see Ticket #0002 */}
}
