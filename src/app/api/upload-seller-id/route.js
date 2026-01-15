import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const email = formData.get('email'); // Use email as identifier for pending sellers

    if (!file || !email) {
      return NextResponse.json(
        { error: 'File and email are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
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

    // Use admin client to bypass RLS for uploads during registration
    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      return NextResponse.json(
        { error: 'Missing Supabase service role key. Please configure SUPABASE_SERVICE_ROLE_KEY in your environment variables.' },
        { status: 500 }
      );
    }
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${email}/id-document.${fileExtension}`;

    // Upload file using admin client
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('seller-ids')
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

    // For private buckets, we still get a public URL structure, but it needs to be accessed via signed URL
    // Store the full path for later signed URL generation
    const { data: urlData } = adminClient.storage
      .from('seller-ids')
      .getPublicUrl(uploadData.path);

    // Return the public URL structure (will be converted to signed URL when displayed)
    return NextResponse.json({
      url: urlData.publicUrl,
      path: uploadData.path,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
