import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

/**
 * Get image from Supabase Storage
 * Supports both public and private buckets
 * For private buckets, generates signed URLs
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    const bucket = searchParams.get('bucket'); // Optional: specify bucket name

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Check if it's a Supabase Storage URL
    const isSupabaseStorage = imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in');
    
    if (!isSupabaseStorage) {
      // For non-Supabase URLs, redirect to the URL
      return NextResponse.redirect(imageUrl);
    }

    // Extract bucket and path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=...
    let bucketName, filePath;

    // Try to match the standard Supabase Storage URL pattern
    const urlMatch = imageUrl.match(/storage\/v1\/object\/(public|sign)\/([^\/\?]+)\/(.+?)(\?|$)/);
    
    if (urlMatch) {
      const [, accessType, urlBucket, path] = urlMatch;
      bucketName = bucket || urlBucket;
      filePath = decodeURIComponent(path);

      // If it's already a public URL and bucket is public, redirect to it
      if (accessType === 'public' && !bucket) {
        // Assume public bucket - redirect directly
        return NextResponse.redirect(imageUrl);
      }
      
      // If bucket is specified and it's private, or if it's a sign URL, generate signed URL
      if (bucket && (bucket === 'seller-ids' || bucket === 'user-avatars')) {
        // This is a private bucket, generate signed URL
        bucketName = bucket;
      } else if (accessType === 'sign') {
        // Already a signed URL, but might be expired - regenerate
        bucketName = bucket || urlBucket;
      } else {
        // Public bucket, redirect
        return NextResponse.redirect(imageUrl);
      }
    } else {
      // URL doesn't match standard pattern - try to extract manually
      if (!bucket) {
        // Try to guess bucket from URL or default to product-images
        if (imageUrl.includes('seller-ids') || imageUrl.includes('seller_ids')) {
          bucketName = 'seller-ids';
        } else if (imageUrl.includes('user-avatars') || imageUrl.includes('user_avatars')) {
          bucketName = 'user-avatars';
        } else {
          bucketName = 'product-images'; // Default to public product images
        }
      } else {
        bucketName = bucket;
      }
      
      // Try to extract path from URL - look for pattern after bucket name
      const pathMatch = imageUrl.match(new RegExp(`${bucketName}/(.+?)(\\?|$)`));
      if (pathMatch) {
        filePath = decodeURIComponent(pathMatch[1]);
      } else {
        // Last resort: try to get everything after the last slash before query params
        const lastSlash = imageUrl.lastIndexOf('/');
        const queryStart = imageUrl.indexOf('?', lastSlash);
        if (lastSlash !== -1) {
          filePath = decodeURIComponent(imageUrl.substring(lastSlash + 1, queryStart !== -1 ? queryStart : undefined));
        } else {
          return NextResponse.json(
            { error: 'Could not extract file path from URL' },
            { status: 400 }
          );
        }
      }
    }

    // For private buckets or when bucket is specified, generate a signed URL
    const adminClient = createSupabaseAdminClient();

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate signed URL: ${error.message}` },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to get image' },
      { status: 500 }
    );
  }
}
