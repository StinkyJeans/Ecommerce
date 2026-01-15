import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { requireRole } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    // Require admin role
    const authResult = await requireRole(req, 'admin');
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { supabase } = authResult;

    // Try to use database function first
    const { data: statsData, error: functionError } = await supabase.rpc('get_admin_statistics');

    if (!functionError && statsData) {
      // Function returns TABLE, so it's an array - get first row
      const stats = Array.isArray(statsData) ? statsData[0] : statsData;
      if (stats) {
      return createCorsResponse({
        success: true,
        statistics: {
          totalUsers: stats.total_users || 0,
          totalSellers: stats.total_sellers || 0,
          totalProducts: stats.total_products || 0,
          totalOrders: stats.total_orders || 0,
          pendingSellers: stats.pending_sellers || 0,
          totalRevenue: stats.total_revenue || 0,
        },
      });
      }
    }

    // Fallback to manual queries
    const [
      { count: totalUsers },
      { count: totalSellers },
      { count: approvedSellers },
      { count: pendingSellers },
      { count: totalProducts },
      { count: totalOrders },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller')
        .eq('seller_status', 'approved'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller')
        .eq('seller_status', 'pending'),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed'),
    ]);

    const totalRevenue =
      revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;

    return createCorsResponse({
      success: true,
      statistics: {
        totalUsers: totalUsers || 0,
        totalSellers: approvedSellers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        pendingSellers: pendingSellers || 0,
        totalRevenue: totalRevenue,
      },
    });
  });
});
