import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recursively sort object keys for stable JSON. Arrays and primitives are unchanged.
 * Client and server must use identical logic for canonical string consistency.
 */
export function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = sortObjectKeys(obj[k]);
  }
  return sorted;
}

/**
 * Build canonical string: method + "\n" + pathname + "\n" + sortedQuery + "\n" + timestamp + "\n" + bodyDigest
 * bodyDigest: SHA256(JSON.stringify(sortObjectKeys(body))) hex, or "" when no body.
 */
export function createCanonicalRequest(method, pathname, queryString, body, timestamp) {
  let bodyDigest = "";
  if (body != null && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    const json = JSON.stringify(sortObjectKeys(body));
    bodyDigest = crypto.createHash("sha256").update(json, "utf8").digest("hex");
  }
  return [method, pathname, queryString || "", timestamp, bodyDigest].join("\n");
}

/**
 * HMAC-SHA256 of canonical string with signing key (hex). Used for request signing.
 */
export function signRequest(canonical, signingKey) {
  return crypto
    .createHmac("sha256", Buffer.from(signingKey, "hex"))
    .update(canonical)
    .digest("hex");
}

/**
 * HMAC-SHA256 of response body string (for optional Phase 2 response signing).
 */
export function signResponse(bodyString, signingKey) {
  return crypto
    .createHmac("sha256", Buffer.from(signingKey, "hex"))
    .update(bodyString, "utf8")
    .digest("hex");
}

/**
 * Get signing_key for user from DB. Returns null if not found.
 */
export async function getSigningKeyForUser(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("signing_key")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data.signing_key;
}

/**
 * Return existing signing_key or create, save, and return a new one.
 */
export async function getOrCreateSigningKey(userId) {
  const existing = await getSigningKeyForUser(userId);
  if (existing) return existing;
  const key = crypto.randomBytes(32).toString("hex");
  const supabase = await createClient();
  await supabase.from("users").update({ signing_key: key }).eq("id", userId);
  return key;
}

/**
 * Always generate a new key, save to users, and return it. Used on login.
 */
export async function generateAndSaveSigningKey(userId) {
  const key = crypto.randomBytes(32).toString("hex");
  const supabase = await createClient();
  await supabase.from("users").update({ signing_key: key }).eq("id", userId);
  return key;
}

/**
 * Verify request signature. Uses pathname and sorted query from req.url.
 * @param {Request} req
 * @param {object|null} body - Parsed JSON body (or null for GET)
 * @param {string} userId
 * @returns {{ valid: true } | { valid: false, response: NextResponse }}
 */
export async function verifyRequestSignature(req, body, userId) {
  const signingKey = await getSigningKeyForUser(userId);
  if (!signingKey) {
    return { valid: false, response: NextResponse.json({ message: "Signing key not found. Please re-login." }, { status: 403 }) };
  }

  const signature = req.headers.get("X-Signature");
  const tsHeader = req.headers.get("X-Request-Timestamp");
  if (!signature || !tsHeader) {
    return { valid: false, response: NextResponse.json({ message: "Request signature required. Please refresh and log in again." }, { status: 403 }) };
  }

  const timestamp = parseInt(tsHeader, 10);
  if (Number.isNaN(timestamp) || Math.abs(Date.now() - timestamp) > 300_000) {
    return { valid: false, response: NextResponse.json({ message: "Invalid request signature" }, { status: 403 }) };
  }

  let pathname, queryString;
  try {
    const url = new URL(req.url);
    pathname = url.pathname;
    const params = [...url.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    queryString = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  } catch {
    return { valid: false, response: NextResponse.json({ message: "Invalid request signature" }, { status: 403 }) };
  }

  const canonical = createCanonicalRequest(req.method, pathname, queryString, body, tsHeader);
  const expected = signRequest(canonical, signingKey);

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, response: NextResponse.json({ message: "Invalid request signature" }, { status: 403 }) };
  }

  return { valid: true };
}

/**
 * Parse JSON body and verify signature. Use for POST/PUT/PATCH/DELETE with JSON body.
 * When raw body is empty, passes null to verify so bodyDigest is "" (matches client).
 * @returns {{ body: object, verifyError: null } | { body: null, verifyError: NextResponse }}
 */
export async function parseAndVerifyBody(req, userId) {
  const raw = await req.text();
  const body = raw ? JSON.parse(raw) : {};
  const result = await verifyRequestSignature(req, raw ? body : null, userId);
  if (!result.valid) return { body: null, verifyError: result.response };
  return { body, verifyError: null };
}
