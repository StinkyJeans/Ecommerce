"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [sellerUsername, setSellerUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserData(session.user.email || session.user.user_metadata?.username);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.email || session.user.user_metadata?.username);
      } else {
        setRole(null);
        setUsername(null);
        setSellerUsername(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (emailOrUsername) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, role')
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .single();

      if (userData && !error) {
        setUsername(userData.username);
        setRole(userData.role);
        if (userData.role === 'seller') {
          setSellerUsername(userData.username);
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/logout", { method: "POST" });
    setRole(null);
    setUsername(null);
    setSellerUsername(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername, sellerUsername, setSellerUsername, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
