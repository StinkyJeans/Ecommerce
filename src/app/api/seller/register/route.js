import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { displayName, password, email, contact, idUrl } = await req.json();

    if (!displayName || !password || !email || !contact || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: displayName,
          role: "seller"
        }
      }
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error("Error auto-confirming seller:", confirmError);
      } else {
        console.log("Seller auto-confirmed:", authData.user.id);
      }
    }

    const { error: userError } = await supabase
      .from('users')
      .insert({
        username: displayName,
        email: email,
        contact: contact,
        id_url: idUrl,
        role: "seller",
        seller_status: "pending"
      });

    if (userError) {
      console.error("Error creating seller record:", userError);
      return NextResponse.json({ message: "Failed to create seller" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Seller registration successful!",
      details: "Your account is pending admin approval. You will be able to login and start selling once approved (usually within 24-48 hours)."
    }, { status: 201 });
  } catch (err) {
    console.error("Seller register error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
