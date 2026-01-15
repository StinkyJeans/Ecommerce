"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authFunctions } from "@/lib/supabase/api";

const AuthContext = createContext();

// Cache keys for localStorage
const CACHE_KEY_USERNAME = 'auth_username';
const CACHE_KEY_ROLE = 'auth_role';
const CACHE_KEY_EMAIL = 'auth_email';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for cache
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
    // Ignore localStorage errors
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY_USERNAME);
    localStorage.removeItem(CACHE_KEY_ROLE);
    localStorage.removeItem(CACHE_KEY_EMAIL);
  } catch {
    // Ignore localStorage errors
  }
};

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Try to load from cache first for instant display
    const cachedUsername = getCachedData(CACHE_KEY_USERNAME);
    const cachedRole = getCachedData(CACHE_KEY_ROLE);
    const cachedEmail = getCachedData(CACHE_KEY_EMAIL);

    if (cachedUsername && cachedRole) {
      setUsername(cachedUsername);
      setRole(cachedRole);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // First, try to get username from user_metadata (instant, no DB query)
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

        // If we have metadata, we can skip the DB query for faster loading
        if (metadataUsername && metadataRole) {
          setLoading(false);
          // Still fetch from DB in background to ensure sync, but don't block UI
          fetchUserData(session.user.email, true);
        } else {
          // Fallback to DB if metadata is missing
          fetchUserData(session.user.email);
        }
      } else {
        clearCache();
        setLoading(false);
      }
    });

    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Try metadata first
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
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, role')
        .eq('email', email)
        .single();

      if (error) {
        if (!background) setLoading(false);
        return;
      }

      if (userData) {
        setUsername(userData.username || null);
        setRole(userData.role || null);
        // Update cache
        if (userData.username) setCachedData(CACHE_KEY_USERNAME, userData.username);
        if (userData.role) setCachedData(CACHE_KEY_ROLE, userData.role);
        setCachedData(CACHE_KEY_EMAIL, email);
      }
    } catch (err) {
      // Error fetching user data
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
      // Logout error - continue anyway
    }
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
