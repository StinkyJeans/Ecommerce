import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  const isProduction = process.env.NODE_ENV === 'production';

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", 
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  response.headers.set('X-Frame-Options', 'DENY');

  response.headers.set('X-Content-Type-Options', 'nosniff');

  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
  );

  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
