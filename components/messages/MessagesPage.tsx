import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { User, EnrichedConversation } from '../../types';
import { getConversationsForUser, getOrCreateDirectConversation } from '../../seed-data';
import ConversationList from './ConversationList';
import MessageStream from './MessageStream';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import NewMessageModal from './NewMessageModal';

interface MessagesPageProps {
  currentUser: User;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
  initialActiveConversationId?: string | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, onBack, onViewProfile, initialActiveConversationId }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newlyCreatedConvId, setNewlyCreatedConvId] = useState<string | null>(null);

  const allUserConversations = useMemo(() => getConversationsForUser(currentUser.id), [currentUser.id, updateTrigger]);
  
  const [activeConversation, setActiveConversation] = useState<EnrichedConversation | null>(() => {
    if (initialActiveConversationId) {
      return allUserConversations.find(c => c.id === initialActiveConversationId) || allUserConversations[0] || null;
    }
    return allUserConversations.length > 0 ? allUserConversations[0] : null;
  });

  useEffect(() => {
    const conversationIdToSelect = newlyCreatedConvId || initialActiveConversationId;
    if (conversationIdToSelect) {
      const conversationToActivate = allUserConversations.find(c => c.id === conversationIdToSelect);
      if (conversationToActivate) {
        setActiveConversation(conversationToActivate);
        if (newlyCreatedConvId) {
          setNewlyCreatedConvId(null);
        }
      }
    } else if (!allUserConversations.some(c => c.id === activeConversation?.id)) {
        // If current active conversation is gone, select the first one.
        setActiveConversation(allUserConversations[0] || null);
    }
  }, [initialActiveConversationId, allUserConversations, newlyCreatedConvId, activeConversation]);
  
  const handleStartConversation = useCallback((recipientId: string) => {
    const conversation = getOrCreateDirectConversation(currentUser.id, recipientId);
    setIsNewMessageModalOpen(false);
    setUpdateTrigger(t => t + 1);
    setNewlyCreatedConvId(conversation.id);
  }, [currentUser.id]);

  const forceConversationListUpdate = useCallback(() => {
    setUpdateTrigger(c => c + 1);
  }, []);

  return (
    <div>
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="sm" onClick={onBack}>&larr; Back</Button>
              <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            </div>
            <Button onClick={() => setIsNewMessageModalOpen(true)}>
              + New Message
            </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 mt-8">
            <div className="flex h-[calc(100vh-170px)] bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <ConversationList
                  conversations={allUserConversations}
                  currentUser={currentUser}
                  activeConversationId={activeConversation?.id}
                  onConversationSelect={setActiveConversation}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
            </div>
            <div className="w-2/3 flex flex-col">
                {activeConversation ? (
                <MessageStream
                    key={activeConversation.id} // Re-mount component when conversation changes
                    currentUser={currentUser}
                    conversation={activeConversation}
                    onViewProfile={onViewProfile}
                    isDetailsPanelOpen={false}
                    onToggleDetailsPanel={() => {}}
                    onMarkAsRead={forceConversationListUpdate}
                />
                ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                    <h3 className="text-lg font-medium text-gray-900">Select a Conversation</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Choose a conversation from the left or start a new one.
                    </p>
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>
        <Modal isOpen={isNewMessageModalOpen} onClose={() => setIsNewMessageModalOpen(false)} title="Start a New Conversation">
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