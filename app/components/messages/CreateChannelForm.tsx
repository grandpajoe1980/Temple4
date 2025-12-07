"use client"

import React, { useState, useMemo, useEffect } from 'react';
import type { Tenant, User } from '@/types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface CreateChannelFormProps {
  tenant: Tenant;
  currentUser: User;
  // Include scope/kind so the client sends explicit semantics for creation
  onSubmit: (data: { name: string; isPrivate: boolean; participantIds: string[]; scope?: 'TENANT' | 'GLOBAL'; kind?: 'CHANNEL' | 'GROUP' | 'DM' }) => void;
  onCancel: () => void;
}

const CreateChannelForm: React.FC<CreateChannelFormProps> = ({ tenant, currentUser, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(() => new Set([currentUser.id]));
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenant.id}/members`);
        if (!response.ok) {
          setMembers([]);
          return;
        }

        const data = await response.json();
        const normalizedMembers = (data.members || []).map((member: any) => {
          // The API sometimes returns members as { user: { ... } }
          // and sometimes as the user object directly (server-side helpers).
          const user = member?.user ?? member;
          return {
            id: user?.id,
            profile: user?.profile || {},
          };
        });

        setMembers(normalizedMembers);
        setSelectedParticipants((prev) => {
          const next = new Set(prev);
          next.add(currentUser.id);
          return next;
        });
      } catch (error) {
        console.error('Failed to load members for channel creation', error);
        setMembers([]);
      }
    };

    fetchMembers();
  }, [tenant.id, currentUser.id]);

  const handleParticipantToggle = (userId: string) => {
    if (userId === currentUser.id) return; // Current user cannot be deselected
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    const q = searchTerm.toLowerCase();
    return members.filter(m => (m.profile?.displayName || '').toLowerCase().includes(q));
  }, [members, searchTerm]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a channel name.');
      return;
    }
    onSubmit({
      name: name.trim(),
      isPrivate,
      participantIds: Array.from(selectedParticipants),
      // When creating from within a tenant view, this is a tenant-scoped channel
      scope: tenant?.id ? 'TENANT' : 'GLOBAL',
      kind: 'CHANNEL',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Channel Name"
        id="channel-name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="# announcements"
      />
      
      <ToggleSwitch
        label="Private Channel"
        description="If enabled, only selected members can see and join this channel."
        enabled={isPrivate}
        onChange={setIsPrivate}
      />

      {isPrivate && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Select Members</h3>
          <Input
            label=""
            id="member-search"
            placeholder="Search members to add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
            {filteredMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {/* FIX: Access avatarUrl and displayName from the nested profile object. */}
                  <img src={member.profile?.avatarUrl || '/placeholder-avatar.svg'} alt={member.profile?.displayName} className="w-8 h-8 rounded-full" />
                  <span className="text-sm text-gray-800">{member.profile?.displayName}</span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-[color:var(--primary)] border-gray-300 rounded focus:ring-[color:var(--primary)]"
                  checked={selectedParticipants.has(member.id)}
                  onChange={() => handleParticipantToggle(member.id)}
                  disabled={member.id === currentUser.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Channel
        </Button>
      </div>
    </form>
  );
};

export default CreateChannelForm;
