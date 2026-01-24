
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { user: null, error: error || new Error('Not authenticated') };
    }
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}
export async function getUserData() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return { userData: null, error: authError || new Error('Not authenticated') };
    }
    const supabase = await createClient();
    let userData = null;
    let userError = null;
    if (user.email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role, seller_status')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (!userData && user.user_metadata?.username) {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role, seller_status')
        .eq('username', user.user_metadata.username)
        .maybeSingle();
      userData = data;
      userError = error;
    }
    if (userError && userError.code !== 'PGRST116') {
      return { userData: null, error: userError };
    }
    return { userData, error: null };
  } catch (error) {
    return { userData: null, error };
  }
}
export async function requireAuth() {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json(
      { message: "Unauthorized", error: "Authentication required" },
      { status: 401 }
    );
  }
  const { userData, error: userDataError } = await getUserData();
  if (userDataError || !userData) {
    return NextResponse.json(
      { message: "Unauthorized", error: "User data not found" },
      { status: 401 }
    );
  }
  return { user, userData };
}
export async function requireRole(requiredRole) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userData } = authResult;
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!roles.includes(userData.role)) {
    return NextResponse.json(
      { 
        message: "Forbidden", 
        error: `Access denied. Required role: ${roles.join(' or ')}, your role: ${userData.role}` 
      },
      { status: 403 }
    );
  }
  return authResult;
}
export async function verifyOwnership(resourceUsername) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user, userData } = authResult;
  const isOwner = 
    resourceUsername === userData.username ||
    resourceUsername === userData.email ||
    resourceUsername === user.email;
  if (!isOwner) {
    return NextResponse.json(
      { 
        message: "Forbidden", 
        error: "You do not have permission to access this resource" 
      },
      { status: 403 }
    );
  }
  return true;
}
export async function verifySellerOwnership(sellerUsername) {
  const authResult = await requireRole('seller');
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userData } = authResult;
  const isOwner = sellerUsername === userData.username;
  if (!isOwner) {
    return NextResponse.json(
      { 
        message: "Forbidden", 
        error: "You do not have permission to modify this product" 
      },
      { status: 403 }
    );
  }
  return true;
}