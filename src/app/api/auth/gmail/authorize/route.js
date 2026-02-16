import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/email/gmail-oauth2';

/**
 * GET /api/auth/gmail/authorize
 * Returns the OAuth2 authorization URL for Gmail setup
 * Visit this URL to authorize and get the refresh token
 */
export async function GET() {
  try {
    // Check if OAuth2 credentials are configured
    const hasClientId = !!process.env.GMAIL_CLIENT_ID;
    const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
    
    if (!hasClientId || !hasClientSecret) {
      return NextResponse.json({
        error: 'Gmail OAuth2 not configured',
        message: 'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local first',
        instructions: [
          '1. Go to https://console.cloud.google.com/',
          '2. Create a new project or select existing one',
          '3. Enable Gmail API',
          '4. Create OAuth 2.0 Client ID credentials',
          '5. Add authorized redirect URI: http://localhost:3000/api/auth/gmail/callback',
          '6. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local',
          '7. Visit this endpoint again to get authorization URL'
        ]
      }, { status: 400 });
    }

    const authUrl = getAuthUrl();
    
    return NextResponse.json({
      success: true,
      message: 'Visit the URL below to authorize Gmail access',
      authUrl: authUrl,
      instructions: [
        '1. Copy the authUrl above',
        '2. Open it in your browser',
        '3. Sign in with your Gmail account',
        '4. Grant permissions',
        '5. You will be redirected to a callback URL',
        '6. Copy the "code" parameter from the callback URL',
        '7. Use POST /api/auth/gmail/callback with the code to get your refresh token'
      ]
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
      message: error.message
    }, { status: 500 });
  }
}
