"use client"

import React, { useState } from 'react';
import type { PostInput } from '@/types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import useTranslation from '@/app/hooks/useTranslation';

interface PostFormProps {
  onSubmit: (postData: PostInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initial?: Partial<PostInput>;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, onCancel, isSubmitting = false, initial }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [type, setType] = useState<'BLOG' | 'ANNOUNCEMENT' | 'BOOK'>(initial?.type ?? 'BLOG');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      alert(t('postForm.fillTitleAndBody'));
      return;
    }
    onSubmit({ title, body, type, isPublished });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('postForm.postTitle')}
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder={t('postForm.titlePlaceholder')}
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          {t('postForm.body')}
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder={t('postForm.bodyPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          {t('postForm.postType')}
        </label>
        <select
          id="type"
          name="type"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200 sm:text-sm rounded-md bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={type}
          onChange={(e) => setType(e.target.value as 'BLOG' | 'ANNOUNCEMENT' | 'BOOK')}
          disabled={isSubmitting}
        >
          <option value="BLOG">{t('posts.typeBlog')}</option>
          <option value="ANNOUNCEMENT">{t('posts.typeAnnouncement')}</option>
          <option value="BOOK">{t('posts.typeBook')}</option>
        </select>
      </div>

      <ToggleSwitch
        label={t('postForm.publishImmediately')}
        description={t('postForm.publishDescription')}
        enabled={isPublished}
        onChange={setIsPublished}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('postForm.saving') : t('postForm.savePost')}
        </Button>
      </div>
    </form>
  );
};

export default PostForm;