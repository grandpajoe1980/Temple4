import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';


// 13.3 Get Single Book
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; bookId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'books');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this book.' }, { status: 403 });
    }

    const book = await prisma.post.findFirst({
      where: { 
        id: resolvedParams.bookId, 
        tenantId: resolvedParams.tenantId,
        type: 'BOOK'
      },
    });

    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error(`Failed to fetch book ${resolvedParams.bookId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch book' }, { status: 500 });
  }
}

const bookUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().optional(),
});

// 13.4 Update Book
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; bookId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canUpdate = await can(user, tenant, 'canCreateBooks');
    if (!canUpdate) {
        return NextResponse.json({ message: 'You do not have permission to update books.' }, { status: 403 });
    }

    const result = bookUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const updatedBook = await prisma.post.updateMany({
            where: { 
              id: resolvedParams.bookId, 
              tenantId: resolvedParams.tenantId,
              type: 'BOOK'
            },
            data: result.data,
        });

        if (updatedBook.count === 0) {
            return NextResponse.json({ message: 'Book not found' }, { status: 404 });
        }

        const book = await prisma.post.findUnique({ where: { id: resolvedParams.bookId } });
        return NextResponse.json(book);
    } catch (error) {
        console.error(`Failed to update book ${resolvedParams.bookId}:`, error);
        return NextResponse.json({ message: 'Failed to update book' }, { status: 500 });
    }
}

// 13.5 Delete Book
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; bookId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateBooks');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete books.' }, { status: 403 });
    }

    try {
        const book = await prisma.post.findFirst({
            where: { 
              id: resolvedParams.bookId, 
              tenantId: resolvedParams.tenantId,
              type: 'BOOK'
            },
        });
        
        if (!book) {
            return NextResponse.json({ message: 'Book not found' }, { status: 404 });
        }

        await prisma.post.delete({
            where: { id: resolvedParams.bookId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete book ${resolvedParams.bookId}:`, error);
        return NextResponse.json({ message: 'Failed to delete book' }, { status: 500 });
    }
}
