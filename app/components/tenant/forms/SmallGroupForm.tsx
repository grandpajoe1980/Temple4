"use client"

import React, { useState } from 'react';
import type { EnrichedMember } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface SmallGroupFormProps {
  onSubmit: (data: { name: string; description: string; leaderUserId: string; meetingSchedule: string; isActive: boolean; isHidden?: boolean }) => void;
  onCancel: () => void;
  members: EnrichedMember[];
  // optional initial values for edit
  initial?: { id?: string; name?: string; description?: string; leaderUserId?: string; meetingSchedule?: string; isActive?: boolean; isHidden?: boolean };
  isEdit?: boolean;
  onDelete?: () => void;
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ onSubmit, onCancel, members, initial, isEdit, onDelete }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [leaderUserId, setLeaderUserId] = useState(initial?.leaderUserId ?? members[0]?.id ?? '');
  const [meetingSchedule, setMeetingSchedule] = useState(initial?.meetingSchedule ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isHidden, setIsHidden] = useState(initial?.isHidden ?? false);

  React.useEffect(() => {
    // keep local state in sync if initial changes (when opening edit modal)
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setLeaderUserId(initial?.leaderUserId ?? members[0]?.id ?? '');
    setMeetingSchedule(initial?.meetingSchedule ?? '');
    setIsActive(initial?.isActive ?? true);
    setIsHidden(initial?.isHidden ?? false);
  }, [initial, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leaderUserId || !meetingSchedule) {
      alert('Please fill out all required fields.');
      return;
    }
    onSubmit({ name, description, leaderUserId, meetingSchedule, isActive, isHidden });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Group Name"
        id="name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="leaderUserId" className="block text-sm font-medium text-gray-700 mb-1">
          Group Leader
        </label>
        <select
          id="leaderUserId"
          name="leaderUserId"
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
          value={leaderUserId}
          onChange={(e) => setLeaderUserId(e.target.value)}
          required
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>{member.profile?.displayName ?? ''}</option>
          ))}
        </select>
      </div>
      <Input
        label="Meeting Schedule"
        id="meetingSchedule"
        name="meetingSchedule"
        value={meetingSchedule}
        onChange={(e) => setMeetingSchedule(e.target.value)}
        placeholder="e.g., Tuesdays at 7 PM"
        required
      />
      <ToggleSwitch
        label="Group is Active"
        description="Inactive groups are hidden from the main discovery page."
        enabled={isActive}
        onChange={setIsActive}
      />
      <ToggleSwitch
        label="Group is Hidden"
        description="Hidden groups are not shown in public discovery; members and admins can still access them."
        enabled={isHidden}
        onChange={setIsHidden}
      />
      <div className="flex justify-between items-center space-x-4 pt-4 border-t border-gray-200">
        <div>
          {isEdit && onDelete && (
            <Button type="button" variant="danger" onClick={async () => {
              if (!confirm('Delete this group? This cannot be undone.')) return;
              await onDelete();
            }}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Save Changes' : 'Create Group'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SmallGroupForm;
