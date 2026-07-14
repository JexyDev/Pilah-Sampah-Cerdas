import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const predictWaste = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // Mock timeout manually in frontend for realistic feel if we don't want to use real upload
    // For now, let's call the actual AI mock endpoint
    const response = await axios.post(`${API_URL}/ai/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data; // { jenis_sampah, estimasi_volume, confidence }
  } catch (error) {
    console.error('Error predicting waste:', error);
    throw error;
  }
};
