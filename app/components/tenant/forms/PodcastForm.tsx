"use client"

import React, { useState } from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import useTranslation from '@/app/hooks/useTranslation';

export interface PodcastFormData {
  title: string;
  description?: string;
  embedUrl: string;
}

interface PodcastFormProps {
  onSubmit: (data: PodcastFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<PodcastFormData>;
}

const PodcastForm: React.FC<PodcastFormProps> = ({ onSubmit, onCancel, isSubmitting = false, defaultValues }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [embedUrl, setEmbedUrl] = useState(defaultValues?.embedUrl ?? '');

  // update local state if defaultValues change (e.g., when editing a different podcast)
  React.useEffect(() => {
    if (defaultValues) {
      if (defaultValues.title !== undefined) setTitle(defaultValues.title || '');
      if (defaultValues.description !== undefined) setDescription(defaultValues.description || '');
      if (defaultValues.embedUrl !== undefined) setEmbedUrl(defaultValues.embedUrl || '');
    }
  }, [defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !embedUrl) {
      alert(t('forms.podcast.requiredFields'));
      return;
    }

    onSubmit({
      title,
      description: description || undefined,
      embedUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('forms.podcast.episodeTitle')}
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder={t('forms.podcast.episodePlaceholder')}
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          {t('common.description')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('forms.podcast.descriptionPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <Input
        label={t('forms.podcast.audioUrl')}
        id="embedUrl"
        name="embedUrl"
        type="url"
        value={embedUrl}
        onChange={(e) => setEmbedUrl(e.target.value)}
        required
        placeholder="https://example.com/podcast.mp3"
        disabled={isSubmitting}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('forms.podcast.savePodcast')}
        </Button>
      </div>
    </form>
  );
};

export default PodcastForm;
