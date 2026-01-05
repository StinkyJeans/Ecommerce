import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Cart from "@/models/Cart";

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) return new Response(JSON.stringify({ success: false, message: "No username provided" }), { status: 400 });

    await dbConnect();

    // Fetch user's cart
    const userCart = await Cart.find({ username });
    if (!userCart.length) {
      return new Response(JSON.stringify({ success: false, message: "Cart is empty" }), { status: 400 });
    }

    // Create orders for each cart item
    const orders = userCart.map(item => ({
      username,
      sellerUsername: item.sellerUsername,
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      totalAmount: item.price * item.quantity,
      status: "not confirmed"
    }));

    await Order.insertMany(orders);

    // Clear the user's cart after checkout
    await Cart.deleteMany({ username });

    return new Response(JSON.stringify({ success: true, message: "Order created successfully" }), { status: 200 });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
}
