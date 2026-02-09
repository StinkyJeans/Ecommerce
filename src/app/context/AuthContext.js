"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authFunctions } from "@/lib/supabase/api";
import { setSigningKey, clearSigningKey, getSigningKey } from "@/lib/signing-client";

const AuthContext = createContext();

const CACHE_KEY_USERNAME = 'auth_username';
const CACHE_KEY_ROLE = 'auth_role';
const CACHE_KEY_EMAIL = 'auth_email';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; 

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { value, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
};

const setCachedData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
  } catch {

  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY_USERNAME);
    localStorage.removeItem(CACHE_KEY_ROLE);
    localStorage.removeItem(CACHE_KEY_EMAIL);
  } catch {

  }
};

export function AuthProvider({ children }) {
  // Always start with null – never show cached user until session is verified.
  // This prevents a previous user (e.g. admin) from appearing logged in for other visitors or after session expiry.
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Verify session first; only then show user or use cache. Prevents stale cache showing wrong user on deploy/shared devices.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const metadataUsername = session.user.user_metadata?.display_name || session.user.user_metadata?.username;
        const metadataRole = session.user.user_metadata?.role;

        if (metadataUsername) {
          setUsername(metadataUsername);
          setCachedData(CACHE_KEY_USERNAME, metadataUsername);
        }
        if (metadataRole) {
          setRole(metadataRole);
          setCachedData(CACHE_KEY_ROLE, metadataRole);
        }
        if (session.user.email) {
          setCachedData(CACHE_KEY_EMAIL, session.user.email);
        }

        if (metadataUsername && metadataRole) {
          setLoading(false);
          fetchUserData(session.user.email, true);
        } else {
          fetchUserData(session.user.email);
        }
      } else {
        clearCache();
        setUsername(null);
        setRole(null);
        setLoading(false);
      }
    }).catch(() => {
      clearCache();
      setUsername(null);
      setRole(null);
      setLoading(false);
    });

    // Fetch signing key in parallel (do not block UI)
    if (!getSigningKey()) {
      fetch('/api/signing-key', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => { if (d?.signingKey) setSigningKey(d.signingKey); })
        .catch(() => null);
    }

    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Only fetch signing key if not already cached
        if (!getSigningKey()) {
          fetch('/api/signing-key', { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => { if (d?.signingKey) setSigningKey(d.signingKey); })
            .catch(() => {});
        }

        const metadataUsername = session.user.user_metadata?.display_name || session.user.user_metadata?.username;
        const metadataRole = session.user.user_metadata?.role;

        // Use metadata immediately if available (faster than DB query)
        if (metadataUsername) {
          setUsername(metadataUsername);
          setCachedData(CACHE_KEY_USERNAME, metadataUsername);
        }
        if (metadataRole) {
          setRole(metadataRole);
          setCachedData(CACHE_KEY_ROLE, metadataRole);
        }
        if (session.user.email) {
          setCachedData(CACHE_KEY_EMAIL, session.user.email);
        }

        // If we have metadata, show it immediately and fetch fresh data in background
        if (metadataUsername && metadataRole) {
          setLoading(false);
          // Fetch in background to avoid blocking
          fetchUserData(session.user.email, true);
        } else {
          // Check if we have cached data to show immediately
          const cachedUsername = getCachedData(CACHE_KEY_USERNAME);
          const cachedRole = getCachedData(CACHE_KEY_ROLE);
          
          if (cachedUsername && cachedRole) {
            setLoading(false);
            // Refresh in background
            fetchUserData(session.user.email, true);
          } else {
            // No cache, need to fetch (this will set loading to false when done)
            fetchUserData(session.user.email);
          }
        }
      } else {
        clearCache();
        setRole(null);
        setUsername(null);
        setLoading(false);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);

  const fetchUserData = async (email, background = false) => {
    if (!supabase || !email) {
      if (!background) setLoading(false);
      return;
    }

    try {
      // Optimized query with only needed columns and using index
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, role')
        .eq('email', email.toLowerCase().trim()) // Normalize email for index lookup
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.error('Error fetching user data:', error);
        if (!background) setLoading(false);
        return;
      }

      if (userData) {
        // Only update if data is different to avoid unnecessary re-renders
        if (userData.username && userData.username !== username) {
          setUsername(userData.username);
          setCachedData(CACHE_KEY_USERNAME, userData.username);
        }
        if (userData.role && userData.role !== role) {
          setRole(userData.role);
          setCachedData(CACHE_KEY_ROLE, userData.role);
        }
        setCachedData(CACHE_KEY_EMAIL, email);
      }
    } catch (err) {
      console.error('Exception fetching user data:', err);
    } finally {
      if (!background) setLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    try {
      await authFunctions.logout();
    } catch (err) {

    }
    clearSigningKey();
    clearCache();
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
