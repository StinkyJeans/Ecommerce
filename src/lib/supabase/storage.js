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
  
  // Handle old EdgeStore URLs - return placeholder since EdgeStore is no longer used
  if (url.includes('edgestore.dev') || url.includes('files.edgestore.dev')) {
    return '/placeholder-image.jpg';
  }
  
  // If it's not a Supabase URL, return as-is (but not EdgeStore)
  if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
    return url;
  }

  // Check if it's a public bucket URL
  const isPublicUrl = url.includes('storage/v1/object/public/');
  
  // product-images is a public bucket - ALWAYS return the URL directly (no API route)
  // This check must happen FIRST before any other routing logic
  // For product-images, if it's a public URL, return it directly without any processing
  if (bucket === 'product-images') {
    // If it's already a public URL, return as-is immediately (most common case)
    if (isPublicUrl) {
      return url;
    }
    // If it's a signed URL for product-images, try to extract the public URL
    const pathMatch = url.match(/product-images\/(.+?)(\?|$)/);
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      // Extract the base URL (everything before /storage/)
      const baseUrlMatch = url.match(/(https?:\/\/[^\/]+)/);
      if (baseUrlMatch) {
        return `${baseUrlMatch[1]}/storage/v1/object/public/product-images/${filePath}`;
      }
    }
    // Fallback: return as-is
    return url;
  }
  
  // Also check if URL contains product-images path and is public (even if bucket not specified)
  if (url.includes('/product-images/') && isPublicUrl) {
    return url;
  }
  
  // If bucket is specified as private, always use API route
  if (bucket && (bucket === 'seller-ids' || bucket === 'user-avatars')) {
    const params = new URLSearchParams({ url, bucket });
    return `/api/get-image?${params.toString()}`;
  }
  
  // If it's a public URL and no private bucket specified, return as-is
  if (isPublicUrl) {
    return url;
  }

  // For signed URLs from private buckets, use API route
  if (url.includes('storage/v1/object/sign/')) {
    const params = new URLSearchParams({ url });
    if (bucket) {
      params.append('bucket', bucket);
    }
    return `/api/get-image?${params.toString()}`;
  }

  // Default: return as-is (assume public)
  return url;
}
