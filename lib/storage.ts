/**
 * Storage Service - Abstraction layer for file uploads
 * 
 * Currently implements local file storage to public/uploads/
 * Can be extended to support cloud storage (S3, Cloudflare R2, Vercel Blob)
 */

import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export type StorageCategory = 'media' | 'resources' | 'avatars' | 'branding';

export interface UploadResult {
  url: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
}

export interface UploadOptions {
  tenantId: string;
  category: StorageCategory;
  file: File;
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}

// Storage configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE_MB = 50; // Default 50MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(tenantId: string, category: StorageCategory): Promise<string> {
  const dir = path.join(UPLOAD_DIR, tenantId, category);
  
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  return dir;
}

/**
 * Generate unique filename with extension
 */
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

/**
 * Validate file size and type
 */
function validateFile(
  file: File,
  maxSizeMB: number,
  allowedMimeTypes: string[]
): void {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
  
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
}

/**
 * Upload a file to storage
 * 
 * @param options - Upload configuration
 * @returns Upload result with URL and storage key
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const {
    tenantId,
    category,
    file,
    maxSizeMB = MAX_FILE_SIZE_MB,
    allowedMimeTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  // Validate file
  validateFile(file, maxSizeMB, allowedMimeTypes);

  // Ensure directory exists
  const uploadDir = await ensureUploadDir(tenantId, category);

  // Generate unique filename
  const fileName = generateFileName(file.name);
  const filePath = path.join(uploadDir, fileName);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write file
  await writeFile(filePath, buffer);

  // Generate storage key (relative path from public/)
  const storageKey = `uploads/${tenantId}/${category}/${fileName}`;
  
  // Generate public URL
  const url = `/${storageKey}`;

  return {
    url,
    storageKey,
    mimeType: file.type,
    fileSize: file.size,
  };
}

/**
 * Delete a file from storage
 * 
 * @param storageKey - Storage key returned from uploadFile
 * @returns true if deleted, false if not found
 */
export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    const filePath = path.join(process.cwd(), 'public', storageKey);
    
    if (!existsSync(filePath)) {
      return false;
    }
    
    await unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Check if tenant has reached storage quota
 * 
 * @param tenantId - Tenant ID
 * @param currentUsageMB - Current storage usage in MB
 * @param quotaMB - Storage quota in MB
 * @returns true if under quota
 */
export function checkStorageQuota(
  currentUsageMB: number,
  quotaMB: number
): boolean {
  return currentUsageMB < quotaMB;
}

/**
 * Get allowed MIME types for a category
 */
export function getAllowedMimeTypes(category: StorageCategory): string[] {
  switch (category) {
    case 'media':
      return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/mp3',
        'video/mp4',
      ];
    case 'resources':
      return [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg',
        'audio/mp3',
      ];
    case 'avatars':
    case 'branding':
      return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
    default:
      return DEFAULT_ALLOWED_TYPES;
  }
}
