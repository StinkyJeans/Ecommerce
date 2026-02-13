import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeString, validateLength } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const rateLimitResult = checkRateLimit(req, 'publicRead');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
    const { pagePath, visitorId, userAgent, ipAddress } = await req.json();
    if (!pagePath) {
      return createValidationErrorResponse("pagePath is required");
    }
    const sanitizedPagePath = sanitizeString(pagePath, 500);
    if (!validateLength(sanitizedPagePath, 1, 500)) {
      return createValidationErrorResponse("Invalid page path");
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
        page_path: sanitizedPagePath,
        visitor_id: visitorId ? sanitizeString(visitorId, 100) : null,
        user_agent: userAgent ? sanitizeString(userAgent, 500) : null,
        ip_address: ipAddress ? sanitizeString(ipAddress, 50) : null
      });
    if (error) {
      return handleError(error, 'trackVisit');
    }
    return NextResponse.json({ 
      success: true,
      message: "Visit tracked successfully"
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'trackVisit');
  }
}