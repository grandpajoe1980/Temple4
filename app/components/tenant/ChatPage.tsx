"use client"

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { EnrichedConversation, EnrichedChatMessage } from '@/types';
import ConversationList from '../messages/ConversationList';
import MessageStream from '../messages/MessageStream';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CreateChannelForm from '../messages/CreateChannelForm';
import ConversationDetailsPanel from '../messages/ConversationDetailsPanel';
import CommunityChips from './CommunityChips';

interface ChatPageProps {
  tenant: any; // Has architectural issues, needs refactoring
  user: any;
  onViewProfile?: (userId: string) => void;
  canCreateGroupChats?: boolean;
}

function normalizeMessage(rawMessage: any): EnrichedChatMessage {
  const user = rawMessage.user ?? rawMessage;
  return {
    ...rawMessage,
    userDisplayName: user.profile?.displayName || user.email || 'Unknown user',
    userAvatarUrl: user.profile?.avatarUrl || undefined,
    createdAt: new Date(rawMessage.createdAt),
  };
}

function normalizeConversation(conversation: any, currentUserId: string): EnrichedConversation {
  const participants = (conversation.participants || []).map((participant: any) => {
    const user = participant.user ?? participant;
    return {
      ...user,
      profile: user.profile ?? participant.user?.profile ?? {},
    };
  });

  // Prefer canonical `kind` where available. Fall back to legacy heuristics.
  const derivedIsDirect =
    (conversation.kind === 'DM') ||
    (conversation.isDirect ?? conversation.isDirectMessage ?? (!conversation.name && participants.length <= 2));
  const isDirect = Boolean(derivedIsDirect);
  const otherParticipant = isDirect
    ? participants.find((participant: any) => participant.id !== currentUserId)
    : null;

  const lastMessageRaw = conversation.lastMessage || conversation.messages?.[0];
  const lastMessage = lastMessageRaw ? normalizeMessage(lastMessageRaw) : undefined;

  return {
    ...conversation,
    participants,
    isDirect,
    kind: conversation.kind || (isDirect ? 'DM' : 'GROUP'),
    scope: conversation.scope || (conversation.tenantId ? 'TENANT' : 'GLOBAL'),
    displayName:
      conversation.displayName ||
      conversation.name ||
      (isDirect && otherParticipant
        ? otherParticipant.profile?.displayName || otherParticipant.email || 'Direct Message'
        : 'Group Conversation'),
    lastMessage,
    unreadCount: conversation.unreadCount ?? 0,
  };
}

const ChatPage: React.FC<ChatPageProps> = ({ tenant, user, onViewProfile, canCreateGroupChats }) => {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        setConversations([]);
        return;
      }

      const data = await response.json();
      const filtered = (data as any[]).filter((conversation) => conversation.tenant?.id === tenant.id || conversation.tenantId === tenant.id);
      setConversations(filtered.map((conversation) => normalizeConversation(conversation, user.id)));
    } catch (error) {
      console.error('Failed to load tenant conversations', error);
      setConversations([]);
    }
  }, [tenant.id, user.id]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const tenantConversations = useMemo(() => {
    return conversations;
  }, [conversations]);

  const [activeConversation, setActiveConversation] = useState<EnrichedConversation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyCreatedConvId, setNewlyCreatedConvId] = useState<string | null>(null);

  const canCreate = canCreateGroupChats ?? true;

  useEffect(() => {
    if (newlyCreatedConvId) {
      // A new channel was just created
      const newConv = tenantConversations.find((c: any) => c.id === newlyCreatedConvId);
      if (newConv) {
        setActiveConversation(newConv);
        setNewlyCreatedConvId(null); // Reset
      }
    } else {
      // Normal behavior: check if active is still valid or pick a default
      const activeConvStillExists = tenantConversations.some((c: any) => c.id === activeConversation?.id);
      if (!activeConvStillExists) {
        const announcementChannel = tenantConversations.find((c: any) => c.name === '#announcements');
        const defaultChannel = tenantConversations.find((c: any) => c.isDefaultChannel);
        setActiveConversation(announcementChannel || defaultChannel || tenantConversations[0] || null);
      }
    }
  }, [tenantConversations, activeConversation, newlyCreatedConvId]);

  const handleCreateChannel = async (data: { name: string; isPrivate: boolean; participantIds: string[]; scope?: 'TENANT' | 'GLOBAL'; kind?: 'CHANNEL' | 'GROUP' | 'DM' }) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, name: data.name, participantIds: data.participantIds, scope: data.scope || 'TENANT', kind: data.kind || 'CHANNEL' }),
      });

      if (!response.ok) {
        console.error('Failed to create channel');
        return;
      }

      const created = await response.json();
      const normalized = normalizeConversation(created, user.id);

      setConversations((prev) => {
        const exists = prev.find((conv) => conv.id === normalized.id);
        if (exists) return prev;
        return [...prev, normalized];
      });

      setIsModalOpen(false);
      setNewlyCreatedConvId(normalized.id);
    } catch (error) {
      console.error('Failed to create channel', error);
    }
  };

  const handleConversationSelect = useCallback((conversation: EnrichedConversation) => {
    setActiveConversation(conversation);
  }, []);

  const forceConversationListUpdate = useCallback(() => {
    refreshConversations();
  }, [refreshConversations]);


  return (
    <>
      <CommunityChips tenantId={(tenant as any).id} />
      <div className="flex h-[calc(100vh-170px)] bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div className="w-full sm:w-1/3 md:w-1/4 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Channels</h2>
              <p className="text-sm text-gray-500">Conversations in {tenant.name}</p>
            </div>
            {canCreate && (
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                New
              </Button>
            )}
          </div>
          <ConversationList
            conversations={tenantConversations}
            currentUser={user}
            activeConversationId={activeConversation?.id}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Middle Panel: Message Stream */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <MessageStream
              key={activeConversation.id} // Re-mount component when conversation changes
              currentUser={user}
              conversation={activeConversation}
              onViewProfile={onViewProfile || (() => {})}
              tenant={tenant}
              isDetailsPanelOpen={isDetailsPanelOpen}
              onToggleDetailsPanel={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
              onMarkAsRead={forceConversationListUpdate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">No Channels Available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {canCreate ? 'Create a channel to start chatting.' : 'There are no channels for you in this tenant yet.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Conversation Details */}
        {isDetailsPanelOpen && activeConversation && (
            <div className="hidden lg:block w-full sm:w-1/3 md:w-1/4 border-l border-gray-200">
                <ConversationDetailsPanel 
                    key={activeConversation.id}
                    conversation={activeConversation}
                    tenant={tenant}
                    onViewProfile={onViewProfile || (() => {})}
                />
            </div>
        )}

      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Channel">
        <CreateChannelForm
          tenant={tenant}
          currentUser={user}
          onSubmit={handleCreateChannel}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default ChatPage;