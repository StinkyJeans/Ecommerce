import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PATCH(req) {
  try {
    const { orderId, status } = await req.json();

    await connectDB();

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    return NextResponse.json({ message: "Order updated", order });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
