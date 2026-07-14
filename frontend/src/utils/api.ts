import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if needed
api.interceptors.request.use(
  (config) => {
    // TODO: Ambil token dari localStorage / Auth Store saat autentikasi sudah siap.
    // Untuk saat ini, kita bypass atau hardcode mock token karena belum diintegrasikan utuh
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // MOCK TOKEN SEMENTARA AGAR MIDDLEWARE BACKEND LEWAT
    // Di real-world ini harusnya token JWT asli milik role STAFF
    config.headers.Authorization = `Bearer MOCK_TOKEN_ADMIN`; 
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data, // langsung me-return body data
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
