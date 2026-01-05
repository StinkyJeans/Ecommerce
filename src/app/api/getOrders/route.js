import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) return new Response(JSON.stringify({ orders: [] }), { status: 400 });

    await dbConnect();
    const orders = await Order.find({ username }).sort({ createdAt: -1 });

    return new Response(JSON.stringify({ orders }), { status: 200 });
  } catch (error) {
    console.error("Get orders error:", error);
    return new Response(JSON.stringify({ orders: [] }), { status: 500 });
  }
}
