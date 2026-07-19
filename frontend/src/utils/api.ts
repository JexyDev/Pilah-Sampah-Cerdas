/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://passerby-caucasian-viewpoint.ngrok-free.dev/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Request interceptor — tambahkan token jika ada di localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('psc_access_token');
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
    // Jika 401 dan bukan request login, clear token & redirect login
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('psc_access_token');
      localStorage.removeItem('psc_user');
      window.location.href = '/login';
    }
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
