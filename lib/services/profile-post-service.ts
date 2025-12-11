import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';

export class ProfilePostPermissionError extends Error { }

export type ProfilePostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'MIXED';
export type ProfilePostPrivacy = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';
export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';

export interface CreateProfilePostInput {
    type: ProfilePostType;
    content?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkImage?: string;
    privacy: ProfilePostPrivacy;
    mediaIds?: string[];
}

export interface UpdateProfilePostInput {
    content?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkImage?: string;
    privacy?: ProfilePostPrivacy;
}

export interface ProfilePostDto {
    id: string;
    userId: string;
    type: ProfilePostType;
    content?: string | null;
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkImage?: string | null;
    privacy: ProfilePostPrivacy;
    createdAt: string;
    updatedAt: string;
    authorDisplayName: string;
    authorAvatarUrl?: string | null;
    media: ProfilePostMediaDto[];
    reactions: ProfilePostReactionDto[];
    comments: ProfilePostCommentDto[];
    reactionCounts: Record<ReactionType, number>;
    userReaction?: ReactionType | null;
}

export interface ProfilePostMediaDto {
    id: string;
    type: MediaType;
    url: string;
    mimeType: string;
    fileSize: number;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    order: number;
}

export interface ProfilePostReactionDto {
    id: string;
    userId: string;
    type: ReactionType;
    userDisplayName: string;
    userAvatarUrl?: string | null;
    createdAt: string;
}

export interface ProfilePostCommentDto {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    authorDisplayName: string;
    authorAvatarUrl?: string | null;
}

/**
 * Check if two users are friends (using the Friendship model)
 */
async function areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
    // Check if there's a friendship record between the two users
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { userId: userId1, friendId: userId2 },
                { userId: userId2, friendId: userId1 },
            ],
        },
    });

    return friendship !== null;
}

/**
 * Check if viewer can see a post based on privacy settings
 */
async function canViewPost(post: { userId: string; privacy: string }, viewerId?: string | null): Promise<boolean> {
    // Post owner can always see their own posts
    if (viewerId && post.userId === viewerId) {
        return true;
    }

    // Public posts are visible to everyone
    if (post.privacy === 'PUBLIC') {
        return true;
    }

    // Private posts only visible to owner
    if (post.privacy === 'PRIVATE') {
        return false;
    }

    // Friends-only posts require viewer to be logged in and be friends
    if (post.privacy === 'FRIENDS') {
        if (!viewerId) {
            return false;
        }
        return await areUsersFriends(post.userId, viewerId);
    }

    return false;
}

/**
 * Create a new profile post
 */
