import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRequestSignature } from "@/lib/signing";
import { handleError } from "@/lib/errors";
export async function GET(req) {
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
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;
    
    // Execute all count queries
    const [usersResult, sellersResult, approvedResult, pendingStatusResult, nullStatusResult] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller'),
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
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller')
        .is('seller_status', null)
    ]);
    
    const totalUsers = usersResult.count || 0;
    const totalSellers = sellersResult.count || 0;
    const approvedSellers = approvedResult.count || 0;
    const pendingSellers = (pendingStatusResult.count || 0) + (nullStatusResult.count || 0);
    // Get products count
    const productsResult = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    const totalProducts = productsResult.count || 0;
    
    // Get visits data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [visitsResult, dailyVisitsResult, uniqueVisitorsResult, pageViewsResult] = await Promise.all([
      supabase
        .from('website_visits')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('website_visits')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('website_visits')
        .select('visitor_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('visitor_id', 'is', null),
      supabase
        .from('website_visits')
        .select('page_path')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);
    
    const totalVisits = visitsResult.count || 0;
    const dailyVisits = dailyVisitsResult.data || [];
    const uniqueVisitorsData = uniqueVisitorsResult.data || [];
    const pageViewsData = pageViewsResult.data || [];
    
    const uniqueVisitors = uniqueVisitorsData.length > 0
      ? new Set(uniqueVisitorsData.map(v => v.visitor_id)).size 
      : 0;
    
    const pageViews = {};
    if (pageViewsData && pageViewsData.length > 0) {
      pageViewsData.forEach(visit => {
        if (visit.page_path) {
          pageViews[visit.page_path] = (pageViews[visit.page_path] || 0) + 1;
        }
      });
    }
    
    const dailyVisitsGrouped = {};
    if (dailyVisits && dailyVisits.length > 0) {
      dailyVisits.forEach(visit => {
        if (visit.created_at) {
          const date = new Date(visit.created_at).toISOString().split('T')[0];
          dailyVisitsGrouped[date] = (dailyVisitsGrouped[date] || 0) + 1;
        }
      });
    }
    const dailyVisitsArray = Object.entries(dailyVisitsGrouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({
      success: true,
      statistics: {
        users: {
          total: totalUsers || 0,
          sellers: {
            total: totalSellers || 0,
            approved: approvedSellers || 0,
            pending: pendingSellers || 0
          }
        },
        products: {
          total: totalProducts || 0
        },
        visits: {
          total: totalVisits || 0,
          uniqueLast30Days: uniqueVisitors,
          dailyLast30Days: dailyVisitsArray,
          pageViews: pageViews
        }
      }
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getStatistics');
  }
}
