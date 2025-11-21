/**
 * File Upload & Storage Service (Phase F2)
 * 
 * Provides abstraction layer for file storage that can switch between:
 * - Local storage (development/small deployments)
 * - Cloud storage (production - AWS S3, Cloudflare R2, Vercel Blob)
 * 
 * This implementation uses local storage with the structure:
 * public/uploads/[tenantId]/[category]/[filename]
 */

import { prisma } from './db';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

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
 * Upload a file to storage
 * 
 * @param tenantId - The tenant ID that owns this file
 * @param file - The file to upload (File or Blob)
 * @param category - File category (media, resources, photos, avatars)
 * @param originalName - Original filename
 * @returns UploadResult with URL and storage metadata
 */
export async function uploadFile(
  tenantId: string,
  file: Buffer,
  category: FileCategory,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  const fileSize = file.length;

  // Validate file
  validateFile(mimeType, fileSize, category);

  // Check storage quota
  await checkStorageQuota(tenantId, fileSize);

  // Generate unique filename
  const filename = generateUniqueFilename(originalName);

  // Build storage key
  const storageKey = `${tenantId}/${category}/${filename}`;

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
 * 
 * @param storageKey - The storage key
 * @param expiresIn - Expiration time in seconds (for cloud storage)
 * @returns URL to access the file
 */
export async function getSignedUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
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
