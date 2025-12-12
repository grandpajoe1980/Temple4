'use client';

import { useState, useEffect, useCallback } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { FriendsFeed } from '@/app/components/friends/FriendsFeed';
import { FriendsList } from '@/app/components/friends/FriendsList';
import { UserSearchPanel } from '@/app/components/friends/UserSearchPanel';
import { ProfilePostForm } from '@/app/components/profile/ProfilePostForm';

interface FriendsPageProps {
    currentUserId: string;
}

interface Friend {
    friendshipId: string;
    friendId: string;
    id: string;
    email: string;
    createdAt: string;
    profile: {
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        locationCity: string | null;
        locationCountry: string | null;
    } | null;
}

interface PendingRequest {
    id: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        email: string;
        profile: {
            displayName: string;
            avatarUrl: string | null;
            locationCity: string | null;
            locationCountry: string | null;
        } | null;
    };
}

export default function FriendsPage({ currentUserId }: FriendsPageProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'feed' | 'requests' | 'add'>('feed');
    const [initialTabSet, setInitialTabSet] = useState(false);
    const [showPostForm, setShowPostForm] = useState(false);
    const [feedKey, setFeedKey] = useState(0); // Used to refresh feed after posting

    const fetchFriends = useCallback(async () => {
        try {
            const response = await fetch('/api/friends');
            if (response.ok) {
                const data = await response.json();
                setFriends(data.friends || []);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            const response = await fetch('/api/friends/requests');
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchFriends(), fetchRequests()]);
            setLoading(false);
        };
        loadData();
    }, [fetchFriends, fetchRequests]);

    // Auto-switch to Requests tab if there are pending requests on first load
    useEffect(() => {
        if (!loading && !initialTabSet && pendingRequests.length > 0) {
            setActiveTab('requests');
            setInitialTabSet(true);
        } else if (!loading && !initialTabSet) {
            setInitialTabSet(true);
        }
    }, [loading, initialTabSet, pendingRequests.length]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
                method: 'POST',
            });
            if (response.ok) {
                // Refresh both lists
                await Promise.all([fetchFriends(), fetchRequests()]);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/requests/${requestId}/reject`, {
                method: 'POST',
            });
            if (response.ok) {
                await fetchRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    const handleCreatePost = async (postData: any) => {
        try {
            // Create a profile post with FRIENDS privacy by default
            const response = await fetch(`/api/users/${currentUserId}/profile-posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...postData,
                    privacy: postData.privacy || 'FRIENDS', // Default to FRIENDS privacy
                }),
            });
            if (response.ok) {
                setShowPostForm(false);
                setFeedKey(prev => prev + 1); // Refresh the feed
            }
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
                <p className="text-gray-600 mt-1">Connect with your friends and see their updates</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'feed'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Feed
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-1 font-medium transition-colors relative ${activeTab === 'requests'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Requests
                    {pendingRequests.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'add'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Add
                </button>
            </div>

            {activeTab === 'add' ? (
                /* Add Friends Tab */
                <UserSearchPanel currentUserId={currentUserId} />
            ) : activeTab === 'requests' ? (
                /* Friend Requests Tab */
                <div className="max-w-2xl">
                    {pendingRequests.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-gray-500">No pending friend requests</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <Card key={request.id} className="p-4">
                                    <div className="flex items-center gap-4">
                                        <UserLink userId={request.sender.id}>
                                            <Avatar
                                                src={request.sender.profile?.avatarUrl ?? undefined}
                                                name={request.sender.profile?.displayName ?? undefined}
                                                size="md"
                                            />
                                        </UserLink>
                                        <div className="flex-1 min-w-0">
                                            <UserLink userId={request.sender.id} className="font-semibold text-gray-900 hover:underline">
                                                {request.sender.profile?.displayName || request.sender.email}
                                            </UserLink>
                                            {(request.sender.profile?.locationCity || request.sender.profile?.locationCountry) && (
                                                <p className="text-sm text-gray-500 truncate">
                                                    {[request.sender.profile?.locationCity, request.sender.profile?.locationCountry]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleAcceptRequest(request.id)}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectRequest(request.id)}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Feed Tab - Desktop: Two Column, Mobile: Stacked */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Friends List - Left Column on Desktop, Hidden on Mobile by default */}
                    <div className="lg:col-span-4 order-2 lg:order-1">
                        <div className="lg:sticky lg:top-4">
                            <FriendsList friends={friends} onRefresh={fetchFriends} />
                        </div>
                    </div>

                    {/* Feed - Right Column on Desktop */}
                    <div className="lg:col-span-8 order-1 lg:order-2">
                        {/* Create Post Section */}
                        {!showPostForm ? (
                            <Card className="p-4 mb-4">
                                <button
                                    onClick={() => setShowPostForm(true)}
                                    className="w-full flex items-center gap-3 text-left text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                    </div>
                                    <span className="text-base">Share something with your friends...</span>
                                </button>
                            </Card>
                        ) : (
                            <div className="mb-4">
                                <ProfilePostForm
                                    userId={currentUserId}
                                    onSubmit={handleCreatePost}
                                    onCancel={() => setShowPostForm(false)}
                                />
                            </div>
                        )}

                        {friends.length === 0 ? (
                            <Card className="p-8 text-center">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                                <p className="text-gray-500 mb-4">
                                    Visit user profiles and send friend requests to connect with others
                                </p>
                            </Card>
                        ) : (
                            <FriendsFeed key={feedKey} currentUserId={currentUserId} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
