import { google } from 'googleapis';

/**
 * Gmail OAuth2 Token Manager
 * Handles OAuth2 authentication and token refresh for Gmail API
 */

let oauth2Client = null;
let accessToken = null;
let tokenExpiry = null;

/**
 * Initialize OAuth2 client with credentials
 */
function initializeOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  
  // Use production URL if available, otherwise fallback to localhost or custom redirect URI
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

  // Set the refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return oauth2Client;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getAccessToken() {
  // If we have a valid token, return it
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    // Refresh 1 minute before expiry
    return accessToken;
  }

  try {
    const client = initializeOAuth2Client();
    
    // Refresh the access token
    const { credentials } = await client.refreshAccessToken();
    
    accessToken = credentials.access_token;
    tokenExpiry = credentials.expiry_date || (Date.now() + 3600000); // Default to 1 hour if not provided
    
    console.log('✅ Gmail OAuth2 access token refreshed');
    
    return accessToken;
  } catch (error) {
    console.error('❌ Failed to refresh Gmail OAuth2 access token:', error);
    throw new Error('Failed to refresh Gmail OAuth2 token: ' + error.message);
  }
}

/**
 * Get OAuth2 authentication object for nodemailer
 */
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

/**
 * Generate OAuth2 authorization URL for initial setup
 * Use this to get the refresh token (one-time setup)
 */
export function getAuthUrl() {
  const client = initializeOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
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
