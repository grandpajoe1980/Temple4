"use client"

import React, { useState, useEffect } from 'react';
import type { PostInput, PostWithAuthor } from '@/types';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PostForm from './PostForm';
import BookCard from './BookCard';
import ContentChips from './content-chips';
import { useSetPageHeader } from '../ui/PageHeaderContext';

interface BooksPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  books: PostWithAuthor[];
  canCreate: boolean;
}

const BooksPage: React.FC<BooksPageProps> = ({ tenant, user, books: initialBooks, canCreate }) => {
  const [books, setBooks] = useState<PostWithAuthor[]>(initialBooks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithAuthor | null>(null);
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({
      title: 'Books',
      actions: canCreate ? (
        <Button size="sm" data-test="create-book-trigger" onClick={() => setIsModalOpen(true)}>+ New</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [canCreate, setPageHeader]);

  const handleCreatePost = async (postData: PostInput) => {
    const response = await fetch(`/api/tenants/${tenant.id}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    
    if (response.ok) {
      const newBook = await response.json();
      setBooks([newBook, ...books]);
    }
    setIsModalOpen(false);
  };

  const handleEditPost = (post: PostWithAuthor) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleUpdatePost = async (postData: PostInput) => {
    if (!editingPost) return;
    const response = await fetch(`/api/tenants/${tenant.id}/posts/${editingPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: postData.title, body: postData.body, isPublished: postData.isPublished }),
    });
    if (response.ok) {
      const updated = await response.json();
      setBooks(books.map(b => b.id === updated.id ? { ...b, ...updated } : b));
    } else {
      const err = await response.json().catch(() => null);
      alert(err?.message || 'Failed to update post');
    }
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (post: PostWithAuthor) => {
    if (!confirm('Are you sure you want to delete this book/post?')) return;
    const response = await fetch(`/api/tenants/${tenant.id}/posts/${post.id}`, { method: 'DELETE' });
    if (response.ok || response.status === 204) {
      setBooks(books.filter(b => b.id !== post.id));
    } else {
      const err = await response.json().catch(() => null);
      alert(err?.message || 'Failed to delete post');
    }
  };

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Books" />

      {books.length > 0 ? (
        <div className="space-y-6">
          {books.map((book) => (
            <BookCard key={book.id} post={book} canEdit={canCreate} onEdit={handleEditPost} onDelete={handleDeletePost} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Books Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no books or long-form posts here. {canCreate ? 'Why not create one?' : ''}
          </p>
        </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPost(null); }} dataTest="create-book-modal" title={editingPost ? 'Edit Book/Chapter' : 'Create a New Book/Chapter'}>
        <PostForm onSubmit={editingPost ? handleUpdatePost : handleCreatePost} onCancel={() => { setIsModalOpen(false); setEditingPost(null); }} initial={editingPost ? { title: editingPost.title, body: editingPost.body, type: editingPost.type as any, isPublished: editingPost.isPublished } : undefined} />
      </Modal>
    </div>
  );
};

export default BooksPage;