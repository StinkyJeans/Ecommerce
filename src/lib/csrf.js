
import { cookies } from 'next/headers';
import crypto from 'crypto';
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}
export async function getCsrfToken() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  if (!token) {
    token = generateToken();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, 
      path: '/',
    });
  }
  return token;
}
export async function validateCsrfToken(request) {
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true };
  }
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  if (!cookieToken) {
    return { valid: false, error: 'CSRF token not found in cookies' };
  }
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    return { valid: false, error: 'CSRF token not found in headers' };
  }
  const isValid = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
  if (!isValid) {
    return { valid: false, error: 'CSRF token mismatch' };
  }
  return { valid: true };
}
export async function requireCsrfToken(request) {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(request.method)) {
    return null; 
  }
  const validation = await validateCsrfToken(request);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({
        message: 'CSRF validation failed',
        error: validation.error,
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  return null;
}