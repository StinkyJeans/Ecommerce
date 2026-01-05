import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,         // buyer
      sellerUsername,   // seller
      productId,
      productName,
      price,
      quantity
    } = body;

    if (!username || !sellerUsername || !productId) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const totalAmount = price * quantity;

    const order = await Order.create({
      username,
      sellerUsername,
      productId,
      productName,
      price,
      quantity,
      totalAmount
    });

    return NextResponse.json({ message: "Order created", order });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
