import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

// 13.1 List Books
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'books');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view books.' }, { status: 403 });
    }

    const books = await prisma.book.findMany({
      where: { tenantId: resolvedParams.tenantId },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error(`Failed to fetch books for tenant ${resolvedParams.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch books' }, { status: 500 });
  }
}

const bookSchema = z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    description: z.string().optional(),
    coverImageUrl: z.string().url().optional(),
    purchaseUrl: z.string().url().optional(),
});

// 13.2 Create Book
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId }, include: { permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canCreate = await can(user, tenant, 'canCreateBooks');
    if (!canCreate) {
        return NextResponse.json({ message: 'You do not have permission to create books.' }, { status: 403 });
    }

    const result = bookSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newBook = await prisma.book.create({
            data: {
                ...result.data,
                tenantId: resolvedParams.tenantId,
            },
        });

        return NextResponse.json(newBook, { status: 201 });
    } catch (error) {
        console.error(`Failed to create book in tenant ${resolvedParams.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create book' }, { status: 500 });
    }
}
