import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ 
        message: "Email is required" 
      }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ 
        message: "Supabase client not initialized" 
      }, { status: 500 });
    }

    // Check if email exists (case-insensitive)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (userError || !userData) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset email has been sent." 
      }, { status: 200 });
    }

    if (!userData.email) {
      return NextResponse.json({ 
        message: "This account does not have an email address. Please contact support." 
      }, { status: 400 });
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: resetUrl,
      }
    );

    if (resetError) {
      console.error("Password reset error:", resetError);
      return NextResponse.json({ 
        message: "Failed to send reset email. Please try again later." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "If an account with that email exists, a password reset email has been sent to your email address." 
    }, { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ 
      message: "Server error. Please try again later." 
    }, { status: 500 });
  }
}
