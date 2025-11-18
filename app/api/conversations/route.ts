import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/conversations - List conversations for current user with unread counts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any).id;

  try {
    // Fetch conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
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
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation: any) => {
        const userParticipant = conversation.participants.find((p: any) => p.userId === userId);
        
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
  
  const userId = (session.user as any).id;

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

    // Ensure creator is included in participants
    const allParticipantIds = Array.from(new Set([userId, ...participantIds]));

    // If tenantId provided, verify user is a member
    if (tenantId) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId
          }
        }
      });

      if (!membership || membership.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'You must be an approved member of this tenant to create a conversation' },
          { status: 403 }
        );
      }
    }

    // Create conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        tenantId,
        name,
        isDirectMessage: allParticipantIds.length === 2 && !name,
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
