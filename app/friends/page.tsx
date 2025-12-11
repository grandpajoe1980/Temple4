import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import FriendsPage from './FriendsPage';

export default async function FriendsServerPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/login?callbackUrl=/friends');
    }

    const currentUserId = (session.user as any)?.id;

    return <FriendsPage currentUserId={currentUserId} />;
}
