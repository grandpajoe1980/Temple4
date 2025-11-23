"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '../ui/Toast';
import { Image } from 'lucide-react';

const ImageUpload = dynamic(() => import('../ui/ImageUpload'), { ssr: false }) as any;

interface ProfilePostFormProps {
  userId: string;
  tenantId?: string | null;
  onSubmit: (data: {
    type: string;
    content?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkImage?: string;
    privacy: string;
    mediaIds?: string[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ProfilePostForm({ userId, tenantId, onSubmit, onCancel }: ProfilePostFormProps) {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS'>('PUBLIC');
  const [showPhoto, setShowPhoto] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoMediaId, setPhotoMediaId] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoAutoOpen, setPhotoAutoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !linkUrl.trim() && !showPhoto) return;

    setIsSubmitting(true);
    try {
      let type = 'TEXT';
      const hasLink = !!linkUrl.trim();
      const hasPhoto = showPhoto && (!!photoUrl || !!photoMediaId);
      if (hasPhoto && hasLink) type = 'MIXED';
      else if (hasPhoto) type = 'IMAGE';
      else if (hasLink) type = 'LINK';

      const payload: any = {
        type,
        content: content.trim() || undefined,
        privacy,
      };

      if (hasLink) {
        payload.linkUrl = linkUrl.trim();
        if (linkTitle.trim()) payload.linkTitle = linkTitle.trim();
      }

      if (hasPhoto) {
        if (photoMediaId) payload.mediaIds = [photoMediaId];
        else if (photoUrl) {
          let normalizedUrl = photoUrl;
          if (normalizedUrl.startsWith('/')) {
            try {
              normalizedUrl = `${window.location.origin}${normalizedUrl}`;
            } catch (e) {
              // ignore and send relative as fallback
            }
          }
          payload.linkImage = normalizedUrl;
        }
        if (photoDescription.trim()) payload.content = payload.content ? `${payload.content}\n${photoDescription.trim()}` : photoDescription.trim();
      }

      await onSubmit(payload);

      // reset
      setContent('');
      setLinkUrl('');
      setLinkTitle('');
      setShowPhoto(false);
      setPhotoUrl('');
      setPhotoDescription('');
      setPhotoMediaId(null);
    } catch (err) {
      console.error('Error creating post', err);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPastedImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (tenantId) fd.append('tenantId', tenantId);
      fd.append('category', 'photos');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        toast.error(err.message || 'Upload failed');
        return;
      }
      const data = await res.json();
      let imageUrl = data?.url || (data?.storageKey ? `/storage/${data.storageKey}` : '');
      // If server returned a storage path (relative), convert to absolute URL so
      // downstream validation that expects a full URL passes.
      if (imageUrl && imageUrl.startsWith('/')) {
        try {
          imageUrl = `${window.location.origin}${imageUrl}`;
        } catch (e) {
          // In non-browser environments (shouldn't happen inside this client
          // component) fall back to the relative path.
        }
      }
      if (data?.mediaItem) setPhotoMediaId(data.mediaItem.id);
      if (imageUrl) setPhotoUrl(imageUrl);
      setShowPhoto(true);
      toast.success('Image uploaded from clipboard');
    } catch (err) {
      console.error('Paste upload failed', err);
      toast.error('Failed to upload pasted image');
    } finally {
      setIsUploadingImage(false);
      setPhotoAutoOpen(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' || item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          uploadPastedImage(file);
          break;
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder={"What's on your mind?"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
        />

        <div className="mt-3">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showPhoto && (
          <div className="mt-3 space-y-3">
            <ImageUpload
              label="Photo"
              currentImageUrl={photoUrl}
              onImageUrlChange={(url: string) => { setPhotoUrl(url); setPhotoAutoOpen(false); }}
              onMediaItemCreated={(m: any) => { setPhotoMediaId(m?.id); setPhotoAutoOpen(false); }}
              tenantId={tenantId ?? undefined}
              category="photos"
              showPreview={true}
              autoOpen={photoAutoOpen}
            />

            <input
              type="text"
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              placeholder="Add a description for the photo (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Privacy:</label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="PUBLIC">🌍 Public</option>
              <option value="FRIENDS">👥 Friends</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => { setShowPhoto(true); setPhotoAutoOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200"
            >
              <Image className="w-4 h-4" />
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage || (!content.trim() && !showPhoto && !linkUrl.trim())}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Posting...' : (isUploadingImage ? 'Uploading...' : 'Post')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

