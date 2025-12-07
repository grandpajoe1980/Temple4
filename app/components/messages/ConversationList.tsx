"use client"

import React, { useMemo } from 'react';
import type { EnrichedConversation, User } from '@/types';
import Input from '../ui/Input';

interface ConversationListProps {
  conversations: EnrichedConversation[];
  currentUser: User;
  activeConversationId?: string | null;
  onConversationSelect: (conversation: EnrichedConversation) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUser,
  activeConversationId,
  onConversationSelect,
  searchTerm,
  onSearchChange,
}) => {
  const getOtherParticipant = (conv: EnrichedConversation) => {
    return conv.participants.find((p) => p.id !== currentUser.id);
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const lowercasedTerm = searchTerm.toLowerCase();
    return conversations.filter((c) => c.displayName.toLowerCase().includes(lowercasedTerm));
  }, [conversations, searchTerm]);

  return (
    <div className="flex-1 flex flex-col">
      {onSearchChange && searchTerm !== undefined && (
        <div className="p-4 border-b border-gray-200">
          <Input
            label=""
            id="conversation-search"
            type="search"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {filteredConversations.map((conv) => {
            const otherParticipant = conv.isDirect ? getOtherParticipant(conv) : null;
            const isActive = conv.id === activeConversationId;
            const lastMessageText = conv.lastMessage
              ? `${conv.lastMessage.userId === currentUser.id ? 'You: ' : ''}${conv.lastMessage.text}`
              : 'No messages yet';

            return (
              <li
                key={conv.id}
                onClick={() => onConversationSelect(conv)}
                className={`p-4 cursor-pointer transition-colors ${
                  isActive ? 'tenant-bg-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {(conv.kind === 'DM' || conv.isDirect) && otherParticipant ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={otherParticipant.profile?.avatarUrl || '/placeholder-avatar.svg'}
                        alt={otherParticipant.profile?.displayName ?? ''}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-bold">#</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conv.displayName}
                      </p>
                      {conv.lastMessage && (
                        <div className="text-xs text-gray-400 self-start flex-shrink-0 ml-2">
                          {conv.lastMessage.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-sm text-gray-500 truncate">{lastMessageText}</p>
                       {conv.unreadCount > 0 && (
                         <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                           {conv.unreadCount}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ConversationList;
