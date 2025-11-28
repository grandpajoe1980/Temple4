"use client"

import React, { useState } from 'react';
import EditUserProfileModal from '../../../app/components/tenant/tabs/EditUserProfileModal';

export default function TestOpenEditUserProfile() {
  const [open, setOpen] = useState(true);
  const placeholderMember = {
    id: 'test-member',
    profile: { displayName: 'Test Member', avatarUrl: '/placeholder-avatar.svg' },
    email: 'test@example.com',
    membership: { roles: [] }
  } as any;

  return (
    <div>
      {/* Test-only page to open EditUserProfileModal for Playwright/QA */}
      <EditUserProfileModal isOpen={open} onClose={() => setOpen(false)} member={placeholderMember} adminUser={{} as any} onSave={() => setOpen(false)} />
      <div className="p-8">
        <h1 className="text-xl font-bold">Test: Open EditUserProfileModal</h1>
        <p className="text-sm text-gray-500">This page exists for automated tests only.</p>
      </div>
    </div>
  );
}
