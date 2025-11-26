"use client"

import React from 'react';
import Subheader from '@/app/components/ui/Subheader';

export default function CommunityHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  // Keep the same defaults as before but delegate markup to the shared Subheader component.
  return (
    <Subheader
      title={title}
      subtitle={subtitle}
      actions={actions}
      height="3.5rem"
      ariaLabel="Community subheader"
      className="z-20"
    />
  );
}
