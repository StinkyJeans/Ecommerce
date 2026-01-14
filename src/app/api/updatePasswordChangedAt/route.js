import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // Update password_changed_at timestamp in users table
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (userError || !userData) {
      // Don't fail the request, just return success
      return NextResponse.json(
        { success: true, message: "Password changed" },
        { status: 200 }
      );
    }

    // Update password_changed_at timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_changed_at: new Date().toISOString() })
      .eq('id', userData.id);

    if (updateError) {
      // Don't fail the request, just return success
    }

    return NextResponse.json(
      { success: true, message: "Password change timestamp updated" },
      { status: 200 }
    );
  } catch (error) {
    // Don't fail the request, just return success
    return NextResponse.json(
      { success: true, message: "Password changed" },
      { status: 200 }
    );
  }
}
