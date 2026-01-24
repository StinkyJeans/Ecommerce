import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../_shared/cors.ts';
import { sanitizeString, validateLength } from '../_shared/validation.ts';
import { handleAsyncError } from '../_shared/errors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return handleAsyncError(async () => {
    const { pagePath, visitorId, userAgent, ipAddress } = await req.json();
    if (!pagePath) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['pagePath is required'], success: false },
        400
      );
    }
    const sanitizedPagePath = sanitizeString(pagePath, 500);
    if (!validateLength(sanitizedPagePath, 1, 500)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Invalid page path'], success: false },
        400
      );
    }
    if (sanitizedPagePath.startsWith('/admin')) {
      return createCorsResponse({
        success: true,
        message: 'Admin pages are not tracked',
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let userData = null;
      if (user.email) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();
        userData = data;
      }
      if (!userData && user.user_metadata?.username) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('username', user.user_metadata.username)
          .maybeSingle();
        userData = data;
      }
      if (userData && userData.role === 'admin') {
        return createCorsResponse({
          success: true,
          message: 'Admin visits are not tracked',
        });
      }
    }
    const { error } = await supabase.from('website_visits').insert({
      page_path: sanitizedPagePath,
      visitor_id: visitorId ? sanitizeString(visitorId, 100) : null,
      user_agent: userAgent ? sanitizeString(userAgent, 500) : null,
      ip_address: ipAddress ? sanitizeString(ipAddress, 50) : null,
    });
    if (error) {
      return createCorsResponse(
        { message: 'Visit tracking failed', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      message: 'Visit tracked successfully',
    });
  });
});