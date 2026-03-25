import api from './api';

const BASE = '/inventory';

export const inventoryService = {
  getStock: (branchId, params = {}) =>
    api.get(`${BASE}/${branchId}/stock`, { params }),

  getKardex: (branchId, productId, params = {}) =>
    api.get(`${BASE}/${branchId}/kardex/${productId}`, { params }),

  createEntry: (branchId, data) =>
    api.post(`${BASE}/${branchId}/entries`, data),

  createExit: (branchId, data) =>
    api.post(`${BASE}/${branchId}/exits`, data),

  updateStockSettings: (inventoryId, minQuantity, maxQuantity) =>
    api.patch(`${BASE}/${inventoryId}/settings`, null, {
      params: { minQuantity, maxQuantity },
    }),

  transferStock: (sourceBranchId, targetBranchId, productId, quantity, notes) =>
    api.post(`${BASE}/transfer`, null, {
      params: { sourceBranchId, targetBranchId, productId, quantity, notes },
    }),
};

export default inventoryService;
