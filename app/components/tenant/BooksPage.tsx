"use client"

import React, { useState } from 'react';
import type { PostInput, PostWithAuthor } from '@/types';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PostForm from './PostForm';
import BookCard from './BookCard';
import ContentChips from './content-chips';

interface BooksPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  books: PostWithAuthor[];
  canCreate: boolean;
}

const BooksPage: React.FC<BooksPageProps> = ({ tenant, user, books: initialBooks, canCreate }) => {
  const [books, setBooks] = useState<PostWithAuthor[]>(initialBooks);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Books" />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Books & Studies</h2>
          <p className="mt-1 text-sm text-gray-500">
            Read long-form content and teachings from {tenant.name}.
          </p>
        </div>
        {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
            + New Book/Chapter
            </Button>
        )}
      </div>

      {books.length > 0 ? (
        <div className="space-y-6">
          {books.map((book) => (
            <BookCard key={book.id} post={book} />
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
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Book/Chapter">
        <PostForm onSubmit={handleCreatePost} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default BooksPage;