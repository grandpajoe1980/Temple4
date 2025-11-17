import React, { useState, useEffect } from 'react';
import type { EnrichedMember, UserTenantRole } from '../../../types';
import { TenantRole } from '../../../types';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

interface EditRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: EnrichedMember;
  onSubmit: (member: EnrichedMember, roles: UserTenantRole[]) => void;
}

const allRoles = Object.values(TenantRole);

const EditRolesModal: React.FC<EditRolesModalProps> = ({ isOpen, onClose, member, onSubmit }) => {
  const [selectedRoles, setSelectedRoles] = useState<Set<TenantRole>>(() => new Set());
  const [primaryRole, setPrimaryRole] = useState<TenantRole>(TenantRole.MEMBER);
  const [displayTitle, setDisplayTitle] = useState('');

  useEffect(() => {
    if (member) {
      const currentRoles = new Set(member.membership.roles.map(r => r.role));
      const currentPrimary = member.membership.roles.find(r => r.isPrimary)?.role || TenantRole.MEMBER;
      const currentTitle = member.membership.roles.find(r => r.displayTitle)?.displayTitle || '';
      
      setSelectedRoles(currentRoles);
      setPrimaryRole(currentPrimary);
      setDisplayTitle(currentTitle);
    }
  }, [member]);

  const handleRoleToggle = (role: TenantRole) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  // If the primary role is deselected, reset the primary role to the first available selected role.
  useEffect(() => {
    if (!selectedRoles.has(primaryRole)) {
      setPrimaryRole(selectedRoles.size > 0 ? selectedRoles.values().next().value : TenantRole.MEMBER);
    }
  }, [selectedRoles, primaryRole]);


  const handleSubmit = () => {
    if (selectedRoles.size === 0) {
      alert('A member must have at least one role.');
      return;
    }

    const newRoles: UserTenantRole[] = Array.from(selectedRoles).map(role => ({
      id: member.membership.roles.find(r => r.role === role)?.id || `tr-${Date.now()}-${role}`,
      role: role,
      isPrimary: role === primaryRole,
      displayTitle: role === primaryRole ? displayTitle : undefined,
    }));
    
    onSubmit(member, newRoles);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Roles for ${member.profile.displayName}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Assigned Roles</h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {allRoles.map(role => (
              <label key={role} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  checked={selectedRoles.has(role)}
                  onChange={() => handleRoleToggle(role)}
                />
                <span className="text-sm text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedRoles.size > 0 && (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Primary Role</h3>
              <p className="text-xs text-gray-500">This role determines their main title and sorting order.</p>
              <div className="mt-2 space-y-2">
                {Array.from(selectedRoles).map(role => (
                  <label key={`primary-${role}`} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      name="primary-role"
                      className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                      checked={primaryRole === role}
                      onChange={() => setPrimaryRole(role)}
                    />
                    <span className="text-sm text-gray-700">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            
             <Input
                label="Display Title"
                id="displayTitle"
                name="displayTitle"
                value={displayTitle}
                onChange={(e) => setDisplayTitle(e.target.value)}
                placeholder="e.g., Lead Pastor, Senior Student"
                containerClassName="pt-2"
              />
          </>
        )}

        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRolesModal;