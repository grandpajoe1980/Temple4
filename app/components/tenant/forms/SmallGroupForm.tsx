import React, { useState } from 'react';
import type { EnrichedMember } from '../../../types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface SmallGroupFormProps {
  onSubmit: (data: { name: string; description: string; leaderUserId: string; meetingSchedule: string; isActive: boolean }) => void;
  onCancel: () => void;
  members: EnrichedMember[];
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ onSubmit, onCancel, members }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderUserId, setLeaderUserId] = useState(members[0]?.id || '');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leaderUserId || !meetingSchedule) {
      alert('Please fill out all required fields.');
      return;
    }
    onSubmit({ name, description, leaderUserId, meetingSchedule, isActive });
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
            <option key={member.id} value={member.id}>{member.profile.displayName}</option>
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
      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Group
        </Button>
      </div>
    </form>
  );
};

export default SmallGroupForm;
