/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import axios from "axios";

export const getApiBaseUrl = (): string => {
  // Jika di browser dan bukan localhost/127.0.0.1, selalu gunakan path relatif reverse proxy (/api/v1)
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "/api/v1";
    }
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:3001/api/v1`;
    }
  }

  return "/api/v1";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Request interceptor — tambahkan token jika ada di localStorage atau sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Jika data berupa FormData, hapus default Content-Type agar browser mengatur multipart boundary secara otomatis
    if (config.data instanceof FormData && config.headers) {
      if (typeof (config.headers as any).delete === "function") {
        (config.headers as any).delete("Content-Type");
        (config.headers as any).delete("content-type");
      }
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleForceLogout = () => {
  const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
  if (token?.startsWith("dev_mock_token_")) {
    return; // Don't force logout in local dev mock session
  }

  localStorage.removeItem("psc_access_token");
  localStorage.removeItem("psc_refresh_token");
  localStorage.removeItem("psc_user");
  sessionStorage.removeItem("psc_access_token");
  sessionStorage.removeItem("psc_refresh_token");
  sessionStorage.removeItem("psc_user");

  const publicPaths = ["/", "/login", "/register", "/register-mahasiswa", "/tentang", "/panduan"];
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  if (currentPath && !publicPaths.includes(currentPath)) {
    window.location.href = "/login";
  }
};

// Response interceptor — Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const currentToken = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");

    if (currentToken?.startsWith("dev_mock_token_")) {
      return Promise.reject(error);
    }

    // Check if error is 401 and request hasn't been retried yet
    const isAuthUrl =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/verify-otp") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && !isAuthUrl && !originalRequest?._retry) {
      const refreshToken =
        localStorage.getItem("psc_refresh_token") ?? sessionStorage.getItem("psc_refresh_token");

      if (!refreshToken || refreshToken.startsWith("dev_mock_")) {
        handleForceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken =
          response.data?.data?.accessToken || response.data?.accessToken;

        if (newAccessToken) {
          const isRemember = localStorage.getItem("psc_remember_me") === "1";
          if (isRemember) {
            localStorage.setItem("psc_access_token", newAccessToken);
          } else {
            sessionStorage.setItem("psc_access_token", newAccessToken);
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error("No access token returned from refresh");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        handleForceLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error log cleanly without dumping raw HTML (e.g. Nginx 502 Bad Gateway)
    const respData = error.response?.data;
    const isHtmlError = typeof respData === "string" && (respData.includes("<html") || respData.includes("<body"));

    if (isHtmlError || status === 502 || status === 503 || status === 504) {
      if (error.response) {
        error.response.data = {
          success: false,
          error: "SERVER_UNAVAILABLE",
          message: "Layanan server sedang dalam pemeliharaan atau memuat ulang (502 Bad Gateway). Silakan coba beberapa saat lagi.",
        };
      }
      console.warn(`[API Notice ${status || 502}] ${error.config?.url || ""}: Layanan server sedang dalam pemeliharaan/memuat ulang.`);
    } else {
      console.error("[API Error]", respData || error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
