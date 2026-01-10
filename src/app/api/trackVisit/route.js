import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { pagePath, visitorId, userAgent, ipAddress } = await req.json();

    if (!pagePath) {
      return NextResponse.json({ 
        message: "pagePath is required" 
      }, { status: 400 });
    }

    if (pagePath.startsWith('/admin')) {
      return NextResponse.json({ 
        success: true,
        message: "Admin pages are not tracked"
      }, { status: 200 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let userData = null;
      if (user.email) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();
        userData = data;
      }
      
      if (!userData && user.user_metadata?.username) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('username', user.user_metadata.username)
          .maybeSingle();
        userData = data;
      }

      if (userData && userData.role === 'admin') {
        return NextResponse.json({ 
          success: true,
          message: "Admin visits are not tracked"
        }, { status: 200 });
      }
    }

    const { error } = await supabase
      .from('website_visits')
      .insert({
        page_path: pagePath,
        visitor_id: visitorId || null,
        user_agent: userAgent || null,
        ip_address: ipAddress || null
      });

    if (error) {
      console.error("Error tracking visit:", error);
      return NextResponse.json({ 
        success: false,
        message: "Visit tracking failed",
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Visit tracked successfully"
    }, { status: 200 });
  } catch (err) {
    console.error("Track visit error:", err);
    return NextResponse.json({ 
      success: false,
      message: "Server error",
      error: err.message 
    }, { status: 500 });
  }
}
