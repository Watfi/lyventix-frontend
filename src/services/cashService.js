import api from './api';

// CashRegisterController: @RequestMapping("/api/v1/cash")
// Already under /api/v1, so relative paths work

export const cashService = {
  getRegisters: (branchId) =>
    api.get('/cash/registers', { params: { branchId } }),

  getCurrentSession: () =>
    api.get('/cash/sessions/current'),

  openSession: (data) =>
    api.post('/cash/sessions/open', data),

  closeSession: (sessionId, actualBalance, notes) =>
    api.post('/cash/sessions/close', null, { params: { sessionId, actualBalance, notes } }),

  createRegister: (data) =>
    api.post('/cash/registers', data),

  getSessionHistory: (branchId) =>
    api.get('/cash/sessions/history', { params: { branchId } }),
};

export default cashService;
