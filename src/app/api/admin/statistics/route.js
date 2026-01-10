import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Match user by email or username from metadata
    // Try email first, then username from metadata
    let userData = null;
    let userError = null;
    
    if (user.email) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    
    // If not found by email, try username from metadata
    if (!userData && user.user_metadata?.username) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('username', user.user_metadata.username)
        .maybeSingle();
      userData = data;
      userError = error;
    }

    if (!userData) {
      console.error("User not found in users table:", { email: user.email, username: user.user_metadata?.username });
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

    // Get user counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    const { count: totalSellers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller');

    const { count: approvedSellers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller')
      .eq('seller_status', 'approved');

    const { count: pendingSellers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller')
      .eq('seller_status', 'pending');

    // Get product count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get visit statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total visits (all time)
    const { count: totalVisits } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true });

    // Daily visits (last 30 days)
    const { data: dailyVisits, error: visitsError } = await supabase
      .from('website_visits')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Unique visitors (last 30 days) - count distinct visitor_ids
    const { data: uniqueVisitorsData } = await supabase
      .from('website_visits')
      .select('visitor_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('visitor_id', 'is', null);

    const uniqueVisitors = uniqueVisitorsData 
      ? new Set(uniqueVisitorsData.map(v => v.visitor_id)).size 
      : 0;

    // Page views by page (last 30 days)
    const { data: pageViewsData } = await supabase
      .from('website_visits')
      .select('page_path')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const pageViews = {};
    if (pageViewsData) {
      pageViewsData.forEach(visit => {
        pageViews[visit.page_path] = (pageViews[visit.page_path] || 0) + 1;
      });
    }

    // Process daily visits into date groups
    const dailyVisitsGrouped = {};
    if (dailyVisits) {
      dailyVisits.forEach(visit => {
        const date = new Date(visit.created_at).toISOString().split('T')[0];
        dailyVisitsGrouped[date] = (dailyVisitsGrouped[date] || 0) + 1;
      });
    }

    // Convert to array format for charts
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
    console.error("Statistics error:", err);
    return NextResponse.json({ 
      message: "Server error",
      error: err.message 
    }, { status: 500 });
  }
}
