import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, forbidden, unauthorized, validationError } from '@/lib/api-response';

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
      return forbidden('You do not have permission to view books.');
    }

    const books = await prisma.book.findMany({
      where: { 
        tenantId: resolvedParams.tenantId,
        deletedAt: null, // Filter out soft-deleted books
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error(`Failed to fetch books for tenant ${resolvedParams.tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/books', tenantId: resolvedParams.tenantId });
  }
}

const bookSchema = z.object({
    title: z.string().min(1),
    authorName: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
    externalUrl: z.string().url().optional(),
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
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: resolvedParams.tenantId },
        select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true }
    });

    if (!user || !tenant) {
      return validationError({ request: ['Invalid user or tenant'] });
    }

    const canCreate = await can(user, tenant, 'canCreateBooks');
    if (!canCreate) {
      return forbidden('You do not have permission to create books.');
    }

    const result = bookSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const newBook = await prisma.book.create({
            data: {
                ...result.data,
                tenantId: resolvedParams.tenantId,
                authorUserId: userId,
            },
        });

        return NextResponse.json(newBook, { status: 201 });
    } catch (error) {
      console.error(`Failed to create book in tenant ${resolvedParams.tenantId}:`, error);
      return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/books', tenantId: resolvedParams.tenantId });
    }
}
