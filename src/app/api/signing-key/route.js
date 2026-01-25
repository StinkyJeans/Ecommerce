import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateSigningKey } from "@/lib/signing";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const key = await getOrCreateSigningKey(auth.userData.id);
  return NextResponse.json({ signingKey: key });
}
