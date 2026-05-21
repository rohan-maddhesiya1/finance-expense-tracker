import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL points to the deployed backend.
// In local dev, it falls back to /api which CRA proxies to localhost:5000.
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Expenses
export const expenseAPI = {
  getAll: (params) => API.get('/expenses', { params }),
  getOne: (id) => API.get(`/expenses/${id}`),
  create: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  getSummary: (params) => API.get('/expenses/summary', { params }),
};

// Budgets
export const budgetAPI = {
  getAll: (params) => API.get('/budgets', { params }),
  create: (data) => API.post('/budgets', data),
  delete: (id) => API.delete(`/budgets/${id}`),
};

// Reports
export const reportAPI = {
  monthlyTrend: () => API.get('/reports/monthly-trend'),
  categoryBreakdown: (params) => API.get('/reports/category-breakdown', { params }),
  daily: (params) => API.get('/reports/daily', { params }),
  topTransactions: (params) => API.get('/reports/top-transactions', { params }),
};

export default API;
