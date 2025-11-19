import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Mark all notifications as read for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `${result.count} notification(s) marked as read` 
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json({ message: 'Failed to update notifications' }, { status: 500 });
  }
}
