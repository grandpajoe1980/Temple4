import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canDeleteMessage } from '@/lib/permissions';
import { requireTenantAccess } from '@/lib/tenant-isolation';

// DELETE /api/messages/[messageId] - Soft delete a message
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Fetch the message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId }
            },
            tenant: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (message.conversation.tenantId) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: message.conversation.tenantId
          }
        },
        select: { status: true }
      });

      try {
        requireTenantAccess(membership, message.conversation.tenantId, userId);
      } catch (error) {
        return NextResponse.json(
          { message: 'You are not a member of this tenant' },
          { status: 403 }
        );
      }
    }

    // Check if user is a participant in the conversation
    if (message.conversation.participants.length === 0) {
      return NextResponse.json(
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get full user object for permission check
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check permissions using the existing canDeleteMessage function
    const canDelete = await canDeleteMessage(
      user,
      message,
      message.conversation,
      message.conversation.tenant!
    );

    if (!canDelete) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this message' },
        { status: 403 }
      );
    }

    // Soft delete the message
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true }
    });

    // Log if deleted by moderator (not the author)
    if (message.userId !== userId && message.conversation.tenantId) {
      await prisma.auditLog.create({
        data: {
          actorUserId: userId,
          actionType: 'DELETE_MESSAGE',
          entityType: 'ChatMessage',
          entityId: messageId,
          metadata: {
            conversationId: message.conversationId,
            tenantId: message.conversation.tenantId,
            originalAuthorId: message.userId,
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete message ${messageId}:`, error);
    return NextResponse.json({ message: 'Failed to delete message' }, { status: 500 });
  }
}
