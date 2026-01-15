import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors, createCorsResponse } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authResult = await requireRole(req, 'admin');
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { sellerId, action } = await req.json();

    if (!sellerId || !action) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['sellerId and action are required'], success: false },
        400
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return createCorsResponse(
        { message: 'Validation failed', errors: ["action must be 'approve' or 'reject'"], success: false },
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: updatedSeller, error: updateError } = await supabase
      .from('users')
      .update({ seller_status: newStatus })
      .eq('id', sellerId)
      .eq('role', 'seller')
      .select()
      .single();

    if (updateError) {
      return createCorsResponse(
        { message: 'Failed to update seller status', success: false },
        500
      );
    }

    if (!updatedSeller) {
      return createCorsResponse(
        { message: 'Seller not found', success: false },
        404
      );
    }

    return createCorsResponse({
      success: true,
      message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      seller: updatedSeller,
    });
  } catch (error) {
    return createCorsResponse(
      { message: 'Server error', success: false },
      500
    );
  }
});
