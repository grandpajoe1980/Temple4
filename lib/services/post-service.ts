import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withTenantScope } from '@/lib/tenant-isolation';
import { canUserPost, canUserViewContent } from '@/lib/permissions';
import { PostWithAuthor } from '@/types';

export class PostPermissionError extends Error {}

export interface PostResponseDto {
  id: string;
  tenantId: string;
  authorUserId: string;
  type: 'BLOG' | 'ANNOUNCEMENT' | 'BOOK';
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
}

interface ListTenantPostsOptions {
  tenantId: string;
  viewerUserId?: string | null;
  page?: number;
  limit?: number;
  publishedOnly?: boolean;
}

type PostRecord = Prisma.PostGetPayload<{
  include: {
    author: { include: { profile: true } };
  };
}>;

export function mapPostToResponseDto(post: PostRecord): PostResponseDto {
  return {
    id: post.id,
    tenantId: post.tenantId,
    authorUserId: post.authorUserId,
    type: post.type as PostResponseDto['type'],
    title: post.title,
    body: post.body,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    authorDisplayName: post.author.profile?.displayName || 'Unknown',
    authorAvatarUrl: post.author.profile?.avatarUrl || null,
  };
}

export function mapPostDtoToClient(post: PostResponseDto): PostWithAuthor {
  return {
    id: post.id,
    tenantId: post.tenantId,
    authorUserId: post.authorUserId,
    type: post.type,
    title: post.title,
    body: post.body,
    isPublished: post.isPublished,
    publishedAt: new Date(post.publishedAt),
    authorDisplayName: post.authorDisplayName,
    authorAvatarUrl: post.authorAvatarUrl ?? undefined,
  };
}

export async function listTenantPosts(options: ListTenantPostsOptions) {
  const {
    tenantId,
    viewerUserId,
    page = 1,
    limit,
    publishedOnly = true,
  } = options;

  const canView = await canUserViewContent(viewerUserId ?? null, tenantId, 'posts');
  if (!canView) {
    throw new PostPermissionError('You do not have permission to view posts.');
  }

  const whereClause: Prisma.PostWhereInput = withTenantScope(
    {
      deletedAt: null,
      ...(publishedOnly ? { isPublished: true } : {}),
    },
    tenantId,
    'Post'
  );

  const paginationOptions = limit
    ? {
        skip: (page - 1) * limit,
        take: limit,
      }
    : {};

  const posts = await prisma.post.findMany({
    where: whereClause,
    include: {
      author: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    ...paginationOptions,
  });

  const totalResults = await prisma.post.count({ where: whereClause });

  return {
    posts: posts.map(mapPostToResponseDto),
    pagination: {
      page,
      limit: limit ?? posts.length,
      totalPages: limit ? Math.ceil(totalResults / limit) : 1,
      totalResults,
    },
  };
}

interface CreateTenantPostInput {
  title: string;
  body: string;
  type: 'BLOG' | 'ANNOUNCEMENT' | 'BOOK';
  isPublished?: boolean;
}

export async function createTenantPost(options: {
  tenantId: string;
  authorUserId: string;
  data: CreateTenantPostInput;
}) {
  const { tenantId, authorUserId, data } = options;
  const { title, body, type, isPublished = true } = data;

  const canPost = await canUserPost(authorUserId, tenantId, type === 'ANNOUNCEMENT');
  if (!canPost) {
    throw new PostPermissionError('You do not have permission to create this type of post.');
  }

  const newPost = await prisma.post.create({
    data: {
      title,
      body,
      type,
      tenantId,
      authorUserId,
      isPublished,
    },
    include: {
      author: {
        include: { profile: true },
      },
    },
  });

  return mapPostToResponseDto(newPost);
}
