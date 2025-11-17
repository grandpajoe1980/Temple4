import React, { useState } from 'react';
import { CommunityPostType } from '@/types';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface SubmitPrayerPostFormProps {
  onSubmit: (data: { type: CommunityPostType; body: string; isAnonymous: boolean }) => void;
  onCancel: () => void;
}

const SubmitPrayerPostForm: React.FC<SubmitPrayerPostFormProps> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<CommunityPostType>(CommunityPostType.PRAYER_REQUEST);
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      alert('Please enter your request.');
      return;
    }
    onSubmit({ type, body, isAnonymous });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">What type of request is this?</label>
        <div className="flex space-x-4">
          <label className="flex-1">
            <input type="radio" name="post-type" value={CommunityPostType.PRAYER_REQUEST} checked={type === CommunityPostType.PRAYER_REQUEST} onChange={() => setType(CommunityPostType.PRAYER_REQUEST)} className="sr-only" />
            <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${type === CommunityPostType.PRAYER_REQUEST ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-white'}`}>
              Prayer Request
            </div>
          </label>
          <label className="flex-1">
            <input type="radio" name="post-type" value={CommunityPostType.TANGIBLE_NEED} checked={type === CommunityPostType.TANGIBLE_NEED} onChange={() => setType(CommunityPostType.TANGIBLE_NEED)} className="sr-only" />
            <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${type === CommunityPostType.TANGIBLE_NEED ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-white'}`}>
              Tangible Need
            </div>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Your Request
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="Please share what's on your heart..."
        />
      </div>

      <ToggleSwitch
        label="Post Anonymously"
        description="Your name will not be attached to this post."
        enabled={isAnonymous}
        onChange={setIsAnonymous}
      />

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Submit for Review
        </Button>
      </div>
    </form>
  );
};

export default SubmitPrayerPostForm;