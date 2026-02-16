import { NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/email/gmail-oauth2';

/**
 * POST /api/auth/gmail/callback
 * Exchanges authorization code for tokens
 * Body: { code: "authorization_code_from_google" }
 */
export async function POST(req) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({
        error: 'Authorization code required',
        message: 'Please provide the "code" parameter from the OAuth2 callback URL'
      }, { status: 400 });
    }

    const tokens = await getTokensFromCode(code);
    
    return NextResponse.json({
      success: true,
      message: 'Tokens received successfully! Add the refresh_token to your .env.local',
      tokens: {
        access_token: tokens.access_token ? '***' + tokens.access_token.slice(-10) : 'Not provided',
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer'
      },
      instructions: [
        '1. Copy the refresh_token value above',
        '2. Add it to your .env.local file:',
        '   GMAIL_REFRESH_TOKEN=your_refresh_token_here',
        '3. Make sure you also have:',
        '   GMAIL_CLIENT_ID=your_client_id',
        '   GMAIL_CLIENT_SECRET=your_client_secret',
        '   EMAIL_FROM=your_gmail_address@gmail.com',
        '4. Restart your development server',
        '5. Test email sending with /api/test-email'
      ],
      note: 'The refresh_token is long-lived and can be reused. Keep it secure!'
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({
      error: 'Failed to exchange authorization code',
      message: error.message,
      hint: 'Make sure the code hasn\'t expired (codes expire quickly). Try the authorization flow again.'
    }, { status: 500 });
  }
}
