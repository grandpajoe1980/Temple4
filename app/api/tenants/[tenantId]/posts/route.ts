import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { canUserPost, canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// 9.1 List Posts
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'posts');
    if (!canView) {
        return NextResponse.json({ message: 'You do not have permission to view posts.' }, { status: 403 });
    }

    const posts = await prisma.post.findMany({
      where: { tenantId: params.tenantId },
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
      orderBy: { createdAt: 'desc' },
    });

    const totalPosts = await prisma.post.count({ where: { tenantId: params.tenantId } });

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
    console.error(`Failed to fetch posts for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

const postCreateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    isPinned: z.boolean().optional(),
    isAnnouncement: z.boolean().optional(),
});

// 9.2 Create Post
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = postCreateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, content, isPinned, isAnnouncement } = result.data;

    try {
        const canPost = await canUserPost(userId, params.tenantId, isAnnouncement || false);
        if (!canPost) {
            return NextResponse.json({ message: 'You do not have permission to create this type of post.' }, { status: 403 });
        }

        const newPost = await prisma.post.create({
            data: {
                title,
                content,
                isPinned: isPinned || false,
                isAnnouncement: isAnnouncement || false,
                tenantId: params.tenantId,
                authorId: userId,
            },
        });

        // Here you would trigger notifications for announcements
        // if (newPost.isAnnouncement) { ... }

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(`Failed to create post in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
    }
}
