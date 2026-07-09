import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

function getTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function saveUser(user: { userId: string; email: string; name: string }) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthResponse>(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        saveTokens(data.accessToken, data.refreshToken);
        saveUser({ userId: data.userId, email: data.email, name: data.name });
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

export const urlsApi = {
  create: (data: { longUrl: string; customAlias?: string; expiresAt?: string }) =>
    api.post("/api/urls", data),
  list: (page = 0, size = 20) => api.get(`/api/urls?page=${page}&size=${size}`),
  get: (id: string) => api.get(`/api/urls/${id}`),
  update: (id: string, data: { active?: boolean; expiresAt?: string | null }) =>
    api.put(`/api/urls/${id}`, data),
  delete: (id: string) => api.delete(`/api/urls/${id}`),
  qrUrl: (id: string) => `${API_URL}/api/urls/${id}/qr`,
};

export const analyticsApi = {
  dashboard: () => api.get("/api/analytics/dashboard"),
  urlAnalytics: (id: string) => api.get(`/api/analytics/urls/${id}`),
  geoAnalytics: (id: string) => api.get(`/api/analytics/urls/${id}/geo`),
};
