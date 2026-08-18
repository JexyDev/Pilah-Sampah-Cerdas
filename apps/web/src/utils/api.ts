/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import axios from "axios";

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:3000/api/v1`;
    }
    return "/api/v1";
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
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalisasi error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (
      status === 401 && 
      !error.config?.url?.includes("/auth/login") && 
      !error.config?.url?.includes("/auth/verify-otp")
    ) {
      localStorage.removeItem("psc_access_token");
      localStorage.removeItem("psc_user");
      sessionStorage.removeItem("psc_access_token");
      sessionStorage.removeItem("psc_user");
      
      const publicPaths = ["/", "/login", "/register", "/register-mahasiswa", "/tentang", "/panduan"];
      const currentPath = window.location.pathname;
      if (!publicPaths.includes(currentPath)) {
        window.location.href = "/login";
      }
    }
    console.error("[API Error]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
