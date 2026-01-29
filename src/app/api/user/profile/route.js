import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { handleError } from "@/lib/errors";

export async function GET(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;

    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("username, email, contact, display_name, password_changed_at")
      .eq("id", userData.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "Profile not found", error: error?.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fullName: data.display_name || data.username || "",
      email: data.email || "",
      phone: data.contact || "",
      passwordChangedAt: data.password_changed_at || null,
    });
  } catch (err) {
    return handleError(err, "user/profile");
  }
}
