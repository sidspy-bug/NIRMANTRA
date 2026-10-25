"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "General Public" | "Inspecting Officer" | "Supervisor";

export interface UserProfile {
  name: string;
  userId: string;
  role: UserRole;
  department: string;
  email: string;
  contactNumber: string;
  avatarUrl?: string;
  accountStatus: "Active" | "Demo Session";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updated: Partial<Pick<UserProfile, "name" | "email" | "contactNumber">>) => void;
}

const DEFAULT_PROFILES: Record<UserRole, UserProfile> = {
  "General Public": {
    name: "Rajesh Kumar",
    userId: "GP-2026-8812",
    role: "General Public",
    department: "Citizen Services",
    email: "rajesh.kumar@example.com",
    contactNumber: "Not provided",
    accountStatus: "Demo Session",
  },
  "Inspecting Officer": {
    name: "Arjun Sharma",
    userId: "IO-2026-0178",
    role: "Inspecting Officer",
    department: "Building Safety Department",
    email: "arjun.sharma@example.com",
    contactNumber: "Not provided",
    accountStatus: "Demo Session",
  },
  "Supervisor": {
    name: "Dr. Anita Desai",
    userId: "SP-2026-0042",
    role: "Supervisor",
    department: "Zonal Scrutiny Directorate",
    email: "anita.desai@ncr.gov.in",
    contactNumber: "Not provided",
    accountStatus: "Demo Session",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "nirmaantra_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load auth session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Protect routes: If unauthenticated and not on /login or /splash, redirect to /login
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ["/login", "/splash"];
      if (!user && !publicPaths.includes(pathname)) {
        router.push("/login");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (role: UserRole, username: string, password: string) => {
    if (!role) {
      return { success: false, error: "Please select a user type to continue." };
    }
    if (!username.trim()) {
      return { success: false, error: "Please enter your Username or User ID." };
    }
    if (!password.trim()) {
      return { success: false, error: "Please enter your password." };
    }

    // In demo mode: accept any valid credentials, customize name if supplied
    const baseProfile = DEFAULT_PROFILES[role];
    const profile: UserProfile = {
      ...baseProfile,
      name: username.length > 2 && !username.includes("@") && isNaN(Number(username)) ? username : baseProfile.name,
      userId: username.includes("-") ? username : baseProfile.userId,
    };

    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.warn("Local storage write failed", err);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to remove auth session", e);
    }
    router.push("/login");
  };

  const updateProfile = (updated: Partial<Pick<UserProfile, "name" | "email" | "contactNumber">>) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch (e) {
      console.warn("Failed to save updated profile", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
