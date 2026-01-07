import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: "Username is required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get orders error:", error);
      return NextResponse.json({ 
        message: "Server error", 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      orders: orders || [],
      count: orders?.length || 0 
    }, { status: 200 });
  } catch (err) {
    console.error("Get orders error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
