"use client"

import React, { useState } from 'react';
import type { PostInput } from '@/types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface PostFormProps {
  onSubmit: (postData: PostInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initial?: Partial<PostInput>;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, onCancel, isSubmitting = false, initial }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [type, setType] = useState<'BLOG' | 'ANNOUNCEMENT' | 'BOOK'>(initial?.type ?? 'BLOG');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      alert('Please fill in both the title and body.');
      return;
    }
    onSubmit({ title, body, type, isPublished });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Post Title"
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="e.g., Annual Community Picnic"
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="Write your content here..."
          disabled={isSubmitting}
        />
      </div>
      
      <div>
         <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Post Type
        </label>
        <select
          id="type"
          name="type"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200 sm:text-sm rounded-md bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={type}
          onChange={(e) => setType(e.target.value as 'BLOG' | 'ANNOUNCEMENT' | 'BOOK')}
          disabled={isSubmitting}
        >
          <option value="BLOG">Blog</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="BOOK">Book</option>
        </select>
      </div>

      <ToggleSwitch
        label="Publish Immediately"
        description="If disabled, this post will be saved as a draft."
        enabled={isPublished}
        onChange={setIsPublished}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Post'}
        </Button>
      </div>
    </form>
  );
};

export default PostForm;