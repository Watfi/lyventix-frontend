import api from './api';

// ProductController: @RequestMapping("/api/products")
// NOTE: baseURL is /api/v1, so we use absolute URL
const BASE = '/api/products';

export const productService = {
  getProducts: (businessId, params = {}) =>
    api.get(BASE, { baseURL: 'http://localhost:8080', params: { businessId, ...params } }),

  getProduct: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),

  createProduct: (businessId, data) =>
    api.post(BASE, data, { baseURL: 'http://localhost:8080', params: { businessId } }),

  updateProduct: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: 'http://localhost:8080' }),

  deleteProduct: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),
};

export default productService;
