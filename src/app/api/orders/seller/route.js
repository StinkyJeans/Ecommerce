import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerUsername = searchParams.get("sellerUsername");
    const status = searchParams.get("status");

    if (!sellerUsername) {
      return NextResponse.json(
        { message: "Seller username is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query
    const query = { sellerUsername };
    if (status && status !== "all") {
      query.status = status;
    }

    // Fetch orders sorted by newest first
    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("Fetch seller orders error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}