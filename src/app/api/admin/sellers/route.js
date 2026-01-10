import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: sellers, error } = await supabase
      .from('users')
      .select('id, username, email, contact, id_url, seller_status, created_at')
      .eq('role', 'seller')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching sellers:", error);
      
      if (error.message && error.message.includes('seller_status')) {
        return NextResponse.json({ 
          success: false,
          message: "Database schema needs to be updated",
          error: "The seller_status column is missing. Please run the migration script.",
          migrationFile: "supabase/add-seller-status-column.sql",
          details: error.message,
          instructions: "Go to Supabase Dashboard → SQL Editor → Run the migration file"
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: false,
        message: "Failed to fetch sellers",
        error: error.message 
      }, { status: 500 });
    }

    const sellersWithStatus = (sellers || []).map(seller => ({
      ...seller,
      seller_status: seller.seller_status || null
    }));

    return NextResponse.json({ 
      success: true,
      sellers: sellersWithStatus || []
    }, { status: 200 });
  } catch (err) {
    console.error("Get sellers error:", err);
    return NextResponse.json({ 
      message: "Server error",
      error: err.message 
    }, { status: 500 });
  }
}
