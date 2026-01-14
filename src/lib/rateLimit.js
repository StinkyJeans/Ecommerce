/**
 * Rate limiting utility
 * Disabled in development mode for easier testing
 * Uses in-memory LRU cache for tracking requests
 */

import { LRUCache } from 'lru-cache';

// Create LRU cache for rate limiting
// Max 500 entries, TTL of 1 hour
const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour
});

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  resetPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  addToCart: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
  },
  default: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Gets the client IP address from request
 * @param {Request} request - Next.js request object
 * @returns {string} - IP address
 */
function getClientIp(request) {
  // Try to get IP from headers (for production with proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback (may not work in all environments)
  return 'unknown';
}

/**
 * Creates a rate limit key from IP and optional identifier
 * @param {string} ip - Client IP address
 * @param {string} identifier - Optional identifier (email, username, etc.)
 * @param {string} endpoint - Endpoint name
 * @returns {string} - Rate limit key
 */
function createRateLimitKey(ip, identifier, endpoint) {
  if (identifier) {
    return `${endpoint}:${ip}:${identifier}`;
  }
  return `${endpoint}:${ip}`;
}

/**
 * Checks if request should be rate limited
 * @param {Request} request - Next.js request object
 * @param {string} endpoint - Endpoint name (login, register, etc.)
 * @param {string} identifier - Optional identifier for per-user rate limiting
 * @returns {{allowed: boolean, remaining: number, resetTime: number}|null} - Rate limit result or null if disabled
 */
export function checkRateLimit(request, endpoint = 'default', identifier = null) {
  // Disable rate limiting in development
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const ip = getClientIp(request);
  const key = createRateLimitKey(ip, identifier, endpoint);
  
  const now = Date.now();
  const record = rateLimitCache.get(key);
  
  if (!record) {
    // First request - create new record
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitCache.set(key, newRecord);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }
  
  // Check if window has expired
  if (now > record.resetTime) {
    // Reset the counter
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitCache.set(key, newRecord);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }
  
  // Increment counter
  record.count++;
  rateLimitCache.set(key, record);
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const allowed = record.count <= config.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Creates a rate limit error response
 * @param {number} resetTime - Time when rate limit resets (timestamp)
 * @returns {NextResponse} - 429 Too Many Requests response
 */
export function createRateLimitResponse(resetTime) {
  const resetDate = new Date(resetTime);
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  const response = NextResponse.json(
    {
      message: 'Too many requests',
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    },
    { status: 429 }
  );
  
  response.headers.set('Retry-After', retryAfter.toString());
  response.headers.set('X-RateLimit-Reset', resetDate.toISOString());
  
  return response;
}
