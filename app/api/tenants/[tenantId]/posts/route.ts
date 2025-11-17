import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserPost, canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';

// 9.1 List Posts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'posts');
    if (!canView) {
        return NextResponse.json({ message: 'You do not have permission to view posts.' }, { status: 403 });
    }

    const posts = await prisma.post.findMany({
      where: { tenantId: resolvedParams.tenantId },
      include: {
        author: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    const totalPosts = await prisma.post.count({ where: { tenantId: resolvedParams.tenantId } });

    return NextResponse.json({
        posts,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalPosts / limit),
            totalResults: totalPosts,
        }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error(`Failed to fetch posts for tenant ${resolvedParams.tenantId}:`, error);
    
    // Write error to file for debugging
    try {
      const fs = require('fs');
      fs.appendFileSync('error-log.txt', `\n[${new Date().toISOString()}] GET /posts error:\n${errorMessage}\n${errorStack}\n\n`);
    } catch (e) {
      // Ignore file write errors
    }
    
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

const postCreateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    body: z.string().min(1, "Body is required"),
    type: z.enum(['BLOG', 'ANNOUNCEMENT', 'BOOK']).optional().default('BLOG'),
});

// 9.2 Create Post
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

    const result = postCreateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, body, type } = result.data;

    try {
        const canPost = await canUserPost(userId, resolvedParams.tenantId, type === 'ANNOUNCEMENT');
        if (!canPost) {
            return NextResponse.json({ message: 'You do not have permission to create this type of post.' }, { status: 403 });
        }

        const newPost = await prisma.post.create({
            data: {
                title,
                body,
                type,
                tenantId: resolvedParams.tenantId,
                authorUserId: userId,
                isPublished: true,
            },
        });

        // Here you would trigger notifications for announcements
        // if (type === 'ANNOUNCEMENT') { ... }

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(`Failed to create post in tenant ${resolvedParams.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
    }
}
