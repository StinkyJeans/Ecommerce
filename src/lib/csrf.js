/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 * Generates and validates CSRF tokens for state-changing operations
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generates a secure random CSRF token
 * @returns {string} - CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gets or creates a CSRF token for the current session
 * @returns {Promise<string>} - CSRF token
 */
export async function getCsrfToken() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!token) {
    token = generateToken();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }
  
  return token;
}

/**
 * Validates CSRF token from request
 * @param {Request} request - Next.js request object
 * @returns {Promise<{valid: boolean, error?: string}>} - Validation result
 */
export async function validateCsrfToken(request) {
  // Skip CSRF validation in development for easier testing
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true };
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!cookieToken) {
    return { valid: false, error: 'CSRF token not found in cookies' };
  }
  
  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  if (!headerToken) {
    return { valid: false, error: 'CSRF token not found in headers' };
  }
  
  // Compare tokens using constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
  
  if (!isValid) {
    return { valid: false, error: 'CSRF token mismatch' };
  }
  
  return { valid: true };
}

/**
 * Middleware to validate CSRF token for state-changing operations
 * @param {Request} request - Next.js request object
 * @returns {Promise<Response|null>} - Error response if invalid, null if valid
 */
export async function requireCsrfToken(request) {
  // Only validate for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(request.method)) {
    return null; // No CSRF check needed for GET requests
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
