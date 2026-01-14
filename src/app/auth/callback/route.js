import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email;
      const provider = data.user.app_metadata?.provider || "google";

      if (provider === "google" && email) {
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id, username, email, role")
          .eq("email", email)
          .maybeSingle();

        if (!existingUser && !userError) {
          const emailUsername = email.split("@")[0];
          const baseUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, "");
          let finalUsername = baseUsername || `user${Date.now()}`;
          let counter = 1;

          while (true) {
            const { data: checkUser } = await supabase
              .from("users")
              .select("username")
              .eq("username", finalUsername)
              .maybeSingle();

            if (!checkUser) {
              break;
            }
            finalUsername = `${baseUsername}${counter}`;
            counter++;
            if (counter > 1000) {
              finalUsername = `user${Date.now()}`;
              break;
            }
          }

          const { error: insertError } = await supabase
            .from("users")
            .insert({
              username: finalUsername,
              email: email,
              role: "user",
            });

          if (insertError) {
            // Error creating user record - log but continue
          }
        } else if (existingUser) {
          const userRole = existingUser.role || "user";
          if (userRole === "admin") {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
          } else if (userRole === "seller") {
            return NextResponse.redirect(new URL("/seller/dashboard", request.url));
          }
        }
      }
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
