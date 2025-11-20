import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { requireTenantAccess } from '@/lib/tenant-isolation';

const messageCreateSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
});

const markReadSchema = z.object({
  messageId: z.string().optional(),
});

// GET /api/conversations/[id]/messages - Fetch messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { tenantId: true }
    });

    if (conversation?.tenantId) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: conversation.tenantId
          }
        },
        select: { status: true }
      });

      try {
        requireTenantAccess(membership, conversation.tenantId, userId);
      } catch (error) {
        return NextResponse.json({ message: 'You are not a member of this tenant' }, { status: 403 });
      }
    }

    // First check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Fetch full conversation details (including tenant) to evaluate permissions
    const conversationDetails = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { tenant: true },
    });

    // Get current user object for permission checks
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Compute per-message canDelete flag server-side
    const messagesWithPermissions = await Promise.all(
      messages.map(async (m) => {
        let canDelete = false;
        try {
          if (user && conversationDetails && conversationDetails.tenant) {
            // Importing canDeleteMessage is acceptable on server side
            const { canDeleteMessage } = await import('@/lib/permissions');
            canDelete = await canDeleteMessage(user as any, m as any, conversationDetails as any, conversationDetails.tenant as any);
          }
        } catch (e) {
          console.warn('canDelete evaluation failed', e);
        }
        return { ...m, canDelete };
      })
    );

    // Update last read message to the latest message
    if (messagesWithPermissions.length > 0) {
      const latestMessage = messagesWithPermissions[messagesWithPermissions.length - 1];
      await prisma.conversationParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          lastReadMessageId: latestMessage.id,
        },
      });
    }

    return NextResponse.json(messagesWithPermissions);
  } catch (error) {
    console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages - Send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { tenantId: true }
    });

    if (conversation?.tenantId) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: conversation.tenantId
          }
        },
        select: { status: true }
      });

      try {
        requireTenantAccess(membership, conversation.tenantId, userId);
      } catch (error) {
        return NextResponse.json({ message: 'You are not a member of this tenant' }, { status: 403 });
      }
    }

    // Check if the user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = messageCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content } = result.data;

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        userId,
        text: content.trim(),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Update sender's last read message
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadMessageId: message.id,
      },
    });

    // Get conversation details for notification
    const conversationDetails = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: {
            userId: { not: userId }
          },
          include: {
            user: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    // Create notifications for other participants
    if (conversationDetails) {
      const notifications = conversationDetails.participants.map((p: any) => ({
        userId: p.userId,
        actorUserId: userId,
        type: 'NEW_DIRECT_MESSAGE' as const,
        message: conversationDetails.isDirectMessage 
          ? 'sent you a message'
          : `sent a message in ${conversationDetails.name || conversationDetails.tenant?.name || 'group chat'}`,
        link: `/messages/${conversationId}`,
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error(`Failed to create message in conversation ${conversationId}:`, error);
    return NextResponse.json({ message: 'Failed to create message' }, { status: 500 });
  }
}

// PATCH /api/conversations/[id]/messages - Mark messages as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { tenantId: true }
    });

    if (conversation?.tenantId) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: conversation.tenantId
          }
        },
        select: { status: true }
      });

      try {
        requireTenantAccess(membership, conversation.tenantId, userId);
      } catch (error) {
        return NextResponse.json({ message: 'You are not a member of this tenant' }, { status: 403 });
      }
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = markReadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { messageId } = result.data;

    // If messageId provided, mark up to that message; otherwise mark all
    const messageToMarkAsRead = messageId 
      ? await prisma.chatMessage.findFirst({
          where: { id: messageId, conversationId }
        })
      : await prisma.chatMessage.findFirst({
          where: { conversationId, isDeleted: false },
          orderBy: { createdAt: 'desc' }
        });

    if (messageToMarkAsRead) {
      await prisma.conversationParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          lastReadMessageId: messageToMarkAsRead.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to mark messages as read in conversation ${conversationId}:`, error);
    return NextResponse.json({ message: 'Failed to mark messages as read' }, { status: 500 });
  }
}
