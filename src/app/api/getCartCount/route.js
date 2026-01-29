import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { handleError } from "@/lib/errors";
export async function GET(request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const verify = await verifyRequestSignature(request, null, userData.id);
    if (!verify.valid) return verify.response;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    let username = sanitizeString(searchParams.get('username'), 50);
    
    // If no username in query, use authenticated user's username
    if (!username) {
      username = userData.username;
    }
    
    if (!username) {
      return NextResponse.json({ count: 0 });
    }
    
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    
    // Use authenticated user's username to ensure consistency (case-insensitive)
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('username', userData.username);
    if (error) {
      return handleError(error, 'getCartCount');
    }
    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    return handleError(err, 'getCartCount');
  }
}