import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isSuperAdmin = (session.user as { isSuperAdmin?: boolean }).isSuperAdmin;

  if (!isSuperAdmin) {
    return NextResponse.json({ message: 'Forbidden - Super Admin access required' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const search = url.searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { profile: { displayName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          accountSettings: true,
        },
        skip,
        take: limit,
        orderBy: { email: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }: any) => user);

    return NextResponse.json({
      users: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
