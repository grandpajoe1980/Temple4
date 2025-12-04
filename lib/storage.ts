/**
 * File Upload & Storage Service (Phase F2)
 * 
 * Provides abstraction layer for file storage that can switch between:
 * - Local storage (development/small deployments)
 * - Cloud storage (production - AWS S3, Cloudflare R2, Vercel Blob)
 * - Imgbb (for images - free hosted solution)
 * 
 * This implementation uses:
 * - Imgbb for images (photos, avatars) - hosted externally
 * - Local storage for documents/media with the structure:
 *   public/uploads/[tenantId]/[category]/[filename]
 */

import { prisma } from './db';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Imgbb API configuration
 */
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Imgbb API response interface
 */
interface ImgbbResponse {
  data: {
    id: string;
    url: string;
    display_url: string;
    delete_url: string;
    thumb: {
      url: string;
    };
    medium?: {
      url: string;
    };
  };
  success: boolean;
  status: number;
}

/**
 * File upload category determines subdirectory and permissions
 */
export type FileCategory = 'media' | 'resources' | 'photos' | 'avatars';

/**
 * Allowed MIME types per category
 */
const ALLOWED_MIME_TYPES: Record<FileCategory, string[]> = {
  media: [
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
  ],
  resources: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  photos: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  avatars: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
};

/**
 * Maximum file size per category (in bytes)
 */
const MAX_FILE_SIZE: Record<FileCategory, number> = {
  media: 500 * 1024 * 1024, // 500 MB for videos/audio
  resources: 50 * 1024 * 1024, // 50 MB for documents
  photos: 10 * 1024 * 1024, // 10 MB for photos
  avatars: 5 * 1024 * 1024, // 5 MB for avatars
};

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  url: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  thumbUrl?: string;  // For Imgbb - thumbnail version
}

/**
 * Storage configuration
 */
interface StorageConfig {
  type: 'local' | 'cloud';
  localBasePath: string;
  publicUrlBase: string;
}

const config: StorageConfig = {
  type: 'local',
  localBasePath: path.join(process.cwd(), 'public', 'storage'),
  publicUrlBase: '/storage',
};

/**
 * Generate a unique filename to prevent collisions
 */
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
}

/**
 * Validate file type and size
 */
function validateFile(
  mimeType: string,
  fileSize: number,
  category: FileCategory
): void {
  // Check MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error(
      `Invalid file type. Allowed types for ${category}: ${allowedTypes.join(', ')}`
    );
  }

  // Check file size
  const maxSize = MAX_FILE_SIZE[category];
  if (fileSize > maxSize) {
    throw new Error(
      `File too large. Maximum size for ${category}: ${Math.round(maxSize / 1024 / 1024)} MB`
    );
  }
}

/**
 * Check if tenant has enough storage quota
 */
async function checkStorageQuota(
  tenantId: string,
  additionalBytes: number
): Promise<void> {
  // Get tenant settings
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    throw new Error('Tenant settings not found');
  }

  // Calculate current usage
  const currentUsage = await calculateTenantStorageUsage(tenantId);
  const maxStorageBytes = settings.maxStorageMB * 1024 * 1024;

  if (currentUsage + additionalBytes > maxStorageBytes) {
    const availableMB = Math.round((maxStorageBytes - currentUsage) / 1024 / 1024);
    throw new Error(
      `Storage quota exceeded. Available: ${availableMB} MB, Tenant limit: ${settings.maxStorageMB} MB`
    );
  }
}

/**
 * Calculate total storage used by a tenant (in bytes)
 */
async function calculateTenantStorageUsage(tenantId: string): Promise<number> {
  // Sum file sizes from MediaItem
  const mediaItems = await prisma.mediaItem.findMany({
    where: { tenantId, deletedAt: null },
    select: { fileSize: true },
  });

  // Sum file sizes from ResourceItem
  const resourceItems = await prisma.resourceItem.findMany({
    where: { tenantId },
    select: { fileSize: true },
  });

  const totalBytes = [
    ...mediaItems.map((item) => item.fileSize || 0),
    ...resourceItems.map((item) => item.fileSize || 0),
  ].reduce((sum, size) => sum + size, 0);

  return totalBytes;
}

/**
 * Upload image to Imgbb
 */
async function uploadToImgbb(
  buffer: Buffer,
  originalName: string
): Promise<{ url: string; thumbUrl: string; id: string }> {
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured. Please set IMGBB_API_KEY environment variable.');
  }

  // Convert buffer to base64
  const base64Image = buffer.toString('base64');

  // Create form data for Imgbb API
  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  formData.append('name', originalName.replace(/\.[^/.]+$/, '')); // Remove extension for name

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Imgbb upload failed:', errorText);
    throw new Error(`Failed to upload image to Imgbb: ${response.status}`);
  }

  const result: ImgbbResponse = await response.json();

  if (!result.success) {
    throw new Error('Imgbb upload failed: API returned success=false');
  }

  return {
    url: result.data.display_url, // Use display_url for direct image display
    thumbUrl: result.data.thumb.url,
    id: result.data.id,
  };
}

/**
 * Check if a category should use Imgbb (image categories)
 */
