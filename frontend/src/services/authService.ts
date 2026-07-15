import api from '../utils/api';

export const authService = {
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
  
  updateProfile: async (data: { name?: string; email?: string }) => {
    return await api.put('/auth/profile', data);
  },

  updatePassword: async (data: { currentPassword?: string; newPassword?: string }) => {
    return await api.put('/auth/password', data);
  }
};
