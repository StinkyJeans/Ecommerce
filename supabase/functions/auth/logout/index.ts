import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, createCorsResponse } from '../_shared/cors.ts';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return createCorsResponse({
    success: true,
    message: 'Logged out successfully',
  });
});