import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { sellerId, action } = await req.json();

    if (!sellerId || !action) {
      return NextResponse.json({ 
        message: "sellerId and action are required" 
      }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ 
        message: "action must be 'approve' or 'reject'" 
      }, { status: 400 });
    }

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
      console.error("User not found in users table:", { email: user.email, username: user.user_metadata?.username });
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

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { data: updatedSeller, error: updateError } = await supabase
      .from('users')
      .update({ seller_status: newStatus })
      .eq('id', sellerId)
      .eq('role', 'seller')
      .select()
      .single();

    if (updateError) {
      console.error("Error updating seller status:", updateError);
      return NextResponse.json({ 
        message: "Failed to update seller status",
        error: updateError.message 
      }, { status: 500 });
    }

    if (!updatedSeller) {
      return NextResponse.json({ 
        message: "Seller not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      seller: updatedSeller
    }, { status: 200 });
  } catch (err) {
    console.error("Approve seller error:", err);
    return NextResponse.json({ 
      message: "Server error",
      error: err.message 
    }, { status: 500 });
  }
}
