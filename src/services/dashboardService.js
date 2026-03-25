import api from './api';

export const dashboardService = {
  getDashboard: (businessId) =>
    api.get(`/businesses/${businessId}/reports/dashboard`),
};

export default dashboardService;
