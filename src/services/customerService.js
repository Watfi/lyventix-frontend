import api from './api';

export const customerService = {
  getCustomers: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/customers`, { params }),

  getCustomer: (businessId, id) =>
    api.get(`/businesses/${businessId}/customers/${id}`),

  createCustomer: (businessId, data) =>
    api.post(`/businesses/${businessId}/customers`, data),

  updateCustomer: (businessId, id, data) =>
    api.put(`/businesses/${businessId}/customers/${id}`, data),

  deleteCustomer: (businessId, id) =>
    api.delete(`/businesses/${businessId}/customers/${id}`),
};

export default customerService;
