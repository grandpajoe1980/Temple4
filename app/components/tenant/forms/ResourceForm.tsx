"use client"

import React, { useState } from 'react';
import type { ResourceItem } from '@/types';
import { FileType, ResourceVisibility } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface ResourceFormProps {
  onSubmit: (data: Omit<ResourceItem, 'id' | 'createdAt' | 'tenantId' | 'uploaderUserId'>) => void;
  onCancel: () => void;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<FileType>(FileType.PDF);
  const [visibility, setVisibility] = useState<ResourceVisibility>(ResourceVisibility.MEMBERS_ONLY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      alert('Please fill out the Title and File URL fields.');
      return;
    }
    onSubmit({ title, description, fileUrl, fileType, visibility });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
       <Input
        label="File URL (mock)"
        id="fileUrl"
        name="fileUrl"
        type="url"
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
        required
        placeholder="https://example.com/file.pdf"
      />
       <div>
        <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
          File Type
        </label>
        <select
          id="fileType"
          name="fileType"
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
          value={fileType}
          onChange={(e) => setFileType(e.target.value as FileType)}
        >
          {Object.values(FileType).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
        <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
                <input type="radio" name="visibility" value={ResourceVisibility.MEMBERS_ONLY} checked={visibility === ResourceVisibility.MEMBERS_ONLY} onChange={() => setVisibility(ResourceVisibility.MEMBERS_ONLY)} className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500" />
                <span>Members Only</span>
            </label>
             <label className="flex items-center space-x-2">
                <input type="radio" name="visibility" value={ResourceVisibility.PUBLIC} checked={visibility === ResourceVisibility.PUBLIC} onChange={() => setVisibility(ResourceVisibility.PUBLIC)} className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500" />
                <span>Public</span>
            </label>
        </div>
      </div>
      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Resource
        </Button>
      </div>
    </form>
  );
};

export default ResourceForm;