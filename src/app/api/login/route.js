import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Find user by email only
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, seller_status, password_changed_at')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { message: "Invalid Email or Password" },
        { status: 401 }
      );
    }

    // Ensure we have an email for Supabase Auth
    if (!userData.email) {
      return NextResponse.json(
        { message: "User account does not have an email. Please contact support." },
        { status: 400 }
      );
    }

    if (userData.role === 'seller') {
      if (userData.seller_status === 'pending') {
        return NextResponse.json(
          { 
            message: "Waiting for admin approval",
            sellerStatus: "pending",
            details: "Your seller account is pending approval. Please wait for admin approval before logging in."
          },
          { status: 403 }
        );
      }
      
      if (userData.seller_status === 'rejected') {
        return NextResponse.json(
          { 
            message: "Seller account rejected",
            sellerStatus: "rejected",
            details: "Your seller account has been rejected. Please contact support for more information."
          },
          { status: 403 }
        );
      }
    }

    console.log("Login attempt - Email:", userData.email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password,
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            message: "Please confirm your email before logging in",
            error: authError.message 
          },
          { status: 401 }
        );
      }
      
      if (authError.message.includes('Invalid login credentials')) {
        // Check if password was recently changed
        const response = {
          message: "Invalid Email or Password",
          error: authError.message 
        };
        
        // If password was changed recently, include the timestamp
        if (userData?.password_changed_at) {
          response.passwordChangedAt = userData.password_changed_at;
        }
        
        return NextResponse.json(
          response,
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          message: "Login failed",
          error: authError.message,
          details: "Check server logs for more information"
        },
        { status: 401 }
      );
    }

    if (!authData.user) {
      console.error("No user returned from auth");
      return NextResponse.json(
        { message: "Login failed - no user data" },
        { status: 401 }
      );
    }

    console.log("Login successful for user:", userData.email);

    return NextResponse.json({
      message: "Login successful",
      role: userData.role || "user",
      user: authData.user
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      message: "Server error",
      error: error.message 
    }, { status: 500 });
  }
}
