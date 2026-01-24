import { NextResponse } from "next/server";
import { sendPasswordResetEmail, sendSellerWelcomeEmail, sendSellerApprovalEmail } from "@/lib/email/service";
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'password-reset';
  if (!email) {
    return NextResponse.json({ 
      error: 'Email parameter required',
      usage: '/api/test-email-service?email=test@example.com&type=password-reset|seller-welcome|seller-approval'
    }, { status: 400 });
  }
  try {
    console.log('=== TESTING EMAIL SERVICE FUNCTION ===');
    console.log('Email:', email);
    console.log('Type:', type);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('SMTP_USER present:', !!process.env.SMTP_USER);
    console.log('SMTP_PASS present:', !!process.env.SMTP_PASS);
    let result;
    switch (type) {
      case 'password-reset':
        result = await sendPasswordResetEmail({
          email,
          userName: 'Test User',
          resetUrl: 'https://example.com/reset?token=test123',
          expiryTime: '1 hour'
        });
        break;
      case 'seller-welcome':
        result = await sendSellerWelcomeEmail({
          email,
          userName: 'Test Seller'
        });
        break;
      case 'seller-approval':
        result = await sendSellerApprovalEmail({
          email,
          userName: 'Test Seller',
          approved: true
        });
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid type. Use: password-reset, seller-welcome, or seller-approval'
        }, { status: 400 });
    }
    const isEthereal = process.env.NODE_ENV === 'development' && !process.env.SMTP_USER;
    return NextResponse.json({
      success: true,
      message: `Email service function (${type}) executed successfully`,
      result: result,
      messageId: result?.id || result?.messageId,
      mode: isEthereal ? 'Ethereal (Development)' : 'SMTP (Production)',
      note: isEthereal 
        ? 'Email captured in Ethereal. Check console for preview URL.'
        : 'Email sent via SMTP. Check your inbox (and spam folder).'
    });
  } catch (error) {
    console.error('Email service function error:', error);
    return NextResponse.json({
      error: 'Email service function failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}