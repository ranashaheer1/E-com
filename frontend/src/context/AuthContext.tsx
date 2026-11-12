"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { adminLoginRequest, loginRequest, registerRequest } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (password: string, email?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserProfile: (next: Partial<User> & Pick<User, "_id" | "name" | "email" | "role">) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistUser(next: User) {
  localStorage.setItem("unknown_token", next.token || localStorage.getItem("unknown_token") || "");
  localStorage.setItem(
    "unknown_user",
    JSON.stringify({
      _id: next._id,
      name: next.name,
      email: next.email,
      role: next.role,
      phone: next.phone || "",
      avatar: next.avatar || "",
      bio: next.bio || "",
      token: next.token,
    })
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("unknown_user");
      const token = localStorage.getItem("unknown_token");
      if (raw && token) {
        setUser(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem("unknown_user");
      localStorage.removeItem("unknown_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (next: User) => {
    persistUser(next);
    setUser(next);
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    persist(data);
  }, []);

  const adminLogin = useCallback(async (password: string, email?: string) => {
    const data = await adminLoginRequest(password, email);
    persist(data);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await registerRequest(name, email, password);
    persist(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("unknown_token");
    localStorage.removeItem("unknown_user");
    setUser(null);
  }, []);

  const setUserProfile = useCallback(
    (next: Partial<User> & Pick<User, "_id" | "name" | "email" | "role">) => {
      const merged: User = {
        ...(user || next),
        ...next,
        token: next.token || user?.token || localStorage.getItem("unknown_token") || undefined,
      };
      persistUser(merged);
      setUser(merged);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      adminLogin,
      register,
      logout,
      setUserProfile,
    }),
    [user, loading, login, adminLogin, register, logout, setUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