export async function createProfilePost(userId: string, data: CreateProfilePostInput): Promise<ProfilePostDto> {
    const post = await prisma.profilePost.create({
        data: {
            userId,
            type: data.type,
            content: data.content,
            linkUrl: data.linkUrl,
            linkTitle: data.linkTitle,
            linkImage: data.linkImage,
            privacy: data.privacy,
        },
        include: {
            user: {
                include: {
                    profile: true
                }
            },
            media: {
                orderBy: { order: 'asc' }
            },
            reactions: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            },
            comments: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    // If mediaIds provided, attach them as ProfilePostMedia entries
    if (data.mediaIds && data.mediaIds.length > 0) {
        try {
            // Fetch referenced MediaItem records
            const mediaItems = await prisma.mediaItem.findMany({
                where: { id: { in: data.mediaIds } }
            });

            // Build media rows preserving order from data.mediaIds
            const mediaRows = await Promise.all(
                data.mediaIds.map(async (mid, idx) => {
                    const mi = mediaItems.find(m => m.id === mid);
                    if (!mi) return null;
                    const url = mi.storageKey ? await getSignedUrl(mi.storageKey) : '';
                    return {
                        postId: post.id,
                        type: 'IMAGE' as any,
                        url,
                        storageKey: mi.storageKey || '',
                        mimeType: mi.mimeType || '',
                        fileSize: mi.fileSize || 0,
                        order: idx,
                    };
                })
            );

            const rowsToCreate = mediaRows.filter(Boolean) as any[];
            if (rowsToCreate.length > 0) {
                await prisma.profilePostMedia.createMany({ data: rowsToCreate });
            }

            // Re-fetch post with media included so the returned DTO contains the media entries
            const refreshed = await prisma.profilePost.findUnique({
                where: { id: post.id },
                include: {
                    user: { include: { profile: true } },
                    media: { orderBy: { order: 'asc' } },
                    reactions: { include: { user: { include: { profile: true } } } },
                    comments: { include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'asc' } }
                }
            });

            if (refreshed) return mapPostToDto(refreshed, userId);
        } catch (e) {
            console.error('Failed to attach media to profile post', e);
            // Fall through and return the original post DTO
        }
    }

    return mapPostToDto(post, userId);
}

/**
 * Update a profile post (owner only)
 */
export async function updateProfilePost(
    postId: string,
    userId: string,
    data: UpdateProfilePostInput
): Promise<ProfilePostDto> {
    // Check ownership
    const existingPost = await prisma.profilePost.findUnique({
        where: { id: postId }
    });

    if (!existingPost) {
        throw new ProfilePostPermissionError('Post not found');
    }

    if (existingPost.userId !== userId) {
        throw new ProfilePostPermissionError('You can only edit your own posts');
    }

    const post = await prisma.profilePost.update({
        where: { id: postId },
        data: {
            content: data.content,
            linkUrl: data.linkUrl,
            linkTitle: data.linkTitle,
            linkImage: data.linkImage,
            privacy: data.privacy,
        },
        include: {
            user: {
                include: {
                    profile: true
                }
            },
            media: {
                orderBy: { order: 'asc' }
            },
            reactions: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            },
            comments: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    return mapPostToDto(post, userId);
}

/**
 * Delete a profile post (soft delete, owner only)
 */
export async function deleteProfilePost(postId: string, userId: string): Promise<void> {
    const existingPost = await prisma.profilePost.findUnique({
        where: { id: postId }
    });

    if (!existingPost) {
        throw new ProfilePostPermissionError('Post not found');
    }

    if (existingPost.userId !== userId) {
        throw new ProfilePostPermissionError('You can only delete your own posts');
    }

    await prisma.profilePost.update({
        where: { id: postId },
        data: { deletedAt: new Date() }
    });
}

/**
 * Get profile posts for a user with privacy filtering
 */
export async function getProfilePosts(
    userId: string,
    viewerId?: string | null,
    options?: {
        page?: number;
        limit?: number;
    }
): Promise<{ posts: ProfilePostDto[]; totalCount: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // Build privacy filter
    let privacyFilter: Prisma.ProfilePostWhereInput = {};

    if (viewerId === userId) {
        // Owner sees all their posts
        privacyFilter = {};
    } else if (viewerId) {
        // Logged-in user sees PUBLIC and FRIENDS posts (if friends)
        const areFriends = await areUsersFriends(userId, viewerId);
        if (areFriends) {
            privacyFilter = {
                privacy: {
                    in: ['PUBLIC', 'FRIENDS']
                }
            };
        } else {
            privacyFilter = {
                privacy: 'PUBLIC'
            };
        }
    } else {
        // Anonymous user sees only PUBLIC posts
        privacyFilter = {
            privacy: 'PUBLIC'
        };
    }

    const [posts, totalCount] = await Promise.all([
        prisma.profilePost.findMany({
            where: {
                userId,
                deletedAt: null,
                ...privacyFilter
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                media: {
                    orderBy: { order: 'asc' }
                },
                reactions: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                comments: {
                    where: { deletedAt: null },
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.profilePost.count({
            where: {
                userId,
                deletedAt: null,
                ...privacyFilter
            }
        })
    ]);

    return {
        posts: posts.map(post => mapPostToDto(post, viewerId)),
        totalCount
    };
}

/**
 * Get a single profile post
 */
export async function getProfilePost(postId: string, viewerId?: string | null): Promise<ProfilePostDto> {
    const post = await prisma.profilePost.findUnique({
        where: { id: postId },
        include: {
            user: {
                include: {
                    profile: true
                }
            },
            media: {
                orderBy: { order: 'asc' }
            },
            reactions: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            },
            comments: {
                where: { deletedAt: null },
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!post || post.deletedAt) {
        throw new ProfilePostPermissionError('Post not found');
    }

    const canView = await canViewPost(post, viewerId);
    if (!canView) {
        throw new ProfilePostPermissionError('You do not have permission to view this post');
    }

    return mapPostToDto(post, viewerId);
}

/**
 * Add or update a reaction to a post
 */
export async function addReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
    // Verify post exists and user can view it
    await getProfilePost(postId, userId);

    await prisma.profilePostReaction.upsert({
        where: {
            postId_userId: {
                postId,
                userId
            }
        },
        create: {
            postId,
            userId,
            type: reactionType
        },
        update: {
            type: reactionType
        }
    });
}

/**
 * Remove a reaction from a post
 */
export async function removeReaction(postId: string, userId: string): Promise<void> {
    await prisma.profilePostReaction.deleteMany({
        where: {
            postId,
            userId
        }
    });
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, userId: string, content: string): Promise<ProfilePostCommentDto> {
    // Verify post exists and user can view it
    await getProfilePost(postId, userId);

    const comment = await prisma.profilePostComment.create({
        data: {
            postId,
            userId,
            content
        },
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    });

    return {
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        authorDisplayName: comment.user.profile?.displayName || 'Unknown',
        authorAvatarUrl: comment.user.profile?.avatarUrl
    };
}

/**
 * List public profile posts for members of a tenant
 */
export async function listTenantProfilePosts(
    tenantId: string,
    viewerId?: string | null,
    options?: { page?: number; limit?: number }
): Promise<{ posts: ProfilePostDto[]; totalCount: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // Find approved member userIds for the tenant
    const memberships = await prisma.userTenantMembership.findMany({
        where: { tenantId, status: 'APPROVED' },
        select: { userId: true }
    });

    const userIds = memberships.map(m => m.userId);
    if (userIds.length === 0) return { posts: [], totalCount: 0 };

    const [posts, totalCount] = await Promise.all([
        prisma.profilePost.findMany({
            where: {
                userId: { in: userIds },
                privacy: 'PUBLIC',
                deletedAt: null,
                hiddenRecords: { none: { tenantId } }
            },
            include: {
                user: { include: { profile: true } },
                media: { orderBy: { order: 'asc' } },
                reactions: { include: { user: { include: { profile: true } } } },
                comments: { where: { deletedAt: null }, include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'asc' } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.profilePost.count({
            where: {
                userId: { in: userIds },
                privacy: 'PUBLIC',
                deletedAt: null,
                hiddenRecords: { none: { tenantId } }
            }
        })
    ]);

    return { posts: posts.map(p => mapPostToDto(p, viewerId)), totalCount };
}

/**
 * Hide a profile post for moderation (soft-delete)
 * Allowed actors: post owner, tenant admin (role=ADMIN), platform superadmin
 */
export async function hideProfilePost(postId: string, actorUserId: string, tenantId: string): Promise<void> {
    const post = await prisma.profilePost.findUnique({ where: { id: postId } });
    if (!post) throw new ProfilePostPermissionError('Post not found');

    // Only allow tenant-level hide for permitted actors. Create a ProfilePostHidden record
    // so the post remains available on the owner's profile but is hidden on this tenant's wall.

    // Check permissions: owner, tenant admin, or platform superadmin may hide for tenant
    const actor = await prisma.user.findUnique({ where: { id: actorUserId } });
    const isPlatformAdmin = Boolean(actor?.isSuperAdmin);

    const membership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: actorUserId, tenantId } },
        include: { roles: true }
    });
    const allowedRoles = ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'];
    const isTenantAdmin = membership?.roles?.some(r => allowedRoles.includes(r.role));

    if (!(post.userId === actorUserId || isTenantAdmin || isPlatformAdmin)) {
        throw new ProfilePostPermissionError('Not authorized to hide this post for this tenant');
    }

    // create hide record if not exists
    const existing = await prisma.profilePostHidden.findUnique({ where: { postId_tenantId: { postId, tenantId } } }).catch(() => null);
    if (existing) return;

    await prisma.profilePostHidden.create({
        data: {
            postId,
            tenantId,
            hiddenByUserId: actorUserId
        }
    });
}

/**
 * Delete a comment (owner only)
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.profilePostComment.findUnique({
        where: { id: commentId }
    });

    if (!comment) {
        throw new ProfilePostPermissionError('Comment not found');
    }

    if (comment.userId !== userId) {
        throw new ProfilePostPermissionError('You can only delete your own comments');
    }

    await prisma.profilePostComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() }
    });
}

/**
 * Map Prisma post to DTO
 */
function mapPostToDto(post: any, viewerId?: string | null): ProfilePostDto {
    // Calculate reaction counts
    const reactionCounts: Record<ReactionType, number> = {
        LIKE: 0,
        LOVE: 0,
        LAUGH: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0
    };

    let userReaction: ReactionType | null = null;

    post.reactions.forEach((reaction: any) => {
        reactionCounts[reaction.type as ReactionType]++;
        if (viewerId && reaction.userId === viewerId) {
            userReaction = reaction.type as ReactionType;
        }
    });

    return {
        id: post.id,
        userId: post.userId,
        type: post.type as ProfilePostType,
        content: post.content,
        linkUrl: post.linkUrl,
        linkTitle: post.linkTitle,
        linkImage: post.linkImage,
        privacy: post.privacy as ProfilePostPrivacy,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        authorDisplayName: post.user.profile?.displayName || 'Unknown',
        authorAvatarUrl: post.user.profile?.avatarUrl,
        media: post.media.map((m: any) => ({
            id: m.id,
            type: m.type as MediaType,
            url: m.url,
            mimeType: m.mimeType,
            fileSize: m.fileSize,
            width: m.width,
            height: m.height,
            duration: m.duration,
            order: m.order
        })),
        reactions: post.reactions.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            type: r.type as ReactionType,
            userDisplayName: r.user.profile?.displayName || 'Unknown',
            userAvatarUrl: r.user.profile?.avatarUrl,
            createdAt: r.createdAt.toISOString()
        })),
        comments: post.comments.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            authorDisplayName: c.user.profile?.displayName || 'Unknown',
            authorAvatarUrl: c.user.profile?.avatarUrl
        })),
        reactionCounts,
        userReaction
    };
}
