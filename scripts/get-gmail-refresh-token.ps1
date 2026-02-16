# Gmail OAuth2 Refresh Token Helper Script
# This script helps you get your Gmail refresh token

Write-Host "`n=== Gmail OAuth2 Refresh Token Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/gmail/authorize" -Method GET -ErrorAction Stop
    $serverRunning = $true
} catch {
    Write-Host "⚠️  Development server is not running!" -ForegroundColor Yellow
    Write-Host "Please start your server with: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, use Method 2 (Google OAuth2 Playground):" -ForegroundColor Cyan
    Write-Host "1. Go to: https://developers.google.com/oauthplayground/" -ForegroundColor White
    Write-Host "2. Click gear icon → Use your own OAuth credentials" -ForegroundColor White
    Write-Host "3. Enter your Client ID and Secret" -ForegroundColor White
    Write-Host "4. Select: Gmail API v1 → https://www.googleapis.com/auth/gmail.send" -ForegroundColor White
    Write-Host "5. Authorize and exchange code for tokens" -ForegroundColor White
    Write-Host "6. Copy the refresh_token" -ForegroundColor White
    exit
}

# Get authorization URL
Write-Host "📧 Getting authorization URL..." -ForegroundColor Cyan
try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/gmail/authorize" -Method GET
    $authUrl = $authResponse.authUrl
    
    Write-Host "✅ Authorization URL generated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy this URL and open it in your browser:" -ForegroundColor White
    Write-Host "   $authUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Sign in with your Gmail account and grant permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "3. After authorization, you'll be redirected to a callback URL" -ForegroundColor White
    Write-Host "   The URL will look like: http://localhost:3000/api/auth/gmail/callback?code=..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Copy the 'code' parameter from that URL" -ForegroundColor White
    Write-Host ""
    
    # Try to open browser automatically
    $openBrowser = Read-Host "Would you like to open the authorization URL in your browser? (Y/N)"
    if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
        Start-Process $authUrl
        Write-Host "✅ Browser opened!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "After you get the authorization code, paste it below:" -ForegroundColor Yellow
    $code = Read-Host "Authorization code"
    
    if ([string]::IsNullOrWhiteSpace($code)) {
        Write-Host "❌ No code provided. Exiting." -ForegroundColor Red
        exit
    }
    
    # Exchange code for tokens
    Write-Host ""
    Write-Host "🔄 Exchanging code for refresh token..." -ForegroundColor Cyan
    $body = @{
        code = $code
    } | ConvertTo-Json
    
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/gmail/callback" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host ""
    Write-Host "✅ Success! Here's your refresh token:" -ForegroundColor Green
    Write-Host ""
    Write-Host "Refresh Token:" -ForegroundColor Yellow
    Write-Host $tokenResponse.tokens.refresh_token -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Add this to your .env.local file:" -ForegroundColor Yellow
    Write-Host "GMAIL_REFRESH_TOKEN=$($tokenResponse.tokens.refresh_token)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Keep this token secure and never commit it to version control!" -ForegroundColor Red
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
