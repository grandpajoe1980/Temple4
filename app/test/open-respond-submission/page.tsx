"use client"

import React, { useState } from 'react';
import RespondSubmissionModal from '../../../app/components/tenant/forms/RespondSubmissionModal';

export default function TestOpenRespondSubmission() {
  const [open, setOpen] = useState(true);
  const submission = { id: 's1', name: 'Submitter', email: 'submit@example.com', message: 'Please pray for testing.' } as any;

  return (
    <div>
      <RespondSubmissionModal isOpen={open} onClose={() => setOpen(false)} onSubmit={() => setOpen(false)} submission={submission} />
      <div className="p-8">
        <h1 className="text-xl font-bold">Test: Open RespondSubmissionModal</h1>
        <p className="text-sm text-gray-500">This page exists for automated tests only.</p>
      </div>
    </div>
  );
}
