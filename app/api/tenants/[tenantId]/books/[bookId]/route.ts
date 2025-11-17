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
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'books');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this book.' }, { status: 403 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId, tenantId: tenantId },
    });

    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error(`Failed to fetch book ${bookId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch book' }, { status: 500 });
  }
}

const bookUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    authorName: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
    externalUrl: z.string().url().optional(),
});

// 13.4 Update Book
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; bookId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true }
    });

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
        const updatedBook = await prisma.book.update({
            where: { id: bookId, tenantId: tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error(`Failed to update book ${bookId}:`, error);
        return NextResponse.json({ message: 'Failed to update book' }, { status: 500 });
    }
}

// 13.5 Delete Book
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; bookId: string }> }
) {
    const { tenantId, bookId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true }
    });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateBooks');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete books.' }, { status: 403 });
    }

    try {
        await prisma.book.delete({
            where: { id: bookId, tenantId: tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete book ${bookId}:`, error);
        return NextResponse.json({ message: 'Failed to delete book' }, { status: 500 });
    }
}
