'use client';

import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';

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

interface FriendsListProps {
    friends: Friend[];
    onRefresh: () => Promise<void>;
}

export function FriendsList({ friends, onRefresh }: FriendsListProps) {
    const handleRemoveFriend = async (friendshipId: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;

        try {
            const response = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    if (friends.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Your Friends</h3>
                <p className="text-gray-500 text-sm">No friends yet. Visit user profiles to send friend requests!</p>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Your Friends ({friends.length})</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {friends.map((friend) => {
                    const location = [friend.profile?.locationCity, friend.profile?.locationCountry]
                        .filter(Boolean)
                        .join(', ');

                    return (
                        <div
                            key={friend.friendshipId}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                            <UserLink userId={friend.friendId}>
                                <Avatar
                                    src={friend.profile?.avatarUrl ?? undefined}
                                    name={friend.profile?.displayName ?? undefined}
                                    size="md"
                                />
                            </UserLink>
                            <div className="flex-1 min-w-0">
                                <UserLink
                                    userId={friend.friendId}
                                    className="font-medium text-gray-900 hover:underline block truncate"
                                >
                                    {friend.profile?.displayName || friend.email}
                                </UserLink>
                                {location && (
                                    <p className="text-xs text-gray-500 truncate">{location}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleRemoveFriend(friend.friendshipId)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                title="Remove friend"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
