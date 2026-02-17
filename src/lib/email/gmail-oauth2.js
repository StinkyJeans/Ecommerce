import { google } from 'googleapis';

let oauth2Client = null;
let accessToken = null;
let tokenExpiry = null;

function initializeOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${siteUrl}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Gmail OAuth2 configuration missing. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in .env.local'
    );
  }

  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return oauth2Client;
}

export async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  try {
    const client = initializeOAuth2Client();
    const { credentials } = await client.refreshAccessToken();

    accessToken = credentials.access_token;
    tokenExpiry = credentials.expiry_date || (Date.now() + 3600000);
    
    console.log('✅ Gmail OAuth2 access token refreshed');
    
    return accessToken;
  } catch (error) {
    console.error('❌ Failed to refresh Gmail OAuth2 access token:', error);
    throw new Error('Failed to refresh Gmail OAuth2 token: ' + error.message);
  }
}

export async function getOAuth2Auth() {
  const accessToken = await getAccessToken();
  const client = initializeOAuth2Client();
  
  return {
    type: 'OAuth2',
    user: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    accessToken: accessToken
  };
}

export function getAuthUrl() {
  const client = initializeOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function getTokensFromCode(code) {
  const client = initializeOAuth2Client();
  
  try {
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('❌ Failed to exchange code for tokens:', error);
    throw new Error('Failed to exchange authorization code: ' + error.message);
  }
}
