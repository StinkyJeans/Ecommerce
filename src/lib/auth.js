/**
 * Authentication and authorization utilities using Supabase Auth
 * Provides helpers for verifying authentication, roles, and resource ownership
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Gets the authenticated user from Supabase
 * @returns {Promise<{user: object|null, error: Error|null}>} - User object and any error
 */
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

/**
 * Gets user data from the users table based on authenticated user's email
 * @returns {Promise<{userData: object|null, error: Error|null}>} - User data and any error
 */
export async function getUserData() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return { userData: null, error: authError || new Error('Not authenticated') };
    }
    
    const supabase = await createClient();
    
    // Try to find user by email first
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
    
    // If not found by email, try username from metadata
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

/**
 * Requires authentication - returns error response if not authenticated
 * @returns {Promise<{user: object, userData: object}|NextResponse>} - User objects or error response
 */
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

/**
 * Requires specific role - returns error response if user doesn't have the role
 * @param {string|string[]} requiredRole - Required role(s) ('admin', 'seller', 'user')
 * @returns {Promise<{user: object, userData: object}|NextResponse>} - User objects or error response
 */
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

/**
 * Verifies that the authenticated user owns the resource
 * Checks if username matches the authenticated user's username or email
 * @param {string} resourceUsername - Username from the resource
 * @returns {Promise<boolean|NextResponse>} - True if owned, or error response
 */
export async function verifyOwnership(resourceUsername) {
  const authResult = await requireAuth();
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { user, userData } = authResult;
  
  // Check if resource username matches authenticated user's username or email
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

/**
 * Verifies that the authenticated seller owns the product
 * @param {string} sellerUsername - Seller username from the product
 * @returns {Promise<boolean|NextResponse>} - True if owned, or error response
 */
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
