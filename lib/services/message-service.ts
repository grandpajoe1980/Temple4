import { prisma } from '@/lib/db';
import { assertApprovedMember } from '@/lib/tenant-isolation';
import NotificationService from '@/lib/services/notification-service';
import { canDeleteMessage } from '@/lib/permissions';

export async function getMessagesForConversation(actorUserId: string, conversationId: string) {
  if (!actorUserId) throw new Error('unauthorized');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
      tenant: { select: { id: true } }
    }
  });

  if (!conversation) throw new Error('not_found');

  if (conversation.scope === 'TENANT' && conversation.tenant) {
    await assertApprovedMember(actorUserId, conversation.tenant.id);
  }

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: actorUserId }
  });

  if (!participant) throw new Error('forbidden_not_participant');

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId, isDeleted: false },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: 'asc' }
  });

  // Compute per-message canDelete flag conservatively
  const user = await prisma.user.findUnique({ where: { id: actorUserId } });

  const messagesWithPermissions = await Promise.all(messages.map(async (m) => {
    let canDelete = false;
    try {
      if (user) canDelete = await canDeleteMessage(user, m as any, conversation as any, conversation.tenant as any);
    } catch (e) {
      // best-effort
    }
    return { ...m, canDelete };
  }));

  return messagesWithPermissions;
}

export async function addMessage(actorUserId: string, conversationId: string, content: string) {
  if (!actorUserId) throw new Error('unauthorized');
  if (!content || !content.trim()) throw new Error('validation:content');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true, tenant: { select: { id: true, name: true } } }
  });

  if (!conversation) throw new Error('not_found');

  if (conversation.scope === 'TENANT' && conversation.tenant) {
    await assertApprovedMember(actorUserId, conversation.tenant.id);
  }

  const participant = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId: actorUserId } });
  if (!participant) throw new Error('forbidden_not_participant');

  const message = await prisma.chatMessage.create({
    data: { conversationId, userId: actorUserId, text: content.trim() },
    include: { user: { include: { profile: true } } }
  });

  // Update sender's last read pointer
  await prisma.conversationParticipant.update({ where: { id: participant.id }, data: { lastReadMessageId: message.id } });

  // Notify other participants
  const conversationDetails = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { where: { userId: { not: actorUserId } }, include: { user: true } }, tenant: { select: { id: true, name: true } } }
  });

  if (conversationDetails && conversationDetails.participants.length > 0) {
    const notifications = conversationDetails.participants.map((p: any) => ({
      userId: p.userId,
      actorUserId: actorUserId,
      type: 'NEW_DIRECT_MESSAGE' as const,
      message: conversationDetails.kind === 'DM' ? 'sent you a message' : `sent a message in ${conversationDetails.name || conversationDetails.tenant?.name || 'group chat'}`,
      link: `/messages/${conversationId}`
    }));

    // If we have an actor and this is tenant-scoped, use NotificationService to enqueue tenant-scoped outbox notifications
    // This enforces membership validation via assertApprovedMember and centralizes outbox writes.
    const tenantIdForNotif = conversationDetails.tenant ? conversationDetails.tenant.id : undefined;

    if (actorUserId) {
      // Enqueue via NotificationService (best-effort)
      await Promise.all(
        notifications.map((n) =>
          NotificationService.enqueueNotification({
            tenantId: tenantIdForNotif,
            actorUserId: n.actorUserId,
            to: n.userId,
            type: n.type,
            subject: 'New message',
            html: `<p>${n.message}</p>`,
            text: n.message,
          }).catch(() => {})
        )
      );
    } else {
      // Fallback: create in-app notifications directly when there's no actor (legacy/anonymous flows)
      await prisma.notification.createMany({ data: notifications });
    }
  }

  return message;
}

export async function deleteMessage(actorUserId: string, messageId: string) {
  if (!actorUserId) throw new Error('unauthorized');

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId }, include: { conversation: { include: { participants: true, tenant: true } } } });
  if (!message) throw new Error('not_found');

  const conv = message.conversation;
  if (conv.scope === 'TENANT' && conv.tenant) {
    await assertApprovedMember(actorUserId, conv.tenant.id);
  }

  const isParticipant = conv.participants.some((p: any) => p.userId === actorUserId);
  if (!isParticipant) throw new Error('forbidden_not_participant');

  const user = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (!user) throw new Error('not_found_user');

  const canDelete = await canDeleteMessage(user, message as any, conv as any, conv.tenant as any);
  if (!canDelete) throw new Error('forbidden_not_permitted');

  await prisma.chatMessage.update({ where: { id: messageId }, data: { isDeleted: true } });

  if (message.userId !== actorUserId && conv.tenantId) {
    await prisma.auditLog.create({ data: { actorUserId: actorUserId, actionType: 'DELETE_MESSAGE', entityType: 'ChatMessage', entityId: messageId, metadata: { conversationId: conv.id, tenantId: conv.tenantId, originalAuthorId: message.userId } } });
  }

  return { success: true };
}

const MessageService = { getMessagesForConversation, addMessage, deleteMessage };
export default MessageService;
