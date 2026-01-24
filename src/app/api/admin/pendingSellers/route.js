import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors";
export async function GET(req) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let userData = null;
    let userError = null;
    if (user.email) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData && user.user_metadata?.username) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('username', user.user_metadata.username)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData) {
      return NextResponse.json({ 
        message: "User not found in database",
        error: userError?.message || "Unable to identify user"
      }, { status: 401 });
    }
    if (userData.role !== 'admin') {
      return NextResponse.json({ 
        message: "Forbidden: Admin access required",
        error: `User role is '${userData.role}', expected 'admin'`
      }, { status: 403 });
    }
    const { data: pendingSellers, error } = await supabase
      .from('users')
      .select('id, username, email, contact, id_url, created_at')
      .eq('role', 'seller')
      .eq('seller_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      return handleError(error, 'getPendingSellers');
    }
    return NextResponse.json({ 
      success: true,
      pendingSellers: pendingSellers || []
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getPendingSellers');
  }
}