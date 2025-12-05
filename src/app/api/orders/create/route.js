import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AddToCart from "@/models/AddToCart";

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export async function POST(req) {
  try {
    const { 
      username, 
      cartItems, 
      shippingAddress, 
      contactNumber 
    } = await req.json();

    if (!username || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { message: "Username and cart items are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const createdOrders = [];

    // Create an order for each cart item
    for (const item of cartItems) {
      const orderNumber = generateOrderNumber();
      const price = parseFloat(item.price);
      const totalAmount = price * item.quantity;

      // You need to add sellerUsername to your cart items or products
      // For now, I'll assume you have a way to identify the seller
      const order = await Order.create({
        orderNumber,
        username,
        sellerUsername: item.sellerUsername || "unknown", // You need to add this field
        productName: item.productName,
        description: item.description,
        price: item.price,
        idUrl: item.idUrl,
        quantity: item.quantity,
        totalAmount,
        status: "pending",
        shippingAddress,
        contactNumber,
      });

      createdOrders.push(order);
    }

    // Clear the user's cart after creating orders
    await AddToCart.deleteMany({ username });

    return NextResponse.json(
      { 
        message: "Orders created successfully", 
        orders: createdOrders 
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}