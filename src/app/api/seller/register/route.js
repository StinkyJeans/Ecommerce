import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Seller from "@/models/Seller";

export async function POST(req) {
  try {
    const { sellerUsername, password, email, contact, idUrl } = await req.json();

    if (!sellerUsername || !password || !email || !contact || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await Seller.findOne({ sellerUsername });
    if (existing) {
      return NextResponse.json({ message: "Username already taken" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Seller.create({
      sellerUsername,
      password: hashedPassword,
      email,
      contact,
      idUrl,
      role: "seller",
    });

    return NextResponse.json({ message: "Seller registered successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Seller register error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
