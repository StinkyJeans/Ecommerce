import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password, role, email, contact, idUrl } = await req.json();

    await connectDB();

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user or seller depending on the role
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "user",   // 👈 defaults to user if no role passed
      email: email || null,
      contact: contact || null,
      idUrl: idUrl || null,
    });

    await newUser.save();

    return NextResponse.json(
      { message: `${role === "seller" ? "Seller" : "User"} registered successfully` },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
