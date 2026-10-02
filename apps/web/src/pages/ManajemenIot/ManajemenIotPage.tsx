import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Cpu,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Volume2,
  VolumeX,
  Key,
  Copy,
  Trash2,
  Edit,
  Activity,
  Flame,
  Thermometer,
  Droplets,
  BatteryCharging,
  Clock,
  MapPin,
  User,
  X,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { useAuthStore } from "../../store/useAuthStore";
import {
  iotApiService,
  type IoTDevice,
  type CH4Reading,
  type IoTDashboardSummary,
  type OfficerUser,
  type CreateDevicePayload,
  type CH4StatusLevel,
} from "../../services/iotService";

// Helper Audio Synthesizer (Zero-Dependency Web Audio API)
class WebAudioBuzzer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isBeeping = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public playTone(freq = 880, durationMs = 200) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + durationMs / 1000
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignored if browser blocks audio before user gesture
    }
  }

  public startEmergencyAlarm() {
    if (this.isBeeping) return;
    this.isBeeping = true;
    const beepSequence = () => {
      this.playTone(950, 180);
      setTimeout(() => this.playTone(800, 180), 200);
      setTimeout(() => this.playTone(950, 180), 400);
    };
    beepSequence();
    this.intervalId = setInterval(beepSequence, 4000);
  }

  public stopEmergencyAlarm() {
    this.isBeeping = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const buzzer = new WebAudioBuzzer();

// Component to handle map clicks for coordinate selection
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Custom Marker Pin Generator
const createPinIcon = (
  statusLevel: CH4StatusLevel | "INACTIVE" | "NO_DATA"
) => {
  let bg = "#10b981"; // Emerald
  let pulse = "";
  if (statusLevel === "BAHAYA") {
    bg = "#ef4444"; // Red
    pulse = `<span class="absolute -inset-1.5 rounded-full bg-red-500 opacity-75 animate-ping"></span>`;
  } else if (statusLevel === "WASPADA") {
    bg = "#f59e0b"; // Amber
    pulse = `<span class="absolute -inset-1 rounded-full bg-amber-400 opacity-50 animate-pulse"></span>`;
  } else if (statusLevel === "INACTIVE" || statusLevel === "NO_DATA") {
    bg = "#64748b"; // Slate
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      ${pulse}
      <div style="background-color: ${bg};" class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-iot-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const COBLONG_KELURAHANS = [
  "Dago",
  "Lebak Siliwangi",
  "Lebak Gede",
  "Sadang Serang",
  "Sekeloa",
  "Cipaganti",
];

export const ManajemenIotPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || user?.role || "").toUpperCase();
  const isTechOrAdmin = ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"].includes(userRole);

  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [summary, setSummary] = useState<IoTDashboardSummary | null>(null);
  const [officers, setOfficers] = useState<OfficerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);
  const [formData, setFormData] = useState<CreateDevicePayload>({
    name: "",
    nodeCode: "",
    locationName: "",
    latitude: -6.8906,
    longitude: 107.615,
    status: "ACTIVE",
    kelurahan: "Dago",
    rwId: 1,
    picUserId: "",
  });

  // History Modal State
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] =
    useState<IoTDevice | null>(null);
  const [historyReadings, setHistoryReadings] = useState<CH4Reading[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // API Key View Modal
  const [keyModalDevice, setKeyModalDevice] = useState<IoTDevice | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [devs, sum, offs] = await Promise.all([
        iotApiService.getAllDevices(),
        iotApiService.getDashboardSummary(),
        iotApiService.getOfficers(),
      ]);
      setDevices(devs);
      setSummary(sum);
      setOfficers(offs);
    } catch (err: any) {
      console.error("Gagal memuat data IoT:", err);
      toast.error("Gagal memuat data perangkat IoT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling telemetry tiap 10 detik
    return () => clearInterval(interval);
  }, []);

  // Check critical alarm state
  const criticalNodes = useMemo(() => {
    return devices.filter(
      (d) =>
        d.status === "ACTIVE" &&
        d.latestReading &&
        d.latestReading.statusLevel === "BAHAYA"
    );
  }, [devices]);

  useEffect(() => {
    if (criticalNodes.length > 0 && !isMuted) {
      buzzer.startEmergencyAlarm();
    } else {
      buzzer.stopEmergencyAlarm();
    }
    return () => {
      buzzer.stopEmergencyAlarm();
    };
  }, [criticalNodes, isMuted]);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      buzzer.stopEmergencyAlarm();
      toast("Audio alarm dibisukan (Muted)", { icon: "🔕" });
    } else {
      toast("Audio alarm diaktifkan (Unmuted)", { icon: "🔔" });
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isModalOpen) {
      setFormData((prev) => ({
        ...prev,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      }));
      toast.success(
        `Koordinat dipilih: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      );
    }
  };

  const handleOpenCreateModal = () => {
    if (!isTechOrAdmin) return;
    setEditingDevice(null);
    setFormData({
      name: "",
      nodeCode: "",
      locationName: "",
      latitude: -6.8906,
      longitude: 107.615,
      status: "ACTIVE",
      kelurahan: "Dago",
      rwId: 1,
      picUserId: officers.length > 0 ? officers[0].id : "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dev: IoTDevice) => {
    if (!isTechOrAdmin) return;
    setEditingDevice(dev);
    setFormData({
      name: dev.name,
      nodeCode: dev.nodeCode,
      locationName: dev.locationName,
      latitude: Number(dev.latitude),
      longitude: Number(dev.longitude),
      status: dev.status,
      kelurahan: dev.kelurahan || "Dago",
      rwId: dev.rwId || 1,
      picUserId: dev.picUserId || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTechOrAdmin) return;
    try {
      if (editingDevice) {
        await iotApiService.updateDevice(editingDevice.id, formData);
        toast.success("Perangkat IoT berhasil diperbarui");
      } else {
        await iotApiService.createDevice(formData);
        toast.success("Perangkat IoT baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan perangkat");
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!isTechOrAdmin) return;
    if (!window.confirm(`Yakin ingin menghapus node perangkat ${name}?`)) return;
    try {
      await iotApiService.deleteDevice(id);
      toast.success("Perangkat IoT berhasil dihapus");
      fetchData();
    } catch (err: any) {
      toast.error("Gagal menghapus perangkat");
    }
  };

  const handleViewHistory = async (dev: IoTDevice) => {
    setSelectedDeviceForHistory(dev);
    try {
      setLoadingHistory(true);
      const readings = await iotApiService.getDeviceReadings(dev.id, 60);
      setHistoryReadings(readings.reverse()); // Format chronological for charts
    } catch (err) {
      toast.error("Gagal memuat riwayat sensor");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!window.confirm("Regenerasi API Key akan memutuskan koneksi firmware lama sampai token diperbarui. Lanjutkan?")) return;
    try {
      const res = await iotApiService.regenerateApiKey(id);
      toast.success("API Key baru berhasil diterbitkan");
      if (keyModalDevice) {
        setKeyModalDevice({ ...keyModalDevice, apiKey: res.apiKey });
      }
      fetchData();
    } catch {
      toast.error("Gagal meregenerasi API Key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key disalin ke clipboard!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Cpu className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Manajemen IoT & Monitoring Sensor Metana (CH4)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem pemantauan gas metana real-time Agrisense Node pada kawasan Tempat Sampah & TPS Coblong.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute Alarm Toggle */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border transition-all ${
              isMuted
                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 shadow-sm"
            }`}
            title={isMuted ? "Alarm Dibisukan" : "Alarm Aktif"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-600 animate-bounce" />}
            <span>{isMuted ? "Muted" : "Buzzer Aktif"}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          {isTechOrAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Node Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Emergency Banner */}
      {criticalNodes.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/40 dark:border-red-500/60 flex items-start gap-3.5 shadow-lg animate-pulse">
          <AlertOctagon className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-800 dark:text-red-300">
              🚨 PERINGATAN DARURAT: Konsentrasi Gas Metana Kritis (≥ 5.000 ppm)!
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300/90 mt-0.5">
              Terdeteksi {criticalNodes.length} node dalam kondisi BAHAYA. Segera instruksikan petugas lapangan (PIC) untuk evaluasi aerasi & ventilasi:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {criticalNodes.map((cn) => (
                <span
                  key={cn.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5" />
                  {cn.nodeCode} - {cn.locationName} ({Number(cn.latestReading?.nilaiPpm).toLocaleString("id-ID")} ppm)
                  {cn.picUser && ` • PIC: ${cn.picUser.name}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Perangkat */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Node Sensor</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {summary?.totalDevices || 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {summary?.activeDevices || 0} Aktif • {summary?.maintenanceDevices || 0} Servis
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Status Gas Aman */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Node Aman (&lt;1.000 ppm)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary?.statusBreakdown.aman || 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Kondisi Normal</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Status Gas Waspada */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Node Waspada</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {summary?.statusBreakdown.waspada || 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">1.000 - 4.999 ppm</p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Status Gas Bahaya */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Node Bahaya (≥5.000 ppm)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {summary?.statusBreakdown.bahaya || 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Risiko Gas Kritis</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Peta Sebaran Node Sensor Gas Metana (CH4)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik pada penanda node untuk info telemetri lengkap. Saat modal terbuka, klik peta untuk menentukan koordinat GPS.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Aman
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Waspada
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Bahaya
            </span>
          </div>
        </div>

        <div className="h-[480px] w-full relative">
          <MapContainer
            center={[-6.885, 107.615]}
            zoom={14}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
          >
            <ThemeTileLayer />
            <MapClickHandler onMapClick={handleMapClick} />

            {devices.map((device) => {
              const statusLevel: CH4StatusLevel | "INACTIVE" | "NO_DATA" =
                device.status === "INACTIVE"
                  ? "INACTIVE"
                  : device.latestReading?.statusLevel || "NO_DATA";

              const lat = Number(device.latitude);
              const lng = Number(device.longitude);

              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker
                  key={device.id}
                  position={[lat, lng]}
                  icon={createPinIcon(statusLevel)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 max-w-[260px] text-slate-800">
                      <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                        <span className="font-bold text-sm text-slate-900">{device.nodeCode}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            statusLevel === "BAHAYA"
                              ? "bg-red-100 text-red-700"
                              : statusLevel === "WASPADA"
                              ? "bg-amber-100 text-amber-700"
                              : statusLevel === "AMAN"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLevel}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-700">{device.name}</p>
                      <p className="text-[11px] text-slate-500 mb-2">
                        {device.locationName} {device.kelurahan ? `• Kel. ${device.kelurahan}` : ""}
                      </p>

                      {device.latestReading ? (
                        <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-600">Konsentrasi CH4:</span>
                            <span
                              className={`text-sm ${
                                statusLevel === "BAHAYA"
                                  ? "text-red-600"
                                  : statusLevel === "WASPADA"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {Number(device.latestReading.nilaiPpm).toLocaleString("id-ID")} ppm
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Suhu: {device.latestReading.suhu ?? "-"}°C</span>
                            <span>Kelembaban: {device.latestReading.kelembaban ?? "-"}%</span>
                            <span>Baterai: {device.latestReading.baterai ?? "-"}%</span>
                          </div>
                          <div className="text-[10px] text-slate-400 text-right">
                            {new Date(device.latestReading.timestamp).toLocaleTimeString("id-ID")} WIB
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 py-1">Belum ada pembacaan sensor</p>
                      )}

                      {device.picUser && (
                        <div className="mt-2 pt-1 border-t text-[11px] text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>PIC: <strong>{device.picUser.name}</strong></span>
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t flex gap-2">
                        <button
                          onClick={() => handleViewHistory(device)}
                          className="flex-1 py-1 px-2 text-[11px] font-semibold bg-emerald-600 text-white rounded-md text-center hover:bg-emerald-700"
                        >
                          Grafik Riwayat
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(device)}
                          className="py-1 px-2 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Table of Devices */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Daftar Perangkat IoT & Telemetri Real-Time
          </h2>
          <span className="text-xs text-slate-400">Total {devices.length} Unit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Node / Perangkat</th>
                <th className="px-4 py-3">Lokasi & Wilayah</th>
                <th className="px-4 py-3">PIC Petugas</th>
                <th className="px-4 py-3">CH4 (PPM)</th>
                <th className="px-4 py-3">Status Gas</th>
                <th className="px-4 py-3">Suhu / Baterai</th>
                <th className="px-4 py-3">Waktu Rekam</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                    Belum ada perangkat IoT yang didaftarkan.{isTechOrAdmin ? ' Klik "Tambah Node Baru" di atas.' : ''}
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const reading = device.latestReading;
                  const statusLevel = reading?.statusLevel || "AMAN";

                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {device.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          {device.nodeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {device.locationName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {device.kelurahan ? `Kel. ${device.kelurahan}` : "-"}
                          {device.rwId ? ` • RW ${device.rwId}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {device.picUser ? (
                          <div>
                            <div className="font-medium text-xs text-slate-800 dark:text-slate-200">
                              {device.picUser.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {device.picUser.phone || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reading ? (
                          <span
                            className={`font-bold text-base ${
                              statusLevel === "BAHAYA"
                                ? "text-red-600 dark:text-red-400"
                                : statusLevel === "WASPADA"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {Number(reading.nilaiPpm).toLocaleString("id-ID")}
                            <span className="text-xs font-normal text-slate-400 ml-1">ppm</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reading ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              statusLevel === "BAHAYA"
                                ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 animate-pulse"
                                : statusLevel === "WASPADA"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {statusLevel === "BAHAYA" && <Flame className="w-3 h-3" />}
                            {statusLevel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Tanpa Data</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {reading ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <Thermometer className="w-3 h-3 text-slate-400" />
                              <span>{reading.suhu ?? "-"}°C</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <Droplets className="w-3 h-3 text-slate-400" />
                              <span>{reading.kelembaban ?? "-"}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <BatteryCharging className="w-3 h-3 text-slate-400" />
                              <span>{reading.baterai ?? "-"}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {reading ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(reading.timestamp).toLocaleTimeString("id-ID")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewHistory(device)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                            title="Lihat Grafik Riwayat"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          {isTechOrAdmin && (
                            <>
                              <button
                                onClick={() => setKeyModalDevice(device)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Lihat / Salin API Key"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(device)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Edit Perangkat"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDevice(device.id, device.name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Perangkat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Perangkat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                {editingDevice ? "Edit Perangkat IoT" : "Tambah Node Sensor Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDevice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Perangkat Node *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sensor Metana TPS Sadang Serang"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Node (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generate jika kosong"
                    value={formData.nodeCode}
                    onChange={(e) => setFormData({ ...formData, nodeCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Aktif)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</option>
                    <option value="INACTIVE">INACTIVE (Non-Aktif)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lokasi / Tempat Sampah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tempat Sampah TPS Terpadu RW 05"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelurahan
                  </label>
                  <select
                    value={formData.kelurahan || "Dago"}
                    onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {COBLONG_KELURAHANS.map((kel) => (
                      <option key={kel} value={kel}>
                        {kel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor RW
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.rwId || 1}
                    onChange={(e) => setFormData({ ...formData, rwId: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* PIC Petugas Lapangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIC Petugas Lapangan
                </label>
                <select
                  value={formData.picUserId || ""}
                  onChange={(e) => setFormData({ ...formData, picUserId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Pilih Petugas PIC (Opsional) --</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} {off.role?.name ? `(${off.role.name})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Petugas PIC akan menerima notifikasi darurat langsung ketika sensor mencapai level BAHAYA.
                </p>
              </div>

              {/* Koordinat GPS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                💡 Tip: Anda dapat langsung mengklik titik pada peta di belakang modal ini untuk mengisi koordinat otomatis.
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all"
                >
                  Simpan Perangkat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Grafik Riwayat Sensor (Recharts) */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Grafik Riwayat Telemetri: {selectedDeviceForHistory.nodeCode}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDeviceForHistory.name} • {selectedDeviceForHistory.locationName}
                </p>
              </div>
              <button
                onClick={() => setSelectedDeviceForHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loadingHistory ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : historyReadings.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 italic">
                  Belum ada log telemetri untuk perangkat ini.
                </div>
              ) : (
                <>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={historyReadings.map((r) => ({
                          time: new Date(r.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }),
                          ppm: Number(r.nilaiPpm),
                          suhu: r.suhu ? Number(r.suhu) : null,
                          kelembaban: r.kelembaban ? Number(r.kelembaban) : null,
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="ch4Gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="time" textAnchor="end" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            borderRadius: "8px",
                            border: "none",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ppm"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#ch4Gradient)"
                          name="Konsentrasi CH4 (ppm)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <p className="text-slate-400">Ambang Batas Aman</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">&lt; 1.000 ppm</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <p className="text-slate-400">Ambang Batas Waspada</p>
                      <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">1.000 - 4.999 ppm</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <p className="text-slate-400">Ambang Batas Bahaya</p>
                      <p className="font-bold text-red-600 dark:text-red-400 text-sm mt-0.5">≥ 5.000 ppm</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Salin / Regenerasi API Key */}
      {keyModalDevice && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Kredensial API Key Perangkat
              </h3>
              <button
                onClick={() => setKeyModalDevice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Node: <strong>{keyModalDevice.nodeCode}</strong> ({keyModalDevice.name})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gunakan API Key ini pada firmware Arduino/ESP32 atau skrip emulator:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={keyModalDevice.apiKey}
                  className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-emerald-400 outline-none"
                />
                <button
                  onClick={() => copyToClipboard(keyModalDevice.apiKey)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  Salin
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRegenerateKey(keyModalDevice.id)}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  Regenerasi API Key Baru
                </button>
                <button
                  type="button"
                  onClick={() => setKeyModalDevice(null)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenIotPage;
