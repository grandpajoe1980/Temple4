import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import NotificationService from '@/lib/services/notification-service';
import { z } from 'zod';
import { requireTenantAccess, assertApprovedMember } from '@/lib/tenant-isolation';
import MessageService from '@/lib/services/message-service';

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
      select: { tenantId: true, scope: true, kind: true }
    });

    if (conversation?.scope === 'TENANT') {
      const tenantId = conversation.tenantId!;
      try {
        await assertApprovedMember(userId, tenantId);
      } catch (err) {
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

    // Delegate to MessageService to fetch messages with proper validation
    try {
      const messagesWithPermissions = await MessageService.getMessagesForConversation(userId, conversationId);
      return NextResponse.json(messagesWithPermissions);
    } catch (err: any) {
      if (String(err.message).startsWith('forbidden')) return NextResponse.json({ message: 'You are not a participant in this conversation' }, { status: 403 });
      if (String(err.message) === 'not_found') return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
      console.error(`Failed to fetch messages for conversation ${conversationId}:`, err);
      return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
    }
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
      select: { tenantId: true, scope: true, kind: true }
    });

    if (conversation?.scope === 'TENANT') {
      const tenantId = conversation.tenantId!;
      try {
        await assertApprovedMember(userId, tenantId);
      } catch (err) {
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
    try {
      const message = await MessageService.addMessage(userId, conversationId, content);
      return NextResponse.json(message, { status: 201 });
    } catch (err: any) {
      if (String(err.message).startsWith('forbidden')) return NextResponse.json({ message: 'You are not a participant or member' }, { status: 403 });
      if (String(err.message) === 'not_found') return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
      if (String(err.message).startsWith('validation')) return NextResponse.json({ error: 'Invalid input' , details: { content: ['Invalid content'] } }, { status: 400 });
      console.error(`Failed to create message in conversation ${conversationId}:`, err);
      return NextResponse.json({ message: 'Failed to create message' }, { status: 500 });
    }
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
      const tenantId = conversation.tenantId;
      try {
        await assertApprovedMember(userId, tenantId as string);
      } catch (err) {
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
