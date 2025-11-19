"use client"

import React, { useState } from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

export interface SermonFormData {
  title: string;
  description: string;
  embedUrl: string;
}

interface SermonFormProps {
  onSubmit: (data: SermonFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SermonForm: React.FC<SermonFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !embedUrl) {
      alert('Please provide a title and embed URL for the sermon.');
      return;
    }

    onSubmit({ title, description, embedUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Sermon Title"
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="e.g., Sunday Worship Service"
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Share a short summary of the sermon."
          disabled={isSubmitting}
        />
      </div>

      <Input
        label="Embed URL"
        id="embedUrl"
        name="embedUrl"
        type="url"
        value={embedUrl}
        onChange={(e) => setEmbedUrl(e.target.value)}
        required
        placeholder="https://example.com/sermon"
        disabled={isSubmitting}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Sermon'}
        </Button>
      </div>
    </form>
  );
};

export default SermonForm;
