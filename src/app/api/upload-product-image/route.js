import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

// Configure route to handle larger file uploads
export const maxDuration = 60; // 60 seconds
export const runtime = 'nodejs';

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
    
    // Use authenticated seller's client - we've already verified they're a seller
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      let errorMessage = `Failed to upload file: ${uploadError.message}`;
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
        errorMessage = 'Storage permission error. Please ensure you are logged in as an approved seller. If the issue persists, check that the RLS policies are correctly configured.';
      }
      return NextResponse.json(
        { error: errorMessage, details: uploadError.message },
        { status: 500 }
      );
    }
    
    // Get public URL using the authenticated client
    const { data: urlData } = supabase.storage
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
