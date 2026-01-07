import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ count: 0 });
    }
    
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('username', username);
    
    if (error) {
      console.error("Failed to fetch cart count:", error);
      return NextResponse.json({ count: 0 }, { status: 500 });
    }
    
    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    console.error("Failed to fetch cart count:", err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}