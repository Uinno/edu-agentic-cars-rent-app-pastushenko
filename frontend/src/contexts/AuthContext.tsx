import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/api/auth.api";
import {
  clearTokens,
  getAccessToken,
  storeTokens,
} from "@/utils/token.storage";
import type { CurrentUserPayload, UserRole } from "@/types/user.types";

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

// ── Context types ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: CurrentUserPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored access token on mount
  useEffect(() => {
    console.debug("[AuthContext] Restoring session from stored token");
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwt(token);
      if (payload && !isExpired(payload)) {
        const restored: CurrentUserPayload = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };
        setUser(restored);
        console.debug("[AuthContext] Session restored:", {
          id: restored.id,
          email: restored.email,
          role: restored.role,
        });
      } else {
        console.debug("[AuthContext] Stored token expired, clearing session");
        clearTokens();
      }
    } else {
      console.debug("[AuthContext] No stored token found");
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.debug("[AuthContext] Login attempt:", email);
    try {
      const tokens = await authApi.login(email, password);
      storeTokens(tokens.accessToken, tokens.refreshToken);
      const payload = decodeJwt(tokens.accessToken);
      if (payload) {
        setUser({ id: payload.sub, email: payload.email, role: payload.role });
        console.debug(
          "[AuthContext] Login successful:",
          email,
          "| role:",
          payload.role,
        );
      }
    } catch (err) {
      console.error("[AuthContext] Login failed:", (err as Error).message);
      throw err;
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      console.debug("[AuthContext] Register attempt:", email);
      try {
        const tokens = await authApi.register(
          email,
          password,
          firstName,
          lastName,
        );
        storeTokens(tokens.accessToken, tokens.refreshToken);
        const payload = decodeJwt(tokens.accessToken);
        if (payload) {
          setUser({
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          });
          console.debug(
            "[AuthContext] Register successful:",
            email,
            "| role:",
            payload.role,
          );
        }
      } catch (err) {
        console.error("[AuthContext] Register failed:", (err as Error).message);
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    void authApi.logout(); // fire-and-forget
    clearTokens();
    setUser(null);
    console.debug("[AuthContext] Logged out");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
