"use client"

import React, { useEffect, useState, useRef } from 'react';
import type { Tenant } from '@/types';
import type { CurrentUser } from './CommentsSection';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import ContentChips from './content-chips';
import { useSetPageHeader } from '../ui/PageHeaderContext';

interface PhotoItem {
  id: string;
  storageKey: string;
  title?: string;
  uploadedAt?: string;
  authorDisplayName?: string;
}

interface PhotosPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: CurrentUser;
  initialPhotos: PhotoItem[];
  canCreate: boolean;
  isAdmin?: boolean;
}

const PhotosPage: React.FC<PhotosPageProps> = ({ tenant, user, initialPhotos, canCreate, isAdmin = false }) => {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos || []);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const setPageHeader = useSetPageHeader();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canCreate) {
      toast.error('You do not have permission to upload photos');
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenantId', tenant.id);
      fd.append('category', 'photos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        toast.error(err.message || 'Upload failed');
        return;
      }

      const data = await res.json();
      const created = data.mediaItem || {
        id: data.storageKey,
        storageKey: data.storageKey,
        title: file.name,
        uploadedAt: data.uploadedAt,
      };

      setPhotos((p) => [created as PhotoItem, ...p]);
      toast.success('Photo uploaded');
      if (inputRef.current) inputRef.current.value = '';
    } catch (error: any) {
      console.error('Upload error', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Set page header content in the site header
  useEffect(() => {
    setPageHeader({
      title: 'Photos',
      subtitle: `A gallery of recent photos for ${tenant.name}`,
      actions: canCreate ? (
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      ) : undefined,
    });
    
    // Clear header when component unmounts
    return () => setPageHeader(null);
  }, [canCreate, isUploading, tenant.name, setPageHeader]);

  useEffect(() => {
    setPhotos(initialPhotos || []);
  }, [initialPhotos]);

  const handleDelete = async (storageKey: string | null | undefined, id: string) => {
    if (!isAdmin) return;
    if (!confirm('Delete this photo? This action cannot be undone.')) return;

    try {
      // If there is a storageKey, attempt to delete the file first
      if (storageKey) {
        const res = await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storageKey, tenantId: tenant.id }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Delete failed' }));
          toast.error(err.message || 'Failed to delete photo file');
          return;
        }
      }

      // Always attempt to remove the media item record from the tenant gallery
      const dbRes = await fetch(`/api/tenants/${tenant.id}/photos/${id}`, {
        method: 'DELETE',
      });

      if (!dbRes.ok && dbRes.status !== 204) {
        const err = await dbRes.json().catch(() => ({ message: 'Failed to remove photo record' }));
        toast.error(err.message || 'Failed to remove photo record');
        return;
      }

      setPhotos((p) => p.filter((ph) => ph.id !== id));
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div>
      <ContentChips tenantId={tenant.id} active="Photos" />
      
      {/* Hidden file input - triggered by button in site header */}
      {canCreate && (
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} className="hidden" />
      )}

      {photos.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Photos Yet</h3>
          <p className="mt-1 text-sm text-gray-500">Upload photos to build your gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => {
            // Determine the image URL - Imgbb URLs are stored directly, local files need /storage/ prefix
            const imageUrl = photo.storageKey?.startsWith('http') 
              ? photo.storageKey 
              : `/storage/${photo.storageKey}`;
            
            return (
            <div key={photo.id} className="relative rounded bg-white shadow-sm">
              {isAdmin && (
                <button
                  aria-label="Delete photo"
                  onClick={() => handleDelete(photo.storageKey, photo.id)}
                  className="absolute z-10 top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 focus:outline-none"
                >
                  <span className="text-sm leading-none">−</span>
                </button>
              )}
              {photo.storageKey ? (
                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={imageUrl} alt={photo.title || 'Photo'} className="w-full h-auto max-h-64 object-contain" />
                </a>
              ) : (
                <div className="w-full max-h-64 flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                  No image available
                </div>
              )}
              <div className="p-2 text-xs text-gray-600">{photo.authorDisplayName}</div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

export default PhotosPage;
