import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function POST(req) {
  try {
    // Authentication check - must be seller
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;

    const formData = await req.formData();
    const file = formData.get('file');
    const sellerUsername = formData.get('sellerUsername');

    if (!file || !sellerUsername) {
      return NextResponse.json(
        { error: 'File and sellerUsername are required' },
        { status: 400 }
      );
    }

    // Verify ownership - seller can only upload for their own account
    if (userData.username !== sellerUsername && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: You can only upload images for your own account' },
        { status: 403 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for authenticated sellers
    const adminClient = createSupabaseAdminClient();
    
    const timestamp = Date.now();
    const fileName = `${sellerUsername}/${timestamp}-${file.name}`;

    // Upload file using admin client
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL (product-images is a public bucket)
    const { data: urlData } = adminClient.storage
      .from('product-images')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload product image' },
      { status: 500 }
    );
  }
}
