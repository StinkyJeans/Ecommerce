import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { sellerUsername, password, email, contact, idUrl } = await req.json();

    if (!sellerUsername || !password || !email || !contact || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', sellerUsername)
      .single();

    if (existing) {
      return NextResponse.json({ message: "Username already taken" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: sellerUsername,
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
        username: sellerUsername,
        email: email,
        contact: contact,
        id_url: idUrl,
        role: "seller"
      });

    if (userError) {
      console.error("Error creating seller record:", userError);
      return NextResponse.json({ message: "Failed to create seller" }, { status: 500 });
    }

    return NextResponse.json({ message: "Seller registered successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Seller register error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
