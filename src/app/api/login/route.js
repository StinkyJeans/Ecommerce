import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, role, email')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { message: "Invalid Username or Password" },
        { status: 401 }
      );
    }

    const email = userData.email || `${username}@temp.local`;
    
    console.log("Login attempt - Username:", username, "Using email:", email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
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
        return NextResponse.json(
          { 
            message: "Invalid Username or Password",
            error: authError.message 
          },
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

    console.log("Login successful for user:", userData.username);

    return NextResponse.json({
      message: "Login successful",
      role: userData.role || "user",
      username: userData.username,
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
