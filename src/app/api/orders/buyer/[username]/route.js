import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req, { params }) {
  try {
    const { username } = params;

    await connectDB();

    const orders = await Order.find({ username }).sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get buyer orders error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
