import api from "./api";

export type IoTDeviceStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type CH4StatusLevel = "AMAN" | "WASPADA" | "BAHAYA";

export interface CH4Reading {
  id: string;
  deviceId: string;
  nilaiPpm: number | string;
  suhu?: number | string | null;
  kelembaban?: number | string | null;
  baterai?: number | string | null;
  statusLevel: CH4StatusLevel;
  timestamp: string;
  createdAt?: string;
}

export interface IoTDevice {
  id: string;
  name: string;
  nodeCode: string;
  locationName: string;
  latitude: number | string;
  longitude: number | string;
  status: IoTDeviceStatus;
  apiKey: string;
  kelurahan?: string | null;
  kelurahanId?: string | null;
  rwId?: number | null;
  picUserId?: string | null;
  kelurahanRef?: { id: string; name: string } | null;
  rwRef?: { id: number; name: string } | null;
  picUser?: { id: string; name: string; phone?: string; email?: string } | null;
  latestReading?: CH4Reading | null;
  _count?: { readings: number };
  createdAt: string;
  updatedAt: string;
}

export interface IoTDashboardSummary {
  totalDevices: number;
  activeDevices: number;
  maintenanceDevices: number;
  inactiveDevices: number;
  totalReadings: number;
  statusBreakdown: {
    aman: number;
    waspada: number;
    bahaya: number;
    tanpaData: number;
  };
}

export interface OfficerUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: { id: number; name: string };
}

export interface CreateDevicePayload {
  name: string;
  nodeCode?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
  picUserId?: string | null;
}

export interface UpdateDevicePayload {
  name?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
  picUserId?: string | null;
}

export const iotApiService = {
  async getAllDevices(): Promise<IoTDevice[]> {
    const res = await api.get("/iot/devices");
    return res.data.data;
  },

  async getDeviceById(id: string): Promise<IoTDevice & { readings?: CH4Reading[] }> {
    const res = await api.get(`/iot/devices/${id}`);
    return res.data.data;
  },

  async createDevice(payload: CreateDevicePayload): Promise<IoTDevice> {
    const res = await api.post("/iot/devices", payload);
    return res.data.data;
  },

  async updateDevice(id: string, payload: UpdateDevicePayload): Promise<IoTDevice> {
    const res = await api.put(`/iot/devices/${id}`, payload);
    return res.data.data;
  },

  async deleteDevice(id: string): Promise<void> {
    await api.delete(`/iot/devices/${id}`);
  },

  async regenerateApiKey(id: string): Promise<{ id: string; apiKey: string }> {
    const res = await api.post(`/iot/devices/${id}/regenerate-key`);
    return res.data.data;
  },

  async getDeviceReadings(id: string, limit = 50): Promise<CH4Reading[]> {
    const res = await api.get(`/iot/devices/${id}/readings?limit=${limit}`);
    return res.data.data;
  },

  async getDashboardSummary(): Promise<IoTDashboardSummary> {
    const res = await api.get("/iot/summary");
    return res.data.data;
  },

  async getOfficers(): Promise<OfficerUser[]> {
    const res = await api.get("/iot/officers");
    return res.data.data;
  },

  async cleanupReadings(days = 30): Promise<{ deletedCount: number }> {
    const res = await api.delete(`/iot/readings/cleanup?days=${days}`);
    return res.data.data;
  },
};
