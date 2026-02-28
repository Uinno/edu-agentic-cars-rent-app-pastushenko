import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from "@/utils/token.storage";

/** Extend the config type so we can mark a request as a retry */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.debug("[API] Request:", config.method?.toUpperCase(), config.url);
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.debug("[API] 401 received, attempting token refresh");

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.error("[API] No refresh token available, clearing session");
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(
          `${import.meta.env.VITE_API_URL as string}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        console.debug("[API] Token refresh succeeded");
        storeTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("[API] Token refresh failed, clearing session");
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    const status = error.response?.status;
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message;
    console.error("[API] Request failed:", status, message);
    return Promise.reject(error);
  },
);
