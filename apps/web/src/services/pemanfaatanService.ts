import api from "./api";

export interface FeedbackItem {
  id: string;
  userId: string;
  wargaNama: string;
  kategori: string;
  judul: string;
  isiKritikSaran: string;
  rating: number;
  status: "MENUNGGU" | "DALAM_PROSES" | "SELESAI" | "DITOLAK" | string;
  tanggapan?: string | null;
  ditanggapiOleh?: string | null;
  ditanggapiPada?: string | null;
  fotoBuktiUrl?: string | null;
  rwId?: number | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  rw?: {
    id: number;
    name: string;
    kelurahan?: {
      name: string;
    };
  } | null;
}

export interface PemanfaatanProgram {
  id: string;
  namaProgram: string;
  jenisProgram: string;
  kategoriBahan: "ORGANIK" | "ANORGANIK" | string;
  jumlahBahanMasukKg: number;
  jumlahHasilKg: number;
  unitHasil: string;
  lokasiFasilitas?: string | null;
  penanggungJawab?: string | null;
  targetPenerimaManfaat?: string | null;
  nilaiEkonomiRp?: number | null;
  tanggalPencatatan: string;
  status: "TERENCANA" | "PROSES" | "PANEN" | "DISTRIBUSI" | string;
  fotoDokumentasiUrl?: string | null;
  rwId: number;
  rw?: {
    id: number;
    name: string;
    kelurahan?: {
      name: string;
    };
  };
}

export const pemanfaatanApiService = {
  /** Mengambil daftar program dan hasil olahan pemanfaatan */
  getPrograms: async (): Promise<PemanfaatanProgram[]> => {
    try {
      const res = await api.get("/pemanfaatan");
      if (res.data && res.data.success) {
        return Array.isArray(res.data.data) ? res.data.data : [];
      } else if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e: any) {
      console.warn("[pemanfaatanApiService] Gagal memuat program:", e?.message || e);
      return [];
    }
  },

  /** Mengambil detail program pemanfaatan berdasarkan ID */
  getProgramById: async (id: string): Promise<PemanfaatanProgram | null> => {
    try {
      const res = await api.get(`/pemanfaatan/${id}`);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      return res.data || null;
    } catch (e: any) {
      console.warn(`[pemanfaatanApiService] Gagal memuat program ID ${id}:`, e?.message || e);
      return null;
    }
  },

  /** Menambah catatan program pemanfaatan baru */
  createProgram: async (payload: any) => {
    const res = await api.post("/pemanfaatan", payload);
    return res.data;
  },

  /** Memperbarui program pemanfaatan */
  updateProgram: async (id: string, payload: any) => {
    const res = await api.put(`/pemanfaatan/${id}`, payload);
    return res.data;
  },

  /** Menghapus program pemanfaatan */
  deleteProgram: async (id: string) => {
    const res = await api.delete(`/pemanfaatan/${id}`);
    return res.data;
  },

  /** Mengambil daftar kritik, saran, dan evaluasi kepuasan warga */
  getFeedbackList: async (params?: { status?: string; kategori?: string; search?: string }): Promise<FeedbackItem[]> => {
    try {
      const res = await api.get("/pemanfaatan/feedback", { params });
      if (res.data && res.data.success) {
        return Array.isArray(res.data.data) ? res.data.data : [];
      } else if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e: any) {
      console.warn("[pemanfaatanApiService] Gagal memuat feedback:", e?.message || e);
      return [];
    }
  },

  /** Mengirim kritik & saran baru */
  createFeedback: async (data: {
    judul: string;
    isiKritikSaran: string;
    kategori?: string;
    rating?: number;
    rwId?: number;
    fotoBuktiUrl?: string | null;
  }) => {
    const res = await api.post("/pemanfaatan/feedback", data);
    return res.data;
  },

  /** Memberikan tanggapan resmi dari pihak pengelola/RW/admin */
  respondFeedback: async (id: string, data: { tanggapan: string; status?: string }) => {
    const res = await api.put(`/pemanfaatan/feedback/${id}/tanggapan`, data);
    return res.data;
  },

  /** Menghapus feedback */
  deleteFeedback: async (id: string) => {
    const res = await api.delete(`/pemanfaatan/feedback/${id}`);
    return res.data;
  },
};

export default pemanfaatanApiService;
