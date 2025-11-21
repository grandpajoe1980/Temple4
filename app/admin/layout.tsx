import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    // Not authenticated — redirect to login
    redirect('/auth/login');
  }

  const isSuper = Boolean((session.user as any).isSuperAdmin);
  if (!isSuper) {
    // Not authorized — send back to home
    redirect('/');
  }

  return (
    <div>
      {children}
    </div>
  );
}
