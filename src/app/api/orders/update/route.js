import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PATCH(req) {
  try {
    const { orderId, status, sellerUsername } = await req.json();

    if (!orderId || !status || !sellerUsername) {
      return NextResponse.json(
        { message: "Order ID, status, and seller username are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "confirmed", "ready_to_ship", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the order, ensuring it belongs to this seller
    const order = await Order.findOneAndUpdate(
      { _id: orderId, sellerUsername },
      { status },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { message: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Order status updated successfully", order },
      { status: 200 }
    );
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}