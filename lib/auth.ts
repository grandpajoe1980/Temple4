import { prisma } from './db';
import { User } from '@/types';
import bcrypt from 'bcryptjs';

// This is a placeholder for the real audit log function
const logAuditEvent = async (event: any) => {
    console.log('Audit Event Logged:', event);
    // In a real implementation, this would write to the AuditLog table
};

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

export async function registerUser(displayName: string, email: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> {
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
    actionType: 'USER_REGISTERED', // This should be part of an enum
    entityType: 'USER',
    entityId: newUser.id,
  });

  // We need to be careful about what we return. The password should not be returned.
  const { password, ...userWithoutPassword } = newUser;

  return { success: true, user: userWithoutPassword as any }; // TODO: Type mismatch - see Ticket #0002
}
