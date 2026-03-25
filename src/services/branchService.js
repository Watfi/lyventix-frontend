import api from './api';

export const branchService = {
  getBranches: (businessId) => api.get(`/businesses/${businessId}/branches`),
  getBranch: (businessId, branchId) => api.get(`/businesses/${businessId}/branches/${branchId}`),
  createBranch: (businessId, data) => api.post(`/businesses/${businessId}/branches`, data),
  updateBranch: (businessId, branchId, data) => api.put(`/businesses/${businessId}/branches/${branchId}`, data),
  deleteBranch: (businessId, branchId) => api.delete(`/businesses/${businessId}/branches/${branchId}`),
};
export default branchService;
