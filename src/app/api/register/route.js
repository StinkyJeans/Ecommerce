import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { username, password, role, email, contact, idUrl } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing user:", checkError);
      
      if (checkError.message && checkError.message.includes('schema cache')) {
        return NextResponse.json({ 
          error: "Database table not found. Please run the schema setup first.",
          details: "The 'users' table doesn't exist. Go to Supabase Dashboard → SQL Editor and run supabase/schema.sql"
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: "Error checking username availability" }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const authEmail = email || `${username}@temp.local`;

    if (email) {
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: password,
      options: {
        data: {
          username: username,
          role: role || "user"
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create authentication account" }, { status: 500 });
    }

    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error("Error auto-confirming user:", confirmError);
      } else {
        console.log("User auto-confirmed:", authData.user.id);
      }
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        email: authEmail,
        contact: contact || null,
        id_url: idUrl || null,
        role: role || "user"
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      
      if (userError.message && userError.message.includes('schema cache')) {
        return NextResponse.json({ 
          error: "Database table not found. Please run the schema setup first.",
          details: "The 'users' table doesn't exist. Go to Supabase Dashboard → SQL Editor and run supabase/schema.sql"
        }, { status: 500 });
      }
      
      if (userError.code === '23505') {
        if (userError.message.includes('username')) {
          return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }
        if (userError.message.includes('email')) {
          return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }
      }
      
      return NextResponse.json({ 
        error: "Failed to create user", 
        details: userError.message,
        code: userError.code 
      }, { status: 500 });
    }

    return NextResponse.json(
      { message: `${role === "seller" ? "Seller" : "User"} registered successfully` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
