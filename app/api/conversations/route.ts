import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type ConversationWithUnread =
  Prisma.ConversationGetPayload<{
    include: {
      participants: {
        include: {
          user: { include: { profile: true } };
          lastReadMessage: true;
        };
      };
      messages: {
        where: { isDeleted: boolean };
        orderBy: { createdAt: 'desc' };
        take: number;
        include: { user: { include: { profile: true } } };
      };
      tenant: { select: { id: true; name: true } };
    };
  }> & { unreadCount?: number };

// GET /api/conversations - List conversations for current user with unread counts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check for scope filter (GLOBAL or TENANT)
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get('scope') as 'GLOBAL' | 'TENANT' | null;

  try {
    // Fetch approved tenant memberships for the current user to enforce isolation on tenant conversations
    const memberTenants = await prisma.userTenantMembership.findMany({
      where: {
        userId,
        status: 'APPROVED'
      },
      select: { tenantId: true }
    });

    const memberTenantIds = memberTenants.map(membership => membership.tenantId);

    // Build a tenant-aware filter so users only see conversations in tenants they belong to
    const tenantFilter = memberTenantIds.length > 0
      ? {
        OR: [
          { tenantId: null },
          { tenantId: { in: memberTenantIds } }
        ]
      }
      : { tenantId: null };

    // Fetch conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        },
        ...tenantFilter,
        // Apply scope filter if provided
        ...(scopeParam && { scope: scopeParam })
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            lastReadMessage: true,
          }
        },
        messages: {
          where: {
            isDeleted: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Calculate unread counts for each conversation
    const conversationsWithUnread: ConversationWithUnread[] = await Promise.all(
      conversations.map(async (conversation) => {
        const userParticipant = conversation.participants.find((p) => p.userId === userId);

        if (!userParticipant) {
          return { ...conversation, unreadCount: 0 };
        }

        // Count messages after the last read message
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conversation.id,
            isDeleted: false,
            userId: { not: userId }, // Don't count own messages
            ...(userParticipant.lastReadMessageId && {
              createdAt: {
                gt: userParticipant.lastReadMessage?.createdAt || new Date(0)
              }
            })
          }
        });

        return {
          ...conversation,
          unreadCount
        };
      })
    );

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

const createConversationSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
});

// POST /api/conversations - Create a tenant channel or multi-user conversation
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const result = createConversationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tenantId, name, participantIds } = result.data;

    // If tenantId provided, ensure creator is an approved member and
    // auto-add all APPROVED tenant members as participants for a channel.
    let allParticipantIds: string[] = [];

    if (tenantId) {
      try {
        // Use shared helper to create channel and add all approved tenant members
        const conv = await (await import('@/lib/data')).createChannelWithAllMembers(tenantId, userId, { name });
        if (!conv) throw new Error('Failed to create channel');
        return NextResponse.json(conv, { status: 201 });
      } catch (err: any) {
        console.error('Failed to create tenant channel:', err?.message || err);
        return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
      }
    }

    // Non-tenant conversation: use provided participant ids + creator
    allParticipantIds = Array.from(new Set([userId, ...(participantIds || [])]));

    // Create conversation with participants
    const kind = allParticipantIds.length === 2 && !name ? 'DM' : 'GROUP';

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: null,
        name,
        isDirectMessage: kind === 'DM',
        scope: 'GLOBAL',
        kind: kind,
        participants: {
          create: allParticipantIds.map(participantId => ({
            userId: participantId
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
