"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authFunctions } from "@/lib/supabase/api";

const AuthContext = createContext();

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserData(session.user.email);
      } else {
        setLoading(false);
      }
    });

    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.email);
      } else {
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

  const fetchUserData = async (email) => {
    if (!supabase || !email) {
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, role')
        .eq('email', email)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      if (userData) {
        setUsername(userData.username || null);
        setRole(userData.role || null);
      }
    } catch (err) {
      // Error fetching user data
    } finally {
      setLoading(false);
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
