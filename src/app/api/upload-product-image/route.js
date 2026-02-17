import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
export async function POST(req) {
  try {
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const supabase = await createClient();
    const formData = await req.formData();
    const file = formData.get('file');
    const sellerUsername = formData.get('sellerUsername');
    if (!file || !sellerUsername) {
      return NextResponse.json(
        { error: 'File and sellerUsername are required' },
        { status: 400 }
      );
    }
    if (userData.username !== sellerUsername && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: You can only upload images for your own account' },
        { status: 403 }
      );
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 }
      );
    }
    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }
    
    const timestamp = Date.now();
    const fileName = `${sellerUsername}/${timestamp}-${file.name}`;
    
    // Try using authenticated client first (respects RLS policies)
    // This should work since we've verified the user is a seller
    let uploadData, uploadError;
    
    if (supabase) {
      const result = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      uploadData = result.data;
      uploadError = result.error;
    }
    
    // If authenticated client fails, try admin client as fallback
    if (uploadError && (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS'))) {
      try {
        const adminClient = createSupabaseAdminClient();
        const result = await adminClient.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });
        uploadData = result.data;
        uploadError = result.error;
      } catch (adminError) {
        uploadError = adminError;
      }
    }
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      let errorMessage = `Failed to upload file: ${uploadError.message}`;
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
        errorMessage = 'Storage permission error. Please ensure you are logged in as an approved seller and that SUPABASE_SERVICE_ROLE_KEY is configured correctly.';
      }
      return NextResponse.json(
        { error: errorMessage, details: uploadError.message },
        { status: 500 }
      );
    }
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
