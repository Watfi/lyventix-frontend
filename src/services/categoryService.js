import api from './api';

// CategoryController: @RequestMapping("/api/categories")
const BASE = '/api/categories';

export const categoryService = {
  getCategories: (businessId, params = {}) =>
    api.get(BASE, { baseURL: 'http://localhost:8080', params: { businessId, ...params } }),

  getCategory: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),

  createCategory: (businessId, data) =>
    api.post(BASE, data, { baseURL: 'http://localhost:8080', params: { businessId } }),

  updateCategory: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: 'http://localhost:8080' }),

  deleteCategory: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),
};

export default categoryService;
