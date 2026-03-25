import api from './api';

export const tableService = {
  getTables: (branchId, status = null) => {
    let url = `/tables?branchId=${branchId}`;
    if (status) {
      url += `&status=${status}`;
    }
    return api.get(url);
  },

  getTable: (id) => api.get(`/tables/${id}`),

  createTable: (branchId, data) => api.post(`/tables?branchId=${branchId}`, data),

  updateTable: (id, data) => api.put(`/tables/${id}`, data),

  updateStatus: (id, status) => api.patch(`/tables/${id}/status?status=${status}`),

  deleteTable: (id) => api.delete(`/tables/${id}`),
};

export default tableService;
