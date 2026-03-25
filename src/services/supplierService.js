import api from './api';

// SupplierController: @RequestMapping("/api/suppliers")
const BASE = '/api/suppliers';

export const supplierService = {
  getSuppliers: (businessId, params = {}) =>
    api.get(BASE, { baseURL: 'http://localhost:8080', params: { businessId, ...params } }),

  getSupplier: (id) =>
    api.get(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),

  createSupplier: (businessId, data) =>
    api.post(BASE, data, { baseURL: 'http://localhost:8080', params: { businessId } }),

  updateSupplier: (id, data) =>
    api.put(`${BASE}/${id}`, data, { baseURL: 'http://localhost:8080' }),

  deleteSupplier: (id) =>
    api.delete(`${BASE}/${id}`, { baseURL: 'http://localhost:8080' }),
};

export default supplierService;
