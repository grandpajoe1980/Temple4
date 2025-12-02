import { MembershipStatus, OnboardingStatus } from '@/types';
import { TenantSettings as PrismaTenantSettings } from '@prisma/client';

type OnboardingInputs = {
  status: MembershipStatus;
  settings?: PrismaTenantSettings | null;
};

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === 'string');
      }
    } catch {
      // Ignore parse errors and fall back to empty
    }
  }

  return [];
}

export function deriveOnboardingFields({ status, settings }: OnboardingInputs) {
  const welcomePacketUrl = settings?.welcomePacketUrl ?? null;
  const welcomePacketVersion = welcomePacketUrl
    ? settings?.welcomePacketVersion ?? 1
    : null;
  const alertChannels = toStringArray(settings?.newMemberAlertChannels);

  const onboardingStatus =
    status === MembershipStatus.APPROVED && welcomePacketUrl
      ? OnboardingStatus.PACKET_QUEUED
      : OnboardingStatus.PENDING;

  const alertSentAt =
    status === MembershipStatus.APPROVED && alertChannels.length > 0
      ? new Date()
      : null;

  return {
    welcomePacketUrl,
    welcomePacketVersion,
    onboardingStatus,
    alertSentAt,
    alertChannels,
  };
}
