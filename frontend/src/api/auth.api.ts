import { apiClient } from "./client";
import type { AuthTokens } from "@/types/user.types";

export const authApi = {
  login(email: string, password: string): Promise<AuthTokens> {
    console.debug("[API:auth] login", email);
    return apiClient
      .post<AuthTokens>("/auth/login", { email, password })
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:auth] login failed:", (err as Error).message);
        throw err;
      });
  },

  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthTokens> {
    console.debug("[API:auth] register", email);
    return apiClient
      .post<AuthTokens>("/auth/register", {
        email,
        password,
        firstName,
        lastName,
      })
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:auth] register failed:", (err as Error).message);
        throw err;
      });
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    console.debug("[API:auth] refresh");
    return apiClient
      .post<AuthTokens>(
        "/auth/refresh",
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      )
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:auth] refresh failed:", (err as Error).message);
        throw err;
      });
  },

  logout(): Promise<void> {
    console.debug("[API:auth] logout");
    return apiClient
      .post("/auth/logout")
      .then(() => undefined)
      .catch((err: unknown) => {
        console.error("[API:auth] logout failed:", (err as Error).message);
        // Fire-and-forget: swallow error, session will be cleared client-side
      });
  },
};
