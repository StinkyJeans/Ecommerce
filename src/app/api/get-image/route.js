import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    const bucket = searchParams.get('bucket'); 

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    if (imageUrl.includes('edgestore.dev') || imageUrl.includes('files.edgestore.dev')) {
      return NextResponse.redirect('/placeholder-image.jpg');
    }
    const isSupabaseStorage = imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in');
    if (!isSupabaseStorage) {
      return NextResponse.redirect(imageUrl);
    }
    let bucketName, filePath;
    const urlMatch = imageUrl.match(/storage\/v1\/object\/(public|sign)\/([^\/\?]+)\/(.+?)(\?|$)/);
    if (urlMatch) {
      const [, accessType, urlBucket, path] = urlMatch;
      bucketName = bucket || urlBucket;
      filePath = decodeURIComponent(path);
      if (accessType === 'public' && !bucket) {
        return NextResponse.redirect(imageUrl);
      }
      if (bucket && (bucket === 'seller-ids' || bucket === 'user-avatars')) {
        bucketName = bucket;
      } else if (accessType === 'sign') {
        bucketName = bucket || urlBucket;
      } else {
        return NextResponse.redirect(imageUrl);
      }
    } else {
      if (!bucket) {
        if (imageUrl.includes('seller-ids') || imageUrl.includes('seller_ids')) {
          bucketName = 'seller-ids';
        } else if (imageUrl.includes('user-avatars') || imageUrl.includes('user_avatars')) {
          bucketName = 'user-avatars';
        } else {
          bucketName = 'product-images'; 
        }
      } else {
        bucketName = bucket;
      }
      const pathMatch = imageUrl.match(new RegExp(`${bucketName}/(.+?)(\\?|$)`));
      if (pathMatch) {
        filePath = decodeURIComponent(pathMatch[1]);
      } else {
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
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); 

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate signed URL: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to get image' },
      { status: 500 }
    );
  }
}