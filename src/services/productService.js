import api from './api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const BASE = '/api/products';

export const productService = {
  getProducts: (businessId, params = {}) =>
    api.get(BASE, { baseURL: BASE_URL, params: { businessId, ...params } }),

  getProduct: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: BASE_URL }),

  createProduct: (businessId, data) =>
    api.post(BASE, data, { baseURL: BASE_URL, params: { businessId } }),

  updateProduct: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: BASE_URL }),

  deleteProduct: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: BASE_URL }),
};

export default productService;
