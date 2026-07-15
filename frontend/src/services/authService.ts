import api from '../utils/api';

export const authService = {
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data; // Backend returns { success, message, user }
  },
  
  updateProfile: async (data: { name?: string; email?: string; phone?: string; address?: string; fotoProfil?: string }) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  updatePassword: async (data: { currentPassword?: string; newPassword?: string }) => {
    const res = await api.put('/auth/password', data);
    return res.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
