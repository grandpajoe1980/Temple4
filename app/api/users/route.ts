import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search');

  try {
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search } },
              { profile: { displayName: { contains: search } } },
            ],
          }
        : {},
      include: {
        profile: true,
        privacySettings: true,
        accountSettings: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Failed to fetch users', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
