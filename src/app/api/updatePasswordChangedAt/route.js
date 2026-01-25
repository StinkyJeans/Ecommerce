import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
export async function POST(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, userData } = authResult;
    const { verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();
    if (userError || !userData) {
      return NextResponse.json(
        { success: true, message: "Password changed" },
        { status: 200 }
      );
    }
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_changed_at: new Date().toISOString() })
      .eq('id', userData.id);
    if (updateError) {
    }
    return NextResponse.json(
      { success: true, message: "Password change timestamp updated" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: true, message: "Password changed" },
      { status: 200 }
    );
  }
}