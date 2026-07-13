import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface SetorPayload {
  user_id: string;
  qr_data: string;
  image_url?: string;
  jenis_sampah: string;
  volume: number;
}

export const setorSampah = async (payload: SetorPayload) => {
  try {
    const response = await axios.post(`${API_URL}/transactions/setor`, payload);
    return response.data;
  } catch (error: any) {
    console.error('Error setor sampah:', error);
    // Return standard error shape if available
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw error;
  }
};
