import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseAndVerifyBody } from "@/lib/signing";
import { handleError } from "@/lib/errors";
import { sendSellerApprovalEmail } from "@/lib/email/service";
export async function POST(req) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let userData = null;
    let userError = null;
    if (user.email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData && user.user_metadata?.username) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('username', user.user_metadata.username)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData) {
      return NextResponse.json({ 
        message: "User not found in database",
        error: userError?.message || "Unable to identify user"
      }, { status: 401 });
    }
    if (userData.role !== 'admin') {
      return NextResponse.json({ 
        message: "Forbidden: Admin access required",
        error: `User role is '${userData.role}', expected 'admin'`
      }, { status: 403 });
    }
    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const { sellerId, action } = body;
    if (!sellerId || !action) {
      return NextResponse.json({ 
        message: "sellerId and action are required" 
      }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ 
        message: "action must be 'approve' or 'reject'" 
      }, { status: 400 });
    }
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedSeller, error: updateError } = await supabase
      .from('users')
      .update({ seller_status: newStatus })
      .eq('id', sellerId)
      .eq('role', 'seller')
      .select()
      .single();
    if (updateError) {
      return handleError(updateError, 'approveSeller');
    }
    if (!updatedSeller) {
      return NextResponse.json({ 
        message: "Seller not found" 
      }, { status: 404 });
    }
    try {
      console.log('=== SELLER APPROVAL EMAIL DEBUG ===');
      console.log('Attempting to send approval email to:', updatedSeller.email);
      console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
      const userName = updatedSeller.display_name || updatedSeller.username || 'there';
      const emailResult = await sendSellerApprovalEmail({
        email: updatedSeller.email,
        userName,
        approved: action === 'approve'
      });
      console.log('Approval email sent successfully!');
      console.log('Email result:', JSON.stringify(emailResult, null, 2));
      if (!emailResult || !emailResult.id) {
        console.error('Email send returned no ID - email may not have been sent');
      }
    } catch (emailError) {
      console.error('=== FAILED TO SEND APPROVAL EMAIL ===');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Full error:', JSON.stringify(emailError, null, 2));
      console.warn('Approval/rejection succeeded but email failed');
    }
    return NextResponse.json({ 
      success: true,
      message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      seller: updatedSeller
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'approveSeller');
  }
}
