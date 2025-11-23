"use client"

import React, { useRef, useState } from 'react';
import Button from './Button';
import { useToast } from './Toast';

interface ImageUploadProps {
    label: string;
    currentImageUrl?: string;
    onImageUrlChange: (url: string) => void;
    tenantId: string;
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
    tenantId,
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
            fd.append('tenantId', tenantId);
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
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isUploading}
                >
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
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
