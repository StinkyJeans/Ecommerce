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
    const { userData } = authResult;
    const { verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const supabase = await createClient();
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