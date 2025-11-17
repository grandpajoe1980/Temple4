import React, { useMemo } from 'react';
// FIX: Changed 'import type' for TenantRole to a value import.
import { TenantRole, type EnrichedConversation, type Tenant, type User, type UserTenantMembership } from '../../types';
import { getMembershipForUserInTenant } from '../../seed-data';

interface ConversationDetailsPanelProps {
  conversation: EnrichedConversation;
  tenant: Tenant;
  onViewProfile: (userId: string) => void;
}

interface EnrichedParticipant extends User {
  roles: TenantRole[];
  membership: UserTenantMembership;
}

const ConversationDetailsPanel: React.FC<ConversationDetailsPanelProps> = ({ conversation, tenant, onViewProfile }) => {
  const enrichedParticipants = useMemo((): EnrichedParticipant[] => {
    return conversation.participants.map(p => {
        const membership = getMembershipForUserInTenant(p.id, tenant.id);
        if (!membership) return null; // Should not happen for channel members
        return {
            ...p,
            roles: membership.roles.map(r => r.role),
            membership,
        }
    }).filter((p): p is EnrichedParticipant => p !== null)
    .sort((a,b) => {
        const roleOrder = { [TenantRole.ADMIN]: 0, [TenantRole.STAFF]: 1, [TenantRole.CLERGY]: 1, [TenantRole.MODERATOR]: 2, [TenantRole.MEMBER]: 3 };
        const aRole = a.roles[0] || TenantRole.MEMBER;
        const bRole = b.roles[0] || TenantRole.MEMBER;
        if (roleOrder[aRole] < roleOrder[bRole]) return -1;
        if (roleOrder[aRole] > roleOrder[bRole]) return 1;
        return a.profile.displayName.localeCompare(b.profile.displayName);
    });
  }, [conversation.participants, tenant.id]);

  const roleColors: { [key: string]: string } = {
    ADMIN: 'bg-red-100 text-red-800',
    STAFF: 'bg-sky-100 text-sky-800',
    CLERGY: 'bg-emerald-100 text-emerald-800',
    MODERATOR: 'bg-indigo-100 text-indigo-800',
    MEMBER: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg text-gray-900">{conversation.displayName}</h3>
        {conversation.description && (
          <p className="text-sm text-gray-500 mt-1">{conversation.description}</p>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-bold uppercase text-gray-500">
            Members &mdash; {enrichedParticipants.length}
          </h4>
        </div>
        <ul>
          {enrichedParticipants.map(participant => (
            <li 
              key={participant.id} 
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => onViewProfile(participant.id)}
            >
              <div className="flex items-center space-x-3">
                <img src={participant.profile.avatarUrl} alt={participant.profile.displayName} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{participant.membership.displayName || participant.profile.displayName}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {participant.roles.map(role => (
                       <span key={role} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
                         {role}
                       </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ConversationDetailsPanel;