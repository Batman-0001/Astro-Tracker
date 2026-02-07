import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Asteroid endpoints
export const asteroidApi = {
  getAll: (params) => api.get("/api/asteroids", { params }),
  getStats: () => api.get("/api/asteroids/stats"),
  getToday: () => api.get("/api/asteroids/today"),
  getById: (id) => api.get(`/api/asteroids/${id}`),
  getHazardous: () => api.get("/api/asteroids/hazardous/all"),
};

// Auth endpoints
export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  getProfile: () => api.get("/api/auth/me"),
  updateProfile: (data) => api.put("/api/auth/profile", data),
  deleteAccount: () => api.delete("/api/auth/account"),
  getWatchlist: () => api.get("/api/auth/watchlist"),
  addToWatchlist: (asteroidId) => api.post(`/api/auth/watchlist/${asteroidId}`),
  removeFromWatchlist: (asteroidId) =>
    api.delete(`/api/auth/watchlist/${asteroidId}`),
};

// Alert endpoints
export const alertApi = {
  getAll: (params) => api.get("/api/alerts", { params }),
  getUnread: () => api.get("/api/alerts/unread"),
  markRead: (id) => api.put(`/api/alerts/${id}/read`),
  markAllRead: () => api.put("/api/alerts/read-all"),
};

// Admin endpoints
export const adminApi = {
  testNasa: () => api.get("/api/admin/test-nasa"),
  triggerFetch: (type = "today") => api.post("/api/admin/fetch", { type }),
  getStats: () => api.get("/api/admin/stats"),
};

export default api;