function shouldUseImgbb(category: FileCategory): boolean {
  return (category === 'photos' || category === 'avatars') && !!IMGBB_API_KEY;
}

/**
 * Upload a file to storage
 * 
 * @param tenantId - The tenant ID that owns this file
 * @param file - The file to upload (File or Blob)
 * @param category - File category (media, resources, photos, avatars)
 * @param originalName - Original filename
 * @returns UploadResult with URL and storage metadata
 */
export async function uploadFile(
  tenantId: string | undefined,
  file: Buffer,
  category: FileCategory,
  mimeType: string,
  originalName: string,
  ownerUserId?: string
): Promise<UploadResult> {
  const fileSize = file.length;

  // Validate file
  validateFile(mimeType, fileSize, category);

  // Check storage quota for tenant-scoped files only (skip for Imgbb - hosted externally)
  if (tenantId && !shouldUseImgbb(category)) {
    await checkStorageQuota(tenantId, fileSize);
  }

  // Use Imgbb for image uploads if configured
  if (shouldUseImgbb(category)) {
    const imgbbResult = await uploadToImgbb(file, originalName);
    
    // For Imgbb, we store the full URL directly - no local storage needed
    return {
      url: imgbbResult.url,
      storageKey: imgbbResult.url, // Store the full URL as the storage key
      mimeType,
      fileSize,
      uploadedAt: new Date(),
      thumbUrl: imgbbResult.thumbUrl,
    };
  }

  // Generate unique filename
  const filename = generateUniqueFilename(originalName);

  // Build storage key. If tenantId missing, store under users/{ownerUserId}
  const basePath = tenantId ? `${tenantId}/${category}` : `users/${ownerUserId ?? 'anonymous'}/${category}`;
  const storageKey = `${basePath}/${filename}`;

  // Local storage implementation
  if (config.type === 'local') {
    const fullPath = path.join(config.localBasePath, storageKey);
    const directory = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    // Return result
    return {
      url: `${config.publicUrlBase}/${storageKey}`,
      storageKey,
      mimeType,
      fileSize,
      uploadedAt: new Date(),
    };
  }

  // Cloud storage would be implemented here
  throw new Error('Cloud storage not yet implemented');
}

/**
 * Delete a file from storage
 * 
 * @param storageKey - The storage key of the file to delete
 * @returns true if deleted successfully, false if file not found
 */
export async function deleteFile(storageKey: string): Promise<boolean> {
  // Check if this is an Imgbb URL (hosted externally)
  if (storageKey.startsWith('https://i.ibb.co/') || storageKey.includes('imgbb.com')) {
    // Imgbb images are hosted externally - we just remove the reference
    // The image will remain on Imgbb (free tier doesn't support API deletion)
    console.log('Note: Imgbb-hosted image reference removed. Image remains on Imgbb servers.');
    return true;
  }

  if (config.type === 'local') {
    const fullPath = path.join(config.localBasePath, storageKey);

    try {
      await fs.unlink(fullPath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist
        return false;
      }
      throw error;
    }
  }

  // Cloud storage would be implemented here
  throw new Error('Cloud storage not yet implemented');
}

/**
 * Get a signed URL for a private file (useful for cloud storage)
 * For local storage, just returns the public URL
 * For Imgbb, the storageKey IS the URL
 * 
 * @param storageKey - The storage key
 * @param expiresIn - Expiration time in seconds (for cloud storage)
 * @returns URL to access the file
 */
export async function getSignedUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  // Imgbb URLs are already public and permanent
  if (storageKey.startsWith('https://i.ibb.co/') || storageKey.includes('imgbb.com')) {
    return storageKey;
  }

  if (config.type === 'local') {
    // Local files are publicly accessible
    return `${config.publicUrlBase}/${storageKey}`;
  }

  // Cloud storage signed URL would be implemented here
  throw new Error('Cloud storage not yet implemented');
}

/**
 * Check if a file exists in storage
 * 
 * @param storageKey - The storage key to check
 * @returns true if file exists
 */
export async function fileExists(storageKey: string): Promise<boolean> {
  // Imgbb URLs - assume they exist (hosted externally)
  if (storageKey.startsWith('https://i.ibb.co/') || storageKey.includes('imgbb.com')) {
    return true;
  }

  if (config.type === 'local') {
    const fullPath = path.join(config.localBasePath, storageKey);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  throw new Error('Cloud storage not yet implemented');
}

/**
 * Get tenant storage usage summary
 * 
 * @param tenantId - The tenant ID
 * @returns Storage usage in MB and percentage of quota
 */
export async function getTenantStorageInfo(tenantId: string): Promise<{
  usedMB: number;
  totalMB: number;
  percentUsed: number;
}> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    throw new Error('Tenant settings not found');
  }

  const usedBytes = await calculateTenantStorageUsage(tenantId);
  const usedMB = usedBytes / 1024 / 1024;
  const totalMB = settings.maxStorageMB;
  const percentUsed = (usedMB / totalMB) * 100;

  return {
    usedMB: Math.round(usedMB * 100) / 100,
    totalMB,
    percentUsed: Math.round(percentUsed * 100) / 100,
  };
}
