"use client"

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { User, EnrichedConversation } from '@/types';
import ConversationList from './ConversationList';
import MessageStream from './MessageStream';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import NewMessageModal from './NewMessageModal';
import { normalizeConversation } from '@/app/messages/normalizers';

interface MessagesPageProps {
  currentUser: User;
  initialConversations: EnrichedConversation[];
  onBack: () => void;
  onViewProfile: (userId: string) => void;
  initialActiveConversationId?: string | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  initialConversations,
  onBack,
  onViewProfile,
  initialActiveConversationId
}) => {
  const [conversations, setConversations] = useState<EnrichedConversation[]>(initialConversations);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newlyCreatedConvId, setNewlyCreatedConvId] = useState<string | null>(null);

  const allUserConversations = useMemo(() => conversations, [conversations]);
  
  const [activeConversation, setActiveConversation] = useState<EnrichedConversation | null>(() => {
    if (initialActiveConversationId) {
      return conversations.find(c => c.id === initialActiveConversationId) || conversations[0] || null;
    }
    return conversations.length > 0 ? conversations[0] : null;
  });

  useEffect(() => {
    // Support a testing query param to open the New Message modal automatically.
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (params.get('openNewMessageModal') === '1') {
        setIsNewMessageModalOpen(true);
      }
    } catch (e) {
      // ignore
    }

    const conversationIdToSelect = newlyCreatedConvId || initialActiveConversationId;
    if (conversationIdToSelect) {
      const conversationToActivate = conversations.find(c => c.id === conversationIdToSelect);
      if (conversationToActivate) {
        setActiveConversation(conversationToActivate);
        if (newlyCreatedConvId) {
          setNewlyCreatedConvId(null);
        }
      }
    }
  }, [initialActiveConversationId, conversations, newlyCreatedConvId]);
  
  const handleStartConversation = useCallback(
    async (recipientId: string) => {
      const response = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        const normalized = normalizeConversation(conversation, currentUser.id);

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === normalized.id);
          return exists ? prev : [...prev, normalized];
        });

        setIsNewMessageModalOpen(false);
        setNewlyCreatedConvId(normalized.id);
      }
    },
    [currentUser.id]
  );

  const forceConversationListUpdate = useCallback(() => {
    fetch('/api/conversations')
      .then((res) => res.json())
      .then((data) =>
        setConversations(data.map((conversation: any) => normalizeConversation(conversation, currentUser.id)))
      );
  }, [currentUser.id]);

  return (
    <div>
        <header className="bg-card text-card-foreground shadow-sm sticky top-0 z-10 border-b border-border">
          <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="secondary" size="sm" onClick={onBack} className="flex-shrink-0">&larr; <span className="hidden sm:inline">Back</span></Button>
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Messages</h1>
            </div>
            <Button data-test="new-message-trigger" onClick={() => setIsNewMessageModalOpen(true)} size="sm" className="flex-shrink-0">
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ New Message</span>
            </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-4 sm:mt-8">
            {/* Mobile: Stack vertically, hide conversation list when viewing messages */}
            {/* Desktop/Tablet: Side-by-side layout */}
            <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] sm:h-[calc(100vh-170px)] bg-card rounded-lg shadow-sm overflow-hidden border border-border">
            
            {/* Conversation List - hidden on mobile when a conversation is selected */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border flex-col flex-shrink-0 h-1/2 md:h-full`}>
                <ConversationList
                  conversations={allUserConversations}
                  currentUser={currentUser}
                  activeConversationId={activeConversation?.id}
                  onConversationSelect={setActiveConversation}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
            </div>
            
            {/* Message Stream - full width on mobile, flex-1 on desktop */}
            <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 h-1/2 md:h-full`}>
                {activeConversation ? (
                  <div className="flex flex-col h-full">
                    {/* Mobile back button to conversation list */}
                    <div className="md:hidden p-2 border-b border-border bg-muted/50">
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        All conversations
                      </button>
                    </div>
                    <MessageStream
                      key={activeConversation.id}
                      currentUser={currentUser}
                      conversation={activeConversation}
                      onViewProfile={onViewProfile}
                      isDetailsPanelOpen={false}
                      onToggleDetailsPanel={() => {}}
                      onMarkAsRead={forceConversationListUpdate}
                    />
                  </div>
                ) : (
                <div className="flex-1 flex items-center justify-center text-center p-4">
                    <div>
                    <h3 className="text-lg font-medium text-foreground">Select a Conversation</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a conversation from the left or start a new one.
                    </p>
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>
        <Modal dataTest="new-message-modal" isOpen={isNewMessageModalOpen} onClose={() => setIsNewMessageModalOpen(false)} title="Start a New Conversation">
            <NewMessageModal 
                currentUser={currentUser}
                onClose={() => setIsNewMessageModalOpen(false)}
                onStartConversation={handleStartConversation}
            />
        </Modal>
    </div>
  );
};

export default MessagesPage;