import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/notifications - List notifications for current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          actor: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications - Mark all notifications as read
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();
    
    // Check if this is a mark-all-read request
    if (body.action === 'mark-all-read') {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json({ message: 'Failed to update notifications' }, { status: 500 });
  }
}
