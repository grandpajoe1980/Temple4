'use client';

import { useState, useCallback } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';

interface SearchResult {
    id: string;
    email: string;
    profile: {
        displayName: string;
        avatarUrl: string | null;
        locationCity: string | null;
        locationCountry: string | null;
        birthDate: string | null;
    } | null;
    friendStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
}

interface UserSearchPanelProps {
    currentUserId: string;
}

export function UserSearchPanel({ currentUserId }: UserSearchPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [sendingRequest, setSendingRequest] = useState<string | null>(null);

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim() && !cityFilter.trim()) return;

        setLoading(true);
        setHasSearched(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.set('q', searchQuery.trim());
            if (cityFilter.trim()) params.set('city', cityFilter.trim());
            if (minAge) params.set('minAge', minAge);
            if (maxAge) params.set('maxAge', maxAge);

            const response = await fetch(`/api/users/search?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.users || []);
            } else {
                console.error('Search failed');
                setResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, cityFilter, minAge, maxAge]);

    const handleSendRequest = async (userId: string) => {
        setSendingRequest(userId);
        try {
            const response = await fetch(`/api/users/${userId}/friend-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // Update the local state to reflect the sent request
                setResults(prev => prev.map(user =>
                    user.id === userId
                        ? { ...user, friendStatus: 'PENDING_SENT' as const }
                        : user
                ));
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to send request');
            }
        } catch (error: any) {
            console.error('Failed to send friend request:', error);
            alert(error.message || 'Failed to send friend request');
        } finally {
            setSendingRequest(null);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCityFilter('');
        setMinAge('');
        setMaxAge('');
        setResults([]);
        setHasSearched(false);
    };

    const renderFriendButton = (user: SearchResult) => {
        const isLoading = sendingRequest === user.id;

        switch (user.friendStatus) {
            case 'FRIENDS':
                return (
                    <span className="text-sm text-green-600 font-medium px-3 py-1.5 bg-green-50 rounded-full">
                        ✓ Friends
                    </span>
                );
            case 'PENDING_SENT':
                return (
                    <span className="text-sm text-amber-600 font-medium px-3 py-1.5 bg-amber-50 rounded-full">
                        Request Sent
                    </span>
                );
            case 'PENDING_RECEIVED':
                return (
                    <span className="text-sm text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-full">
                        Pending
                    </span>
                );
            default:
                return (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Add Friend'}
                    </Button>
                );
        }
    };

    return (
        <div className="max-w-3xl">
            {/* Search Form */}
            <Card className="p-4 mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Main Search Input */}
                    <div>
                        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                            Search by Name or Email
                        </label>
                        <input
                            id="search-query"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter name or email..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                id="city-filter"
                                type="text"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                placeholder="Any city"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="min-age" className="block text-sm font-medium text-gray-700 mb-1">
                                Min Age
                            </label>
                            <input
                                id="min-age"
                                type="number"
                                min="1"
                                max="120"
                                value={minAge}
                                onChange={(e) => setMinAge(e.target.value)}
                                placeholder="Any"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="max-age" className="block text-sm font-medium text-gray-700 mb-1">
                                Max Age
                            </label>
                            <input
                                id="max-age"
                                type="number"
                                min="1"
                                max="120"
                                value={maxAge}
                                onChange={(e) => setMaxAge(e.target.value)}
                                placeholder="Any"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Results */}
            {loading ? (
                <Card className="p-8 text-center">
                    <div className="text-gray-500">Searching...</div>
                </Card>
            ) : hasSearched && results.length === 0 ? (
                <Card className="p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                        Try adjusting your search terms or filters
                    </p>
                </Card>
            ) : results.length > 0 ? (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                        Found {results.length} user{results.length !== 1 ? 's' : ''}
                    </p>
                    {results.map((user) => {
                        const location = [user.profile?.locationCity, user.profile?.locationCountry]
                            .filter(Boolean)
                            .join(', ');

                        return (
                            <Card key={user.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <UserLink userId={user.id}>
                                        <Avatar
                                            src={user.profile?.avatarUrl ?? undefined}
                                            name={user.profile?.displayName ?? undefined}
                                            size="md"
                                        />
                                    </UserLink>
                                    <div className="flex-1 min-w-0">
                                        <UserLink
                                            userId={user.id}
                                            className="font-semibold text-gray-900 hover:underline block truncate"
                                        >
                                            {user.profile?.displayName || user.email}
                                        </UserLink>
                                        {location && (
                                            <p className="text-sm text-gray-500 truncate">{location}</p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        {renderFriendButton(user)}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : !hasSearched ? (
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Find Friends</h3>
                    <p className="text-gray-500">
                        Search for users by name, email, or use filters to find people in your area
                    </p>
                </Card>
            ) : null}
        </div>
    );
}
