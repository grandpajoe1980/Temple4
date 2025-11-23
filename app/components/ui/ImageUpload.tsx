"use client"

import React, { useRef, useState } from 'react';
import Button from './Button';
import { useToast } from './Toast';

interface ImageUploadProps {
    label: string;
    currentImageUrl?: string;
    onImageUrlChange: (url: string) => void;
    /** Optional callback: receives mediaItem object when upload API creates a MediaItem record */
    onMediaItemCreated?: (mediaItem: any) => void;
    tenantId?: string;
    /** If true, the file picker will open automatically on mount */
    autoOpen?: boolean;
    category?: 'avatars' | 'photos' | 'media' | 'resources';
    accept?: string;
    disabled?: boolean;
    showPreview?: boolean;
    previewClassName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    label,
    currentImageUrl,
    onImageUrlChange,
    onMediaItemCreated,
    tenantId,
    autoOpen = false,
    category = 'photos',
    accept = 'image/*',
    disabled = false,
    showPreview = true,
    previewClassName = 'w-32 h-32 object-cover rounded-lg',
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const toast = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            if (tenantId) {
                fd.append('tenantId', tenantId);
            }
            fd.append('category', category);

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
            // Prefer the explicit URL returned by the upload API; fall back to constructing
            // the storage path for backward compatibility.
            const imageUrl = data?.url || (data?.storageKey ? `/storage/${data.storageKey}` : '');

            // If the upload API created a MediaItem record (for photos), notify caller
            if (data?.mediaItem && typeof onMediaItemCreated === 'function') {
                try {
                    onMediaItemCreated(data.mediaItem);
                } catch (e) {
                    console.warn('onMediaItemCreated callback failed', e);
                }
            }

            if (imageUrl) {
                onImageUrlChange(imageUrl);
            }
            toast.success('Image uploaded successfully');

            if (inputRef.current) inputRef.current.value = '';
        } catch (error: any) {
            console.error('Upload error', error);
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // Auto-open the file picker when requested
    // Auto-open the file picker when requested. Retry a few times if the
    // input element hasn't been attached to the ref yet when autoOpen flips
    // (common when the upload component is mounted and immediately asked to
    // open).
    const didAutoOpen = React.useRef(false);
    React.useEffect(() => {
        if (!autoOpen) {
            didAutoOpen.current = false;
            return;
        }

        if (didAutoOpen.current) return;

        let attempts = 6; // try for ~300ms (6 * 50ms)
        let mounted = true;

        const tryClick = () => {
            if (!mounted) return;
            if (inputRef.current) {
                didAutoOpen.current = true;
                // small timeout to avoid interfering with event handling
                setTimeout(() => inputRef.current?.click(), 10);
                return;
            }
            attempts -= 1;
            if (attempts > 0) {
                setTimeout(tryClick, 50);
            }
        };

        tryClick();

        return () => { mounted = false; };
    }, [autoOpen]);

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {showPreview && currentImageUrl && (
                <div className="flex items-center space-x-4">
                    <img
                        src={currentImageUrl}
                        alt={label}
                        className={previewClassName}
                    />
                </div>
            )}

            <div className="flex items-center space-x-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                    className="hidden"
                />
                {!autoOpen && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                )}
                {currentImageUrl && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onImageUrlChange('')}
                        disabled={disabled || isUploading}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
