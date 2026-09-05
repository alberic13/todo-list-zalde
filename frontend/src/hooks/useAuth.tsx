import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { authService, RegisterResponse, AuthResponse } from "../services/authService";

import { googleLogout } from "@react-oauth/google";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: (credential: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, remember?: boolean) => Promise<RegisterResponse>;
  setAuthSession: (authData: AuthResponse, remember?: boolean) => void;
  updateProfile: (data: { name?: string; phoneNumber?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveToken = (newToken: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem("auth_token", newToken);
      sessionStorage.removeItem("auth_token");
    } else {
      sessionStorage.setItem("auth_token", newToken);
      localStorage.removeItem("auth_token");
    }
  };

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getMe();
        setUser(profile);
      } catch (err) {
        console.error("Session expired or invalid token:", err);
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string, remember: boolean = false) => {
    const res = await authService.login(email, password);
    saveToken(res.token, remember);
    setToken(res.token);
    setUser(res.user);
  };

  const loginWithGoogle = async (credential: string, remember: boolean = false) => {
    const res = await authService.loginWithGoogle(credential);
    saveToken(res.token, remember);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, remember: boolean = false): Promise<RegisterResponse> => {
    const res = await authService.register(name, email, password);
    if (res.token) {
      saveToken(res.token, remember);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const setAuthSession = (authData: AuthResponse, remember: boolean = false) => {
    saveToken(authData.token, remember);
    setToken(authData.token);
    setUser(authData.user);
  };

  const updateProfile = async (data: { name?: string; phoneNumber?: string }): Promise<User> => {
    const updated = await authService.updateProfile(data);
    setUser((prev) => (prev ? { ...prev, ...updated } : updated));
    return updated;
  };

  const logout = () => {
    try {
      googleLogout();
    } catch (e) {
      // Ignored
    }
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        setAuthSession,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
