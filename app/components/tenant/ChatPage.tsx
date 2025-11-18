"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { EnrichedConversation } from '@/types';
import { getConversationsForUser, createConversation } from '@/lib/data';
import ConversationList from '../messages/ConversationList';
import MessageStream from '../messages/MessageStream';
import { can } from '@/lib/permissions';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CreateChannelForm from '../messages/CreateChannelForm';
import ConversationDetailsPanel from '../messages/ConversationDetailsPanel';

interface ChatPageProps {
  tenant: any; // Has architectural issues, needs refactoring
  user: any;
  onViewProfile?: (userId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ tenant, user, onViewProfile }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);

  const tenantConversations = useMemo(() => {
    const all = getConversationsForUser(user.id);
    return all.filter((c) => c.tenantId === tenant.id);
  }, [user.id, tenant.id, updateTrigger]);

  const [activeConversation, setActiveConversation] = useState<EnrichedConversation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyCreatedConvId, setNewlyCreatedConvId] = useState<string | null>(null);

  const canCreate = can(user, tenant, 'canCreateGroupChats');

  useEffect(() => {
    if (newlyCreatedConvId) {
      // A new channel was just created
      const newConv = tenantConversations.find((c) => c.id === newlyCreatedConvId);
      if (newConv) {
        setActiveConversation(newConv);
        setNewlyCreatedConvId(null); // Reset
      }
    } else {
      // Normal behavior: check if active is still valid or pick a default
      const activeConvStillExists = tenantConversations.some((c) => c.id === activeConversation?.id);
      if (!activeConvStillExists) {
        const announcementChannel = tenantConversations.find(c => c.name === '#announcements');
        const defaultChannel = tenantConversations.find((c) => c.isDefaultChannel);
        setActiveConversation(announcementChannel || defaultChannel || tenantConversations[0] || null);
      }
    }
  }, [tenantConversations, activeConversation, newlyCreatedConvId]);

  const handleCreateChannel = (data: { name: string; isPrivate: boolean; participantIds: string[] }) => {
    const newConv = createConversation(tenant.id, user.id, data.name, data.isPrivate, data.participantIds);
    setIsModalOpen(false);
    setNewlyCreatedConvId(newConv.id);
    setUpdateTrigger((c) => c + 1);
  };

  const handleConversationSelect = useCallback((conversation: EnrichedConversation) => {
    setActiveConversation(conversation);
  }, []);

  const forceConversationListUpdate = useCallback(() => {
    setUpdateTrigger(c => c + 1);
  }, []);


  return (
    <>
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
              onViewProfile={onViewProfile}
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
                    onViewProfile={onViewProfile}
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