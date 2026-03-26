import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  businessId: localStorage.getItem('businessId'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      const user = {
        username: data.username,
        email: data.email,
        roles: data.roles,
        businessName: data.businessName,
        businessType: data.businessType || null,
        theme: data.theme || 'blue',
        darkMode: data.darkMode === true, // default false (light mode)
        logoUrl: data.logoUrl || null,
        branchId: data.branchId || null,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('businessId', data.businessId);
      localStorage.setItem('user', JSON.stringify(user));

      // Apply theme to document
      document.documentElement.className = `theme-${user.theme} ${user.darkMode ? 'dark' : ''}`;

      set({
        user,
        token: data.token,
        businessId: data.businessId,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (error) {
      console.error('LOGIN ERROR:', error.message, error.code, error.response?.status, error.response?.data);
      set({
        error: error.response?.data?.message || `Error al iniciar sesión (${error.message})`,
        loading: false,
      });
      return false;
    }
  },

  register: async (registerData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', registerData);
      const data = response.data;

      const user = {
        username: data.username,
        email: data.email,
        roles: data.roles,
        businessName: data.businessName,
        businessType: data.businessType || null,
        theme: data.theme || 'blue',
        darkMode: data.darkMode === true, // default false (light mode)
        logoUrl: data.logoUrl || null,
        branchId: data.branchId || null,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('businessId', data.businessId);
      localStorage.setItem('user', JSON.stringify(user));

      // Apply theme to document
      document.documentElement.className = `theme-${user.theme} ${user.darkMode ? 'dark' : ''}`;

      set({
        user,
        token: data.token,
        businessId: data.businessId,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (error) {
      let msg = error.response?.data?.message || 'Error en el registro';
      if (error.response?.data?.validationErrors) {
        const details = error.response.data.validationErrors.map(err => err.message).join(', ');
        msg += ': ' + details;
      }
      set({
        error: msg,
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('businessId');
    localStorage.removeItem('user');
    sessionStorage.removeItem('branchSelected');
    set({ user: null, token: null, businessId: null, isAuthenticated: false });
  },

  updateTheme: (newTheme, isDarkMode) => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        theme: newTheme !== undefined ? newTheme : user.theme,
        darkMode: isDarkMode !== undefined ? isDarkMode : user.darkMode
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      document.documentElement.className = `theme-${updatedUser.theme} ${updatedUser.darkMode ? 'dark' : ''}`;
      set({ user: updatedUser });
    }
  },

  setBranch: (branchId, branchName) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, branchId, branchName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  updateLogo: (logoUrl) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, logoUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
