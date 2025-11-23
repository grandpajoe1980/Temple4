"use client";

export async function fetchProfilePosts(userId: string, page = 1, limit = 10) {
  const res = await fetch(`/api/users/${userId}/profile-posts?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch posts');
  }
  return res.json();
}

export async function createProfilePostClient(userId: string, data: any) {
  const res = await fetch(`/api/users/${userId}/profile-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create post');
  }

  return res.json();
}

export async function addReactionClient(userId: string, postId: string, type: string) {
  const res = await fetch(`/api/users/${userId}/profile-posts/${postId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add reaction');
  }

  return res.json();
}

export async function addCommentClient(userId: string, postId: string, content: string) {
  const res = await fetch(`/api/users/${userId}/profile-posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add comment');
  }

  return res.json();
}

export async function deleteProfilePostClient(userId: string, postId: string) {
  const res = await fetch(`/api/users/${userId}/profile-posts/${postId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete post');
  }

  return res.json();
}
