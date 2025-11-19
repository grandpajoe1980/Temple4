"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { User, EnrichedConversation, EnrichedChatMessage, Tenant } from '@/types';
import Button from '../ui/Button';
import { can, canDeleteMessage } from '@/lib/permissions';

interface MessageStreamProps {
  currentUser: User;
  conversation: EnrichedConversation;
  onViewProfile: (userId: string) => void;
  tenant?: Tenant;
  isDetailsPanelOpen: boolean;
  onToggleDetailsPanel: () => void;
  onMarkAsRead: () => void;
}

const mapMessage = (message: any): EnrichedChatMessage => {
  const user = message.user ?? message;
  return {
    ...message,
    userDisplayName: user.profile?.displayName || user.email || 'Unknown user',
    userAvatarUrl: user.profile?.avatarUrl || undefined,
    createdAt: new Date(message.createdAt),
  };
};

const MessageStream: React.FC<MessageStreamProps> = ({ currentUser, conversation, onViewProfile, tenant, isDetailsPanelOpen, onToggleDetailsPanel, onMarkAsRead }) => {
  const [messages, setMessages] = useState<EnrichedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 40;
    setIsNearBottom(nearBottom);
    setShowScrollToLatest(!nearBottom && messages.length > 0);
  }, [messages.length]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);

      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = await response.json();
      const normalizedMessages = (data as any[]).map(mapMessage);
      setMessages(normalizedMessages);

      if (normalizedMessages.length > 0) {
        await fetch(`/api/conversations/${conversation.id}/messages`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: normalizedMessages[normalizedMessages.length - 1].id }),
        });
      }

      onMarkAsRead();
    } catch (error) {
      console.error('Failed to load messages', error);
      setMessages([]);
    }
  }, [conversation.id, onMarkAsRead]);

  useEffect(() => {
    setMessages([]);
    fetchMessages();

    const interval = setInterval(fetchMessages, 60000); // Poll every 60 seconds instead of 5
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (isNearBottom) {
      // Removed auto scroll on message changes to prevent scrolling on poll
      // scrollToBottom();
      setShowScrollToLatest(false);
    } else if (messages.length > 0) {
      setShowScrollToLatest(true);
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    handleScrollPosition();
    container.addEventListener('scroll', handleScrollPosition);
    return () => container.removeEventListener('scroll', handleScrollPosition);
  }, [handleScrollPosition]);
  
  const canSendMessage = useMemo(() => {
    if (conversation.isDirect) {
      return true;
    }
    if (tenant && conversation.name?.toLowerCase() === '#announcements') {
      return can(currentUser as any, tenant as any, 'canPostInAnnouncementChannels');
    }
    return true;
  }, [currentUser, conversation, tenant]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !canSendMessage) return;

    setIsNearBottom(true);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        const created = await response.json();
        const normalized = mapMessage(created);
        setMessages((currentMessages) => [...currentMessages, normalized]);
        setNewMessage('');
        scrollToBottom(); // Scroll to bottom when sending a message
        onMarkAsRead();
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };
  
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMessages((currentMessages) => currentMessages.filter((m) => m.id !== messageId));
          onMarkAsRead();
        }
      } catch (error) {
        console.error('Failed to delete message', error);
      }
    },
    [onMarkAsRead]
  );

  const otherParticipant = conversation.isDirect ? conversation.participants.find(p => p.id !== currentUser.id) : null;

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
         <div className="flex items-center space-x-3">
             {conversation.isDirect && otherParticipant ? (
                // FIX: Access avatarUrl and displayName from the nested profile object.
                <img src={otherParticipant.profile.avatarUrl || '/placeholder-avatar.svg'} alt={otherParticipant.profile.displayName} className="w-10 h-10 rounded-full" />
             ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl">#</div>
             )}
             <div>
                <h2 className="text-lg font-bold text-gray-900">{conversation.displayName}</h2>
             </div>
         </div>
         {!conversation.isDirect && (
            <button onClick={onToggleDetailsPanel} className={`p-2 rounded-md transition-colors lg:hidden ${isDetailsPanelOpen ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </button>
         )}
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto space-y-2">
        {showScrollToLatest && (
          <div className="flex justify-center">
            <button
              type="button"
              className="px-3 py-1 mb-2 text-xs font-medium text-white bg-amber-600 rounded-full shadow hover:bg-amber-700"
              onClick={() => {
                scrollToBottom();
                setShowScrollToLatest(false);
              }}
            >
              Jump to latest
            </button>
          </div>
        )}
        {messages.map((msg) => {
           const userCanDelete = canDeleteMessage(currentUser as any, msg as any, conversation as any, tenant as any);
           const isOwnMessage = msg.userId === currentUser.id;
           return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group relative ${
                isOwnMessage ? 'justify-end' : 'justify-start'
              }`}
              onMouseEnter={() => setShowActionsFor(msg.id)}
              onMouseLeave={() => setShowActionsFor(null)}
            >
              {!isOwnMessage && (
                <img
                  src={msg.userAvatarUrl}
                  alt={msg.userDisplayName}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={() => onViewProfile(msg.userId)}
                />
              )}
              <div className="flex flex-col">
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    isOwnMessage ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {!isOwnMessage && (
                    <p 
                        className="text-xs font-bold mb-1 text-amber-700 cursor-pointer"
                        onClick={() => onViewProfile(msg.userId)}
                    >
                        {msg.userDisplayName}
                    </p>
                  )}
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-400 self-end' : 'text-gray-400'}`}>
                  {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {showActionsFor === msg.id && (
                <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'}`}>
                  <div className="bg-white rounded-md shadow-lg border border-gray-200">
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="flex items-center space-x-2 w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {canSendMessage ? (
          <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={`Message ${conversation.displayName}...`}
              aria-label="Chat message input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 placeholder:text-gray-400"
            />
            <Button type="submit">Send</Button>
          </form>
        ) : (
            <div className="text-center text-sm text-gray-500 italic px-4 py-2 bg-gray-100 rounded-full">
                You do not have permission to post in this channel.
            </div>
        )}
      </div>
    </>
  );
};

export default MessageStream;