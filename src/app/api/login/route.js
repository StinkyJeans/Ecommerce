import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Seller from "@/models/Seller";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    let account = await User.findOne({ username });
    let role = "user";

    if (!account) {
      account = await Seller.findOne({ username });
      role = "seller";
    }

    if (!account) {
      return NextResponse.json({ message: "Invalid Username or Password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid Username or Password" }, { status: 401 });
    }

    // ✅ No JWT, just return data
    return NextResponse.json({
      message: "Login successful",
      role,
      username: account.username,
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
