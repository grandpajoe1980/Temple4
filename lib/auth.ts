import { prisma } from './db';
import { User } from '@prisma/client';
import { ActionType } from '@/types';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from './audit';
import { sendWelcomeEmail } from './email-helpers';

const defaultNotificationPreferences = {
  email: {
    newAnnouncement: true,
    newEvent: true,
    directMessage: true,
    groupChatMessage: false,
    membershipUpdate: true,
  },
};

const defaultAccountSettings = {
    timezonePreference: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    languagePreference: 'en-US',
};

export async function registerUser(displayName: string, email: string, pass: string): Promise<{ success: boolean; message?: string; user?: Omit<User, 'password'> }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const hashedPassword = await bcrypt.hash(pass, 10);

  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      isSuperAdmin: false,
      profile: {
        create: {
          displayName,
          avatarUrl: `https://i.pravatar.cc/48?u=user-${Date.now()}`,
          bio: '',
          locationCity: '',
          locationCountry: '',
          languages: '', // Storing as a comma-separated string
        },
      },
      privacySettings: {
        create: {
          showAffiliations: true,
        },
      },
      accountSettings: {
        create: {
            ...defaultAccountSettings
        }
      },
      notificationPreferences: defaultNotificationPreferences,
    },
    include: {
        profile: true,
        privacySettings: true,
        accountSettings: true,
    }
  });

  await logAuditEvent({
    actorUserId: newUser.id,
    actionType: ActionType.USER_REGISTERED,
    entityType: 'USER',
    entityId: newUser.id,
  });

  // Send welcome email (async, don't block registration)
  sendWelcomeEmail({
    user: {
      displayName: newUser.profile!.displayName,
      email: newUser.email,
    },
    loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`,
  }).catch(error => {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email failure shouldn't block registration
  });

  // We need to be careful about what we return. The password should not be returned.
  const { password, ...userWithoutPassword } = newUser;

  return { success: true, user: userWithoutPassword };
}
