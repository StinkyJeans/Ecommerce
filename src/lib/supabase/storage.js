
import { createClient } from './client';
export async function uploadFile(file, bucket, path) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}
export async function uploadProductImage(file, sellerUsername) {
  const timestamp = Date.now();
  const fileName = `${sellerUsername}/${timestamp}-${file.name}`;
  const { url } = await uploadFile(file, 'product-images', fileName);
  return url;
}
export async function uploadUserAvatar(file, userId) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExtension}`;
  const { url } = await uploadFile(file, 'user-avatars', fileName);
  return url;
}
export async function uploadSellerId(file, userId) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/id-document.${fileExtension}`;
  const { url } = await uploadFile(file, 'seller-ids', fileName);
  return url;
}
export async function deleteFile(bucket, path) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
export function getPublicUrl(bucket, path) {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}
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
export function getImageUrl(url, bucket = null) {
  if (!url) return null;
  if (url.includes('edgestore.dev') || url.includes('files.edgestore.dev')) {
    return '/placeholder-image.jpg';
  }
  if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
    return url;
  }
  const isPublicUrl = url.includes('storage/v1/object/public/');
  if (bucket === 'product-images') {
    if (isPublicUrl) {
      return url;
    }
    const pathMatch = url.match(/product-images\/(.+?)(\?|$)/);
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      const baseUrlMatch = url.match(/(https?:\/\/[^\/]+)/);
      if (baseUrlMatch) {
        return `${baseUrlMatch[1]}/storage/v1/object/public/product-images/${filePath}`;
      }
    }
    return url;
  }
  if (url.includes('/product-images/') && isPublicUrl) {
    return url;
  }
  if (bucket && (bucket === 'seller-ids' || bucket === 'user-avatars')) {
    const params = new URLSearchParams({ url, bucket });
    return `/api/get-image?${params.toString()}`;
  }
  if (isPublicUrl) {
    return url;
  }
  if (url.includes('storage/v1/object/sign/')) {
    const params = new URLSearchParams({ url });
    if (bucket) {
      params.append('bucket', bucket);
    }
    return `/api/get-image?${params.toString()}`;
  }
  return url;
}