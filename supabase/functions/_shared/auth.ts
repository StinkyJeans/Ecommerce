
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'No authorization header' };
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }
  return { user, error: null };
}
export async function getUserData(supabase: any, email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, seller_status')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    return { userData: null, error };
  }
  return { userData: data, error: null };
}
export async function requireAuth(request: Request) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error || !user) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ message: 'Unauthorized', error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { userData, error: userDataError } = await getUserData(supabase, user.email!);
  if (userDataError || !userData) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ message: 'Unauthorized', error: 'User data not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return {
    authenticated: true,
    user,
    userData,
    supabase,
  };
}
export async function requireRole(request: Request, requiredRole: string | string[]) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!roles.includes(authResult.userData.role)) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({
          message: 'Forbidden',
          error: `Access denied. Required role: ${roles.join(' or ')}, your role: ${authResult.userData.role}`,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return authResult;
}