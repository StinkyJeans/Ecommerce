/**
 * Browser-only signing helpers (Web Crypto). Same canonical format and sortObjectKeys
 * as server (src/lib/signing.js) for consistency.
 */

let _key = null;

export function setSigningKey(k) {
  _key = k;
}

export function getSigningKey() {
  return _key;
}

export function clearSigningKey() {
  _key = null;
}

/**
 * Recursively sort object keys for stable JSON. Must match server's sortObjectKeys.
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

function hexToBuf(hex) {
  const buf = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buf[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return buf;
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Build canonical: method + "\n" + pathname + "\n" + sortedQuery + "\n" + timestamp + "\n" + bodyDigest.
 * bodyDigest: "" when no body; else SHA256(JSON.stringify(sortObjectKeys(body))) hex.
 */
export async function buildCanonicalRequest(method, url, body, timestamp) {
  const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  const pathname = u.pathname;
  const params = [...u.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const query = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

  let bodyDigest = "";
  if (body != null && body !== undefined && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    const json = JSON.stringify(sortObjectKeys(body));
    const data = new TextEncoder().encode(json);
    const hash = await crypto.subtle.digest("SHA-256", data);
    bodyDigest = bufToHex(hash);
  }

  return [method, pathname, query, timestamp, bodyDigest].join("\n");
}

/**
 * Sign canonical string with HMAC-SHA256. signingKey is hex.
 */
export async function signRequest(canonical, signingKey) {
  const key = await crypto.subtle.importKey("raw", hexToBuf(signingKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  return bufToHex(sig);
}
