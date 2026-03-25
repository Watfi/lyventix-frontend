import api from './api';

export const saleService = {
  getSales: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/sales`, { params }),

  getSale: (businessId, id) =>
    api.get(`/businesses/${businessId}/sales/${id}`),

  createSale: (businessId, data) =>
    api.post(`/businesses/${businessId}/sales`, data),

  updateSale: (businessId, id, data) =>
    api.put(`/businesses/${businessId}/sales/${id}`, data),

  cancelSale: (businessId, id) =>
    api.post(`/businesses/${businessId}/sales/${id}/cancel`),
};

export default saleService;
