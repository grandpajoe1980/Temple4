"use client"

import React, { useState } from 'react';
import { CommunityPostType } from '@/types';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import useTranslation from '@/app/hooks/useTranslation';

interface SubmitSupportRequestFormProps {
  onSubmit: (data: { type: CommunityPostType; body: string; isAnonymous: boolean }) => void;
  onCancel: () => void;
}

const SubmitSupportRequestForm: React.FC<SubmitSupportRequestFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [type, setType] = useState<CommunityPostType>(CommunityPostType.SUPPORT_REQUEST);
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      alert(t('forms.supportRequest.pleaseEnterRequest'));
      return;
    }
    onSubmit({ type, body, isAnonymous });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.supportRequest.requestType')}</label>
        <div className="flex space-x-4">
          <label className="flex-1">
            <input type="radio" name="post-type" value={CommunityPostType.SUPPORT_REQUEST} checked={type === CommunityPostType.SUPPORT_REQUEST} onChange={() => setType(CommunityPostType.SUPPORT_REQUEST)} className="sr-only" />
            <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${type === CommunityPostType.SUPPORT_REQUEST ? 'border-[color:var(--primary)] tenant-bg-50' : 'border-gray-300 bg-white'}`}>
              {t('forms.supportRequest.supportRequest')}
            </div>
          </label>
          <label className="flex-1">
            <input type="radio" name="post-type" value={CommunityPostType.TANGIBLE_NEED} checked={type === CommunityPostType.TANGIBLE_NEED} onChange={() => setType(CommunityPostType.TANGIBLE_NEED)} className="sr-only" />
            <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${type === CommunityPostType.TANGIBLE_NEED ? 'border-[color:var(--primary)] tenant-bg-50' : 'border-gray-300 bg-white'}`}>
              {t('forms.supportRequest.tangibleNeed')}
            </div>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          {t('forms.supportRequest.yourRequest')}
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder={t('forms.supportRequest.placeholder')}
        />
      </div>

      <ToggleSwitch
        label={t('forms.supportRequest.postAnonymously')}
        description={t('forms.supportRequest.postAnonymouslyDesc')}
        enabled={isAnonymous}
        onChange={setIsAnonymous}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {t('forms.supportRequest.submitForReview')}
        </Button>
      </div>
    </form>
  );
};

export default SubmitSupportRequestForm;