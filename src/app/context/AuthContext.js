"use client";

import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [sellerUsername, setSellerUsername] = useState(null);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername, sellerUsername, setSellerUsername , logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
