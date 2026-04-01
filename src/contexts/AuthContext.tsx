import type { User } from "@/lib/api";
import type { ReactNode } from "react";
import { getToken, setToken, removeToken } from "@/lib/api";
import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setTokenState] = useState<string | null>(getToken);

  useEffect(() => {
    const handleExpiry = () => {
      removeToken();
      setTokenState(null);
      setUser(null);
    };
    window.addEventListener("auth-expired", handleExpiry);
    return () => window.removeEventListener("auth-expired", handleExpiry);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
