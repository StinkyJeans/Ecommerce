import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Seller from "@/models/Seller";  // 👈 import Seller model
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    // 🧭 Check User collection first
    let account = await User.findOne({ username });
    let role = "user";

    // 🧭 If not found in User, check Seller
    if (!account) {
      account = await Seller.findOne({ username });
      role = "seller";
    }

    // ❌ No account found
    if (!account) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 🔐 Check password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 🪙 Create JWT
    const token = await new SignJWT({ id: account._id, role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(SECRET);

    const response = NextResponse.json({
      message: "Login successful",
      role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
