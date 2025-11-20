"use client"

import React, { useState, useEffect } from 'react';
import type { User, UserTenantMembership, Tenant } from '@/types';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  enrichedMembership: {
    membership: UserTenantMembership;
    tenant: Tenant;
  };
  onSave: () => void;
}

const EditMembershipModal: React.FC<EditMembershipModalProps> = ({ isOpen, onClose, user, enrichedMembership, onSave }) => {
  const { membership, tenant } = enrichedMembership;
  
  const [displayName, setDisplayName] = useState(membership.displayName || '');
  const [displayTitle, setDisplayTitle] = useState('');

  useEffect(() => {
    if (membership) {
      setDisplayName(membership.displayName || '');
      const primaryRole = membership.roles.find((r: any) => r.isPrimary) || membership.roles[0];
      setDisplayTitle(primaryRole?.displayTitle || '');
    }
  }, [membership]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/members/${user.id}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName }),
        });
        if (!res.ok) throw new Error('Failed to update membership');
        onSave();
        alert('Membership profile updated!');
      } catch (err) {
        console.error(err);
        alert('Failed to update membership profile');
      }
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editing Profile for ${tenant.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Display Name in this Tenant" 
          id="displayName" 
          name="displayName" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={user.profile?.displayName ?? ''}
        />
        <p className="text-xs text-gray-500 -mt-4 ml-1">Leave blank to use your global name: “{user.profile?.displayName ?? ''}”</p>
        
        <Input 
          label="Display Title" 
          id="displayTitle" 
          name="displayTitle" 
          value={displayTitle} 
          onChange={(e) => setDisplayTitle(e.target.value)}
          placeholder="e.g., Brother, Sister, Volunteer"
        />
         <p className="text-xs text-gray-500 -mt-4 ml-1">This title appears next to your name within this tenant.</p>
        
        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMembershipModal;