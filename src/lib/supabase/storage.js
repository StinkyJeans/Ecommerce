/**
 * Supabase Storage Utilities
 * Provides helper functions for file uploads and management
 */

import { createClient } from './client';

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path within the bucket (e.g., 'products/image.jpg' or '{userId}/avatar.jpg')
 * @returns {Promise<{url: string, path: string}>} - Public URL and path
 */
export async function uploadFile(file, bucket, path) {
  const supabase = createClient();

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Upload a product image
 * @param {File} file - Image file
 * @param {string} sellerUsername - Seller username for organizing files
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadProductImage(file, sellerUsername) {
  const timestamp = Date.now();
  const fileName = `${sellerUsername}/${timestamp}-${file.name}`;
  const { url } = await uploadFile(file, 'product-images', fileName);
  return url;
}

/**
 * Upload a user avatar
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadUserAvatar(file, userId) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExtension}`;
  const { url } = await uploadFile(file, 'user-avatars', fileName);
  return url;
}

/**
 * Upload a seller ID document
 * @param {File} file - Document file
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Public URL of uploaded document
 */
export async function uploadSellerId(file, userId) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/id-document.${fileExtension}`;
  const { url } = await uploadFile(file, 'seller-ids', fileName);
  return url;
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to file within bucket
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, path) {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get public URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to file within bucket
 * @returns {string} - Public URL
 */
export function getPublicUrl(bucket, path) {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for a private file (valid for specified seconds)
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to file within bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Get image URL (handles both public and private buckets)
 * For private buckets, uses API route to get signed URL
 * @param {string} url - Original image URL
 * @param {string} bucket - Optional bucket name for private images (e.g., 'seller-ids', 'user-avatars')
 * @returns {string} - Accessible image URL
 */
export function getImageUrl(url, bucket = null) {
  if (!url) return null;
  
  // If it's not a Supabase URL, return as-is
  if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
    return url;
  }

  // Check if it's a public bucket URL
  const isPublicUrl = url.includes('storage/v1/object/public/');
  
  // If bucket is specified as private, always use API route
  if (bucket && (bucket === 'seller-ids' || bucket === 'user-avatars')) {
    const params = new URLSearchParams({ url, bucket });
    return `/api/get-image?${params.toString()}`;
  }
  
  // If it's a public URL and no private bucket specified, return as-is
  if (isPublicUrl && !bucket) {
    return url;
  }

  // For signed URLs or when bucket is specified, use API route
  if (url.includes('storage/v1/object/sign/') || bucket) {
    const params = new URLSearchParams({ url });
    if (bucket) {
      params.append('bucket', bucket);
    }
    return `/api/get-image?${params.toString()}`;
  }

  // Default: return as-is (assume public)
  return url;
}
