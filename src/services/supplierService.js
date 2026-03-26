import api from './api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const BASE = '/api/suppliers';

export const supplierService = {
  getSuppliers: (businessId, params = {}) =>
    api.get(BASE, { baseURL: BASE_URL, params: { businessId, ...params } }),

  getSupplier: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: BASE_URL }),

  createSupplier: (businessId, data) =>
    api.post(BASE, data, { baseURL: BASE_URL, params: { businessId } }),

  updateSupplier: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: BASE_URL }),

  deleteSupplier: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: BASE_URL }),
};

export default supplierService;
