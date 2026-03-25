import api from './api';

const businessService = {
  // Get business details by ID
  getBusiness: (businessId) => {
    return api.get(`/businesses/${businessId}`);
  },

  // Update business profile
  updateBusiness: (businessId, data) => {
    return api.put(`/businesses/${businessId}`, data);
  },

  // Update business configuration (theme, language, currency, etc.)
  updateConfig: (businessId, data) => {
    return api.put(`/businesses/${businessId}/config`, data);
  },

  // Upload business logo (multipart/form-data)
  uploadLogo: (businessId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/businesses/${businessId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Remove business logo (revert to default)
  removeLogo: (businessId) => {
    return api.delete(`/businesses/${businessId}/logo`);
  }
};

export default businessService;
