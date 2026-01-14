import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update password_changed_at timestamp in users table
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (userError || !userData) {
      console.error("Error finding user:", userError);
      // Don't fail the request, just log the error
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
      console.error("Error updating password_changed_at:", updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      { success: true, message: "Password change timestamp updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update password changed at error:", error);
    // Don't fail the request, just return success
    return NextResponse.json(
      { success: true, message: "Password changed" },
      { status: 200 }
    );
  }
}
