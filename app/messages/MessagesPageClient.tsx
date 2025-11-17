'use client';

import { useRouter } from 'next/navigation';
import MessagesPage from '../components/messages/MessagesPage';
import type { User, EnrichedConversation } from '@/types';

interface MessagesPageClientProps {
  user: User;
  initialConversations: EnrichedConversation[];
}

export default function MessagesPageClient({ user, initialConversations }: MessagesPageClientProps) {
  const router = useRouter();
  
  return (
    <MessagesPage 
      currentUser={user}
      initialConversations={initialConversations}
      onBack={() => router.push('/')} 
      onViewProfile={(userId) => router.push(`/profile/${userId}`)} 
    />
  );
}
