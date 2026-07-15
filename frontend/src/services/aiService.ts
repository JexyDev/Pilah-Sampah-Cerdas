import api from './api';

export const predictWaste = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // For now, let's call the actual AI mock endpoint
    const response = await api.post(`/waste/detect-mock`, { imageUrl: "mock_image.jpg" });
    
    return response.data.data; // { jenis_sampah, estimasi_volume, confidence }
  } catch (error) {
    console.error('Error predicting waste:', error);
    throw error;
  }
};
