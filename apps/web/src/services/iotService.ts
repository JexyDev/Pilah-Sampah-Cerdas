import api from "./api";

export interface IoTDevice {
  id: string;
  name: string;
  nodeCode: string;
  locationName: string;
  latitude: number;
  longitude: number;
  useSensorGps: boolean;
  sensorRadius: number;
  firmwareVersion: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  apiKey?: string;
  kelurahan?: string | null;
  kelurahanId?: string | null;
  rwId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CH4Reading {
  id: string;
  deviceId: string;
  nilaiPpm: number;
  statusLevel: "NORMAL" | "WARNING" | "DANGER";
  suhu: number | null;
  kelembaban: number | null;
  baterai: number | null;
  rssi: number | null;
  latitude: number | null;
  longitude: number | null;
  lokasiName: string | null;
  timestamp: string;
  device?: {
    name: string;
    nodeCode: string;
    locationName: string;
  };
}

export interface IoTTelemetrySummary {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  latestReading: CH4Reading | null;
  avgCh4Ppm: number;
  maxCh4Ppm: number;
  minCh4Ppm: number;
  statusCounts: {
    normal: number;
    warning: number;
    danger: number;
  };
  sparklines: Array<{
    time: string;
    timestamp: string;
    ch4Ppm: number;
    suhu: number | null;
    kelembaban: number | null;
    baterai: number | null;
    rssi: number | null;
  }>;
  devices: Array<IoTDevice & { latestReading?: CH4Reading | null }>;
}

export interface SystemRecommendation {
  statusLevel: "NORMAL" | "PERINGATAN" | "BAHAYA";
  confidenceScore: number;
  ringkasanKondisi: string;
  evaluasiFisikaKimia: string;
  langkahPenangananSop: string[];
  rekomendasiTeknis: string[];
  modelAnalisis: string;
  dianalisisPada: string;
  isCached: boolean;
  isAiIntegrated?: boolean;
  apiKeyConfigured?: boolean;
  targetDevice?: {
    id: string;
    name: string;
    nodeCode: string;
    locationName?: string | null;
  } | null;
}

export interface IoTSystemConfig {
  id: string;
  thresholdNormalMax: number;
  thresholdWarningMax: number;
  offlineTimeoutMinutes: number;
  mqttBrokerUrl: string;
  mqttTopicCh4: string;
  geminiApiKey: string | null;
  geminiModel: string;
  rbacPermissions: Record<string, string[]>;
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isRecommended: boolean;
  recommendationLabel: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export interface GeminiValidationResult {
  valid: boolean;
  totalModels: number;
  recommendedModel: string;
  models: GeminiModelInfo[];
}

export interface SimulatorDeviceState {
  deviceId: string;
  nodeCode: string;
  deviceName: string;
  locationName: string;
  currentPpm: number;
  currentBattery: number;
  currentRssi: number;
  currentTemp: number;
  currentHumidity: number;
  lastStatusLevel: string;
  lastReadingAt: string | null;
}

export interface SimulatorStatus {
  isActive: boolean;
  isAllDevices?: boolean;
  targetDeviceCount?: number;
  deviceIds?: string[];
  devices?: SimulatorDeviceState[];
  deviceId: string | null;
  nodeCode: string | null;
  deviceName: string | null;
  locationName: string | null;
  intervalMinutes: number;
  pulseCount: number;
  totalReadingsSent?: number;
  lastPulseAt: string | null;
  nextPulseAt?: string | null;
  currentPpm: number;
  currentBattery: number;
  currentRssi: number;
  currentTemp: number;
  currentHumidity: number;
  lastStatusLevel: string | null;
  lastError: string | null;
}

export interface ReadingsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const iotWebservice = {
  // Summary
  async getSummary(params?: { deviceId?: string; startDate?: string; endDate?: string }): Promise<IoTTelemetrySummary> {
    const res = await api.get<{ success: boolean; data: IoTTelemetrySummary }>("/iot/summary", { params });
    return res.data.data;
  },

  // Devices
  async getDevices(): Promise<IoTDevice[]> {
    const res = await api.get<{ success: boolean; data: IoTDevice[] }>("/iot/devices");
    return res.data.data;
  },

  async getDeviceById(id: string): Promise<IoTDevice> {
    const res = await api.get<{ success: boolean; data: IoTDevice }>(`/iot/devices/${id}`);
    return res.data.data;
  },

