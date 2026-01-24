import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { sanitizeString } from "@/lib/validation";
import { handleError } from "@/lib/errors";
export async function GET(request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const username = sanitizeString(searchParams.get('username'), 50);
    if (!username) {
      return NextResponse.json({ count: 0 });
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('username', username);
    if (error) {
      return handleError(error, 'getCartCount');
    }
    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    return handleError(err, 'getCartCount');
  }
}