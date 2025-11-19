"use client"

import React, { useState, useMemo, useEffect } from 'react';
import type { User } from '@/types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface NewMessageModalProps {
  currentUser: User;
  onClose: () => void;
  onStartConversation: (recipientId: string) => void;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({ currentUser, onClose, onStartConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allOtherUsers, setAllOtherUsers] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Fetch users via API
    setAllOtherUsers([]);
  }, [currentUser.id]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allOtherUsers;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return allOtherUsers.filter(
      u =>
        // FIX: Access displayName from the nested profile object.
        u.profile.displayName.toLowerCase().includes(lowercasedTerm) ||
        u.email.toLowerCase().includes(lowercasedTerm)
    );
  }, [allOtherUsers, searchTerm]);

  return (
    <div className="flex flex-col" style={{ minHeight: '50vh' }}>
      <Input
        label=""
        id="user-search"
        type="search"
        placeholder="Search for a user by name or email..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      <div className="flex-1 mt-4 -mx-6 px-2 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <li
                key={user.id}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => onStartConversation(user.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* FIX: Access avatarUrl and displayName from the nested profile object. */}
                  <img src={user.profile.avatarUrl || '/placeholder-avatar.svg'} alt={user.profile.displayName} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-800">{user.profile.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-sm text-gray-500">
              No users found matching your search.
            </li>
          )}
        </ul>
      </div>

      <div className="pt-4 border-t border-gray-200 text-right">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default NewMessageModal;