  async createDevice(payload: Partial<IoTDevice>): Promise<IoTDevice> {
    const res = await api.post<{ success: boolean; data: IoTDevice }>("/iot/devices", payload);
    return res.data.data;
  },

  async updateDevice(id: string, payload: Partial<IoTDevice>): Promise<IoTDevice> {
    const res = await api.put<{ success: boolean; data: IoTDevice }>(`/iot/devices/${id}`, payload);
    return res.data.data;
  },

  async deleteDevice(id: string): Promise<void> {
    await api.delete(`/iot/devices/${id}`);
  },

  async updateFirmwareOta(id: string, targetVersion: string): Promise<IoTDevice> {
    const res = await api.post<{ success: boolean; data: IoTDevice }>(`/iot/devices/${id}/ota`, { targetVersion });
    return res.data.data;
  },

  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    const res = await api.post<{ success: boolean; data: { apiKey: string } }>(`/iot/devices/${id}/regenerate-key`);
    return res.data.data;
  },

  // Readings
  async getReadings(params?: {
    page?: number;
    limit?: number;
    deviceId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: CH4Reading[]; pagination: ReadingsPagination }> {
    const res = await api.get<{
      success: boolean;
      data: CH4Reading[];
      pagination: ReadingsPagination;
    }>("/iot/readings", { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  // Ingest / Emulator
  async ingestReading(payload: {
    apiKey: string;
    nilaiPpm: number;
    suhu?: number | null;
    kelembaban?: number | null;
    baterai?: number | null;
    rssi?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    lokasiName?: string | null;
    timestamp?: string;
  }): Promise<CH4Reading> {
    const res = await api.post<{ success: boolean; data: CH4Reading }>("/iot/readings/ingest", payload);
    return res.data.data;
  },

  // Export CSV
  async downloadExportCsv(params?: {
    deviceId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    const res = await api.get("/iot/readings/export", {
      params,
      responseType: "blob",
    });

    // Buat link unduhan otomatis
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // ISO timestamp file name
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    link.setAttribute("download", `laporan_sensor_ch4_${stamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // System Recommendations
  async getRecommendations(forceRefresh = false, deviceId?: string): Promise<SystemRecommendation> {
    const res = await api.get<{ success: boolean; data: SystemRecommendation }>("/iot/recommendations", {
      params: {
        force: forceRefresh ? "true" : undefined,
        deviceId: deviceId && deviceId !== "all" ? deviceId : undefined,
      },
    });
    return res.data.data;
  },

  async getSystemRecommendation(forceRefresh = false, deviceId?: string): Promise<SystemRecommendation> {
    return this.getRecommendations(forceRefresh, deviceId);
  },

  // Config
  async getConfig(): Promise<IoTSystemConfig> {
    const res = await api.get<{ success: boolean; data: IoTSystemConfig }>("/iot/config");
    return res.data.data;
  },

  async updateConfig(payload: Partial<IoTSystemConfig>): Promise<IoTSystemConfig> {
    const res = await api.put<{ success: boolean; data: IoTSystemConfig }>("/iot/config", payload);
    return res.data.data;
  },

  // Officers
  async getOfficers(): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
    const res = await api.get<{ success: boolean; data: Array<{ id: string; name: string; email: string; role: string }> }>("/iot/officers");
    return res.data.data;
  },

  // Gemini Validation & Model Discovery
  async validateGeminiApiKey(apiKey: string): Promise<GeminiValidationResult> {
    const res = await api.post<{ success: boolean; data: GeminiValidationResult }>("/iot/ai/validate-key", { apiKey });
    return res.data.data;
  },

  // Simulator Background Service
  async getSimulatorStatus(): Promise<SimulatorStatus> {
    const res = await api.get<{ success: boolean; data: SimulatorStatus }>("/iot/simulator/status");
    return res.data.data;
  },

  async startSimulator(params: {
    deviceId?: string;
    deviceIds?: string[] | "all";
    intervalMinutes: number;
  }): Promise<SimulatorStatus> {
    const res = await api.post<{ success: boolean; message: string; data: SimulatorStatus }>("/iot/simulator/start", params);
    return res.data.data;
  },

  async stopSimulator(): Promise<SimulatorStatus> {
    const res = await api.post<{ success: boolean; message: string; data: SimulatorStatus }>("/iot/simulator/stop");
    return res.data.data;
  },
};
