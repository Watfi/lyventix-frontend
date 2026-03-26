import api from './api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const BASE = '/api/categories';

export const categoryService = {
  getCategories: (businessId, params = {}) =>
    api.get(BASE, { baseURL: BASE_URL, params: { businessId, ...params } }),

  getCategory: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: BASE_URL }),

  createCategory: (businessId, data) =>
    api.post(BASE, data, { baseURL: BASE_URL, params: { businessId } }),

  updateCategory: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: BASE_URL }),

  deleteCategory: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: BASE_URL }),

  seedDefaults: (businessId) =>
    api.post(`${BASE}/seed-defaults`, null, { baseURL: BASE_URL, params: { businessId } }),
};

export default categoryService;
