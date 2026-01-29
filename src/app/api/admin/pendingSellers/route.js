import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRequestSignature } from "@/lib/signing";
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
        .select('id, role')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData && user.user_metadata?.username) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
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
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;
    
    // Get pending sellers - include both 'pending' status and NULL status (new registrations)
    // First try to get sellers with pending status
    const { data: pendingStatusSellers, error: pendingError } = await supabase
      .from('users')
      .select('id, username, email, contact, id_url, seller_status, created_at')
      .eq('role', 'seller')
      .eq('seller_status', 'pending')
      .order('created_at', { ascending: false });
    
    // Then get sellers with NULL status
    const { data: nullStatusSellers, error: nullError } = await supabase
      .from('users')
      .select('id, username, email, contact, id_url, seller_status, created_at')
      .eq('role', 'seller')
      .is('seller_status', null)
      .order('created_at', { ascending: false });
    
    // Combine results
    const pendingSellers = [
      ...(pendingStatusSellers || []),
      ...(nullStatusSellers || [])
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const error = pendingError || nullError;
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
