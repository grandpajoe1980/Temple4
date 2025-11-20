import type { Prisma } from '@prisma/client';
import type { EnrichedChatMessage, EnrichedConversation, NotificationPreferences, User } from '@/types';

export type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          include: {
            profile: true;
          };
        };
      };
    };
    messages: {
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
      include: {
        user: {
          include: {
            profile: true;
          };
        };
      };
    };
  };
}>;

export type MessageWithUser = Prisma.ChatMessageGetPayload<{
  include: {
    user: {
      include: {
        profile: true;
      };
    };
  };
}>;

export type MessagesPageUser = Prisma.UserGetPayload<{
  include: {
    profile: true;
    privacySettings: true;
    accountSettings: true;
  };
}>;

const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    newAnnouncement: true,
    newEvent: true,
    directMessage: true,
    groupChatMessage: true,
    membershipUpdate: true,
  },
};

const baseUserDefaults = {
  privacySettings: { showAffiliations: true },
  accountSettings: {},
  notificationPreferences: defaultNotificationPreferences,
} satisfies Pick<User, 'privacySettings' | 'accountSettings' | 'notificationPreferences'>;

export function mapUserForMessaging(user: MessagesPageUser): User {
  const notificationPreferences =
    (user.notificationPreferences as NotificationPreferences | null | undefined) ?? defaultNotificationPreferences;

  return {
    id: user.id,
    email: user.email,
    password: user.password ?? '',
    isSuperAdmin: user.isSuperAdmin ?? false,
    profile: {
      displayName: user.profile?.displayName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? undefined,
      bio: user.profile?.bio ?? undefined,
      locationCity: user.profile?.locationCity ?? undefined,
      locationCountry: user.profile?.locationCountry ?? undefined,
      languages: user.profile?.languages ?? [],
    },
    privacySettings: user.privacySettings ?? baseUserDefaults.privacySettings,
    accountSettings: user.accountSettings ?? baseUserDefaults.accountSettings,
    notificationPreferences,
  };
}

export function normalizeMessage(rawMessage: MessageWithUser): EnrichedChatMessage {
  const user = rawMessage.user;

  return {
    ...rawMessage,
    userDisplayName: user?.profile?.displayName || user?.email || 'Unknown user',
    userAvatarUrl: user?.profile?.avatarUrl || undefined,
    createdAt: new Date(rawMessage.createdAt),
  };
}

export function normalizeConversation(
  conversation: ConversationWithRelations,
  currentUserId: string
): EnrichedConversation {
  const participants: User[] = conversation.participants.map((participant) => {
    const participantUser = participant.user;

    return {
      id: participantUser.id,
      email: participantUser.email,
      password: participantUser.password ?? '',
      isSuperAdmin: participantUser.isSuperAdmin ?? false,
      profile: {
        displayName: participantUser.profile?.displayName ?? participantUser.email,
        avatarUrl: participantUser.profile?.avatarUrl ?? undefined,
        bio: participantUser.profile?.bio ?? undefined,
        locationCity: participantUser.profile?.locationCity ?? undefined,
        locationCountry: participantUser.profile?.locationCountry ?? undefined,
        languages: participantUser.profile?.languages ?? [],
      },
      privacySettings: participantUser.privacySettings ?? baseUserDefaults.privacySettings,
      accountSettings: participantUser.accountSettings ?? baseUserDefaults.accountSettings,
      notificationPreferences:
        (participantUser.notificationPreferences as NotificationPreferences | null | undefined) ??
        baseUserDefaults.notificationPreferences,
    };
  });

  const isDirect =
    conversation.isDirectMessage || (!conversation.name && participants.length <= 2 && conversation.tenantId !== null);
  const otherParticipant = isDirect ? participants.find((participant) => participant.id !== currentUserId) : null;

  const lastMessageRaw = conversation.messages?.[0];
  const lastMessage = lastMessageRaw ? normalizeMessage(lastMessageRaw) : undefined;

  return {
    ...conversation,
    isDirect,
    participants,
    displayName:
      conversation.displayName ||
      conversation.name ||
      (isDirect && otherParticipant
        ? otherParticipant.profile?.displayName || otherParticipant.email || 'Direct Message'
        : 'Group Conversation'),
    lastMessage,
    unreadCount: conversation.unreadCount ?? 0,
  };
}
