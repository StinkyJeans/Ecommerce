
import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60, 
});

const isProduction = process.env.NODE_ENV === 'production';

// Production limits (strict)
const PROD_RATE_LIMITS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, 
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, 
  },
  resetPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, 
  },
  addToCart: {
    maxRequests: 50,
    windowMs: 60 * 1000, 
  },
  publicRead: {
    maxRequests: 200,
    windowMs: 60 * 1000,
  },
  default: {
    maxRequests: 100,
    windowMs: 60 * 1000, 
  },
};

// Development limits (relaxed for testing)
const DEV_RATE_LIMITS = {
  login: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
  },
  register: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  resetPassword: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  addToCart: {
    maxRequests: 200,
    windowMs: 60 * 1000,
  },
  publicRead: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },
  default: {
    maxRequests: 500,
    windowMs: 60 * 1000,
  },
};

const RATE_LIMITS = isProduction ? PROD_RATE_LIMITS : DEV_RATE_LIMITS;
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
function createRateLimitKey(ip, identifier, endpoint) {
  if (identifier) {
    return `${endpoint}:${ip}:${identifier}`;
  }
  return `${endpoint}:${ip}`;
}
export function checkRateLimit(request, endpoint = 'default', identifier = null) {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const ip = getClientIp(request);
  const key = createRateLimitKey(ip, identifier, endpoint);
  const now = Date.now();
  const record = rateLimitCache.get(key);
  if (!record) {
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
  if (now > record.resetTime) {
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
