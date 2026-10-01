import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  Flame,
  Clock,
  Radio,
  Sliders,
  Shield,
  Key,
  Save,
  RefreshCw,
  Lock,
  Check,
  AlertTriangle,
  Send,
  Play,
  Square,
  Cpu,
  MapPin,
  Eye,
  EyeOff,
  Database,
  Layers,
  Shuffle,
  Activity,
  Sparkles,
  CheckCircle2,
  Server,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  iotWebservice,
  type IoTSystemConfig,
  type IoTDevice,
  type SystemRecommendation,
  type GeminiModelInfo,
  type SimulatorStatus,
} from "../../services/iotService";
import { IotPageHeader } from "../../components/IoT/IotPageHeader";

const IOT_SUBPAGES = [
  {
    key: "iot_monitoring",
    name: "Monitoring",
    path: "/iot/monitoring",
    desc: "Pemantauan telemetri waktu nyata, flip cards, peta sebaran satelit, dan rekomendasi sistem",
  },
  {
    key: "iot_data_sensor",
    name: "Data Sensor",
    path: "/iot/data-sensor",
    desc: "Akses riwayat log telemetri, penelusuran data bertumpuk, dan ekspor laporan data CSV",
  },
  {
    key: "iot_perangkat",
    name: "Perangkat",
    path: "/iot/perangkat",
    desc: "Inventaris hardware node, koordinat GPS dinamis, status koneksi, dan OTA firmware update",
  },
  {
    key: "iot_konfigurasi",
    name: "Konfigurasi",
    path: "/iot/konfigurasi",
    desc: "Pengaturan ambang batas baku mutu, simulator telemetri, integrasi MQTT, dan hak akses IoT",
  },
];

const ROLES_LIST = [
  { role: "DEVELOPER", label: "Developer Sistem", isPermanent: true },
  { role: "SUPER_USER", label: "Super Admin", isPermanent: false },
  { role: "ADMIN_DLH", label: "Admin DLH Kota", isPermanent: false },
  { role: "PIMPINAN", label: "Pimpinan / Eksekutif", isPermanent: false },
  { role: "CAMAT", label: "Camat", isPermanent: false },
  { role: "LURAH", label: "Lurah", isPermanent: false },
  { role: "RW", label: "Pengurus RW", isPermanent: false },
  { role: "PETUGAS_PENGANGKUTAN", label: "Petugas Pengangkutan", isPermanent: false },
  { role: "PETUGAS_RESIDU", label: "Petugas Residu", isPermanent: false },
  { role: "PETUGAS_PEMILAHAN", label: "Petugas Pemilahan", isPermanent: false },
  { role: "MAHASISWA_KKN", label: "Mahasiswa KKN", isPermanent: false },
  { role: "WARGA", label: "Warga Masyarakat", isPermanent: false },
];

export const IotKonfigurasiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ambang" | "emulator" | "mqtt" | "analisis" | "rbac">("ambang");
  const [config, setConfig] = useState<IoTSystemConfig | null>(null);
  const [devices, setDevices] = useState<IoTDevice[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form State
  const [thresholdNormalMax, setThresholdNormalMax] = useState<number>(1000);
  const [thresholdWarningMax, setThresholdWarningMax] = useState<number>(5000);
  const [offlineTimeoutMinutes, setOfflineTimeoutMinutes] = useState<number>(15);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState<string>("mqtt://broker.emqx.io:1883");
  const [mqttTopicCh4, setMqttTopicCh4] = useState<string>("berseka/iot/ch4/telemetry");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [geminiModel, setGeminiModel] = useState<string>("gemini-3.1-flash-lite");
  const [rbacPermissions, setRbacPermissions] = useState<Record<string, string[]>>({});

  // Simulator State
  const [simDeviceId, setSimDeviceId] = useState<string>("");
  const [simCh4, setSimCh4] = useState<number>(420);
  const [simBaterai, setSimBaterai] = useState<number>(95);
  const [simRssi, setSimRssi] = useState<number>(-68);
  const [simLat, setSimLat] = useState<number>(-6.8722);
  const [simLng, setSimLng] = useState<number>(107.5422);
  const [simRandomFluctuation, setSimRandomFluctuation] = useState<boolean>(true);
  // Interval pengiriman telemetri (satuan: menit, default: 15 menit)
  const [streamIntervalMinutes, setStreamIntervalMinutes] = useState<number>(15);
  const [simResponseLog, setSimResponseLog] = useState<string | null>(null);
  const [isSimSending, setIsSimSending] = useState<boolean>(false);

  // Background Simulator Service (Server-side persistent stream)
  const [backendSimStatus, setBackendSimStatus] = useState<SimulatorStatus | null>(null);
  const [isStartingSim, setIsStartingSim] = useState<boolean>(false);
  const [isStoppingSim, setIsStoppingSim] = useState<boolean>(false);

  // States untuk pengujian dan validasi model Gemini
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [testAiResult, setTestAiResult] = useState<SystemRecommendation | null>(null);
  const [geminiModels, setGeminiModels] = useState<GeminiModelInfo[]>([]);
  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [keyValidationMsg, setKeyValidationMsg] = useState<string>("");
  const [recommendedModel, setRecommendedModel] = useState<string>("gemini-1.5-flash");

  // Mutable ref to eliminate stale closure during stream intervals
  const simStateRef = useRef({
    deviceId: simDeviceId,
    ch4: simCh4,
    baterai: simBaterai,
    rssi: simRssi,
    lat: simLat,
    lng: simLng,
    randomFluctuation: simRandomFluctuation,
  });

  useEffect(() => {
    simStateRef.current = {
      deviceId: simDeviceId,
      ch4: simCh4,
      baterai: simBaterai,
      rssi: simRssi,
      lat: simLat,
      lng: simLng,
      randomFluctuation: simRandomFluctuation,
    };
  }, [simDeviceId, simCh4, simBaterai, simRssi, simLat, simLng, simRandomFluctuation]);

  // Load Config & Devices
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cfg, devList, simStatus] = await Promise.all([
        iotWebservice.getConfig(),
        iotWebservice.getDevices(),
        iotWebservice.getSimulatorStatus().catch(() => null),
      ]);
      setConfig(cfg);
      setDevices(devList);

      if (simStatus) {
        setBackendSimStatus(simStatus);
        if (simStatus.isActive && simStatus.deviceId) {
          setSimDeviceId(simStatus.deviceId);
          setStreamIntervalMinutes(simStatus.intervalMinutes || 15);
        }
      }

      if (devList.length > 0 && !simDeviceId) {
        setSimDeviceId(devList[0].id);
        setSimLat(Number(devList[0].latitude) || -6.8722);
        setSimLng(Number(devList[0].longitude) || 107.5422);
      }

      setThresholdNormalMax(cfg.thresholdNormalMax || 1000);
      setThresholdWarningMax(cfg.thresholdWarningMax || 5000);
      setOfflineTimeoutMinutes(cfg.offlineTimeoutMinutes || 15);
      setMqttBrokerUrl(cfg.mqttBrokerUrl || "mqtt://broker.emqx.io:1883");
      setMqttTopicCh4(cfg.mqttTopicCh4 || "berseka/iot/ch4/telemetry");
      setGeminiApiKey(cfg.geminiApiKey || "");
      setGeminiModel(cfg.geminiModel || "gemini-3.1-flash-lite");
      setRbacPermissions(cfg.rbacPermissions || {});

      // Jika ada API Key tersimpan, muat daftar model resmi secara background
      if (cfg.geminiApiKey && cfg.geminiApiKey.trim().length > 10) {
        iotWebservice
          .validateGeminiApiKey(cfg.geminiApiKey.trim())
          .then((res) => {
            setGeminiModels(res.models);
            setRecommendedModel(res.recommendedModel);
            setKeyValidationStatus("valid");
            setKeyValidationMsg(`Kunci terverifikasi! ${res.totalModels} model Gemini resmi tersedia.`);
          })
          .catch(() => {
            // silent fail on initial background check
          });
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi IoT:", err);
      toast.error("Gagal memuat konfigurasi sistem");
    } finally {
      setIsLoading(false);
    }
  }, [simDeviceId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Save Configuration
  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      const updated = await iotWebservice.updateConfig({
        thresholdNormalMax,
        thresholdWarningMax,
        offlineTimeoutMinutes,
        mqttBrokerUrl,
        mqttTopicCh4,
        geminiApiKey: geminiApiKey.trim() || null,
        geminiModel,
        rbacPermissions,
      });
      setConfig(updated);
      toast.success("Konfigurasi sistem IoT berhasil diperbarui.");
    } catch (err: any) {
      console.error("Gagal menyimpan konfigurasi:", err);
      toast.error(err?.response?.data?.message || err?.message || "Gagal menyimpan konfigurasi");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle RBAC Permission for specific IoT sub-page
  const handleToggleRbac = (pageKey: string, role: string) => {
    if (role === "DEVELOPER") return; // DEVELOPER is permanently locked

    setRbacPermissions((prev) => {
      const currentAllowed = prev[pageKey] || ["DEVELOPER", "SUPER_USER"];
      const isAllowed = currentAllowed.includes(role);

      let nextAllowed: string[];
      if (isAllowed) {
        nextAllowed = currentAllowed.filter((r) => r !== role);
      } else {
        nextAllowed = [...currentAllowed, role];
      }

      // Ensure DEVELOPER is always preserved
      if (!nextAllowed.includes("DEVELOPER")) {
        nextAllowed.unshift("DEVELOPER");
      }

      return {
        ...prev,
        [pageKey]: nextAllowed,
      };
    });
  };

  // Send Emulator Telemetry Pulse (Mendukung pengiriman manual 1x maupun streaming dinamis acak)
  const handleSendSimulatorPulse = async (isStreaming = false) => {
    const current = simStateRef.current;
    const isAll = current.deviceId === "all";
    const targetDevs = isAll
      ? devices.filter((d) => d.apiKey)
      : [devices.find((d) => d.id === current.deviceId) || devices[0]].filter(Boolean);

    if (targetDevs.length === 0 || !targetDevs[0]?.apiKey) {
      toast.error("Pilih perangkat dengan API Key yang valid.");
      return;
    }

    try {
      setIsSimSending(true);

      if (isAll) {
        let sentCount = 0;
        for (const d of targetDevs) {
          const ppm = Math.round(150 + Math.random() * 2500);
          await iotWebservice.ingestReading({
            apiKey: d.apiKey!,
            nilaiPpm: ppm,
            baterai: Math.round(75 + Math.random() * 20),
            rssi: Math.round(-85 + Math.random() * 20),
            latitude: Number(d.latitude) || -6.8722,
            longitude: Number(d.longitude) || 107.5422,
            lokasiName: d.locationName,
          });
          sentCount++;
        }
        setSimResponseLog(
          `[${new Date().toLocaleTimeString()}] Multi-Node Streaming: Berhasil mengirim ${sentCount} paket telemetri ke semua node aktif.`
        );
        toast.success(`Telemetri berhasil dikirim ke ${sentCount} perangkat aktif.`);
        return;
      }

      const targetDev = targetDevs[0];
      let nextCh4 = current.ch4;
      let nextBaterai = current.baterai;
      let nextRssi = current.rssi;
      let nextLat = current.lat;
      let nextLng = current.lng;

      // Berikan fluktuasi acak alami jika streaming aktif dan opsi acak diaktifkan
      if (isStreaming && current.randomFluctuation) {
        const delta = Math.round((Math.random() - 0.48) * 50);
        nextCh4 = Math.max(50, Math.min(8000, nextCh4 + delta));

        const deltaRssi = Math.round((Math.random() - 0.5) * 3);
        nextRssi = Math.max(-105, Math.min(-45, nextRssi + deltaRssi));

        if (Math.random() > 0.85 && nextBaterai > 15) {
          nextBaterai = Math.max(10, nextBaterai - 1);
        }
      }

      // Perbarui ref segera untuk interval berikutnya
      simStateRef.current.ch4 = nextCh4;
      simStateRef.current.baterai = nextBaterai;
      simStateRef.current.rssi = nextRssi;
      simStateRef.current.lat = nextLat;
      simStateRef.current.lng = nextLng;

      // Sinkronkan state React agar slider dan preview JSON bergerak interaktif
      setSimCh4(nextCh4);
      setSimBaterai(nextBaterai);
      setSimRssi(nextRssi);
      setSimLat(nextLat);
      setSimLng(nextLng);

      const res = await iotWebservice.ingestReading({
        apiKey: targetDev.apiKey!,
        nilaiPpm: nextCh4,
        baterai: nextBaterai,
        rssi: nextRssi,
        latitude: nextLat,
        longitude: nextLng,
        lokasiName: targetDev.locationName,
      });

      setSimResponseLog(
        `[${new Date().toLocaleTimeString()}] Node: ${targetDev.nodeCode} | CH₄: ${res.nilaiPpm} ppm (${res.statusLevel}) | Bat: ${nextBaterai}% | RSSI: ${nextRssi} dBm | GPS: ${nextLat}, ${nextLng}`
      );

      if (!isStreaming) {
        toast.success(`Telemetri ${res.nilaiPpm} ppm terkirim ke ${targetDev.nodeCode}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal mengirimkan telemetri");
    } finally {
      setIsSimSending(false);
    }
  };

  // Helper Preset & Randomizer Seketika
  const handleApplyPreset = (level: "normal" | "warning" | "danger") => {
    let newCh4 = 420;
    if (level === "normal") newCh4 = Math.round(250 + Math.random() * 400);
    if (level === "warning") newCh4 = Math.round(1500 + Math.random() * 1500);
    if (level === "danger") newCh4 = Math.round(5500 + Math.random() * 2000);

    setSimCh4(newCh4);
    simStateRef.current.ch4 = newCh4;
    toast.success(`Preset ${level.toUpperCase()} diterapkan: ${newCh4} ppm`);
  };

  const handleRandomizeImmediate = () => {
    const rCh4 = Math.round(100 + Math.random() * 6500);
    const rBat = Math.round(60 + Math.random() * 38);
    const rRssi = Math.round(-95 + Math.random() * 35);
    setSimCh4(rCh4);
    setSimBaterai(rBat);
    setSimRssi(rRssi);
    simStateRef.current.ch4 = rCh4;
    simStateRef.current.baterai = rBat;
    simStateRef.current.rssi = rRssi;
    toast.success(`Nilai acak diterapkan: ${rCh4} ppm | Bat ${rBat}% | RSSI ${rRssi} dBm`);
  };

  // Uji coba & verifikasi integrasi mesin rekomendasi cerdas secara langsung
  const handleTestRecommendation = async () => {
    try {
      setIsTestingAi(true);
      // Simpan config terkini terlebih dahulu agar API key dan model langsung aktif di backend
      await iotWebservice.updateConfig({
        geminiApiKey: geminiApiKey.trim() || null,
        geminiModel: geminiModel.trim() || "gemini-3.1-flash-lite",
      });

      const res = await iotWebservice.getSystemRecommendation(true);
      setTestAiResult(res);

      if (res.modelAnalisis && res.modelAnalisis !== "Standar Baku Mutu") {
        toast.success(`Integrasi Cerdas Aktif! Model: ${res.modelAnalisis}`);
      } else {
        toast.success("Mesin evaluasi aktif dalam mode Standar Baku Mutu Lingkungan.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menguji mesin rekomendasi");
    } finally {
      setIsTestingAi(false);
    }
  };

  const [isSavingAi, setIsSavingAi] = useState<boolean>(false);
  const handleSaveAiConfig = async () => {
    try {
      setIsSavingAi(true);
      await iotWebservice.updateConfig({
        geminiApiKey: geminiApiKey.trim() || null,
        geminiModel: geminiModel.trim() || "gemini-3.1-flash-lite",
      });
      toast.success("Pengaturan Gemini AI berhasil disimpan");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menyimpan pengaturan AI");
    } finally {
      setIsSavingAi(false);
    }
  };

  // Polling status background simulation service di backend setiap 5 detik
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const fetchSimStatus = async () => {
      try {
        const status = await iotWebservice.getSimulatorStatus();
        setBackendSimStatus(status);
      } catch (e) {
        // silent fail on polling
      }
    };

    if (activeTab === "simulator" || backendSimStatus?.isActive) {
      timer = setInterval(fetchSimStatus, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, backendSimStatus?.isActive]);

  // Handler Memulai Simulator Background Service di Server
  const handleStartBackendSimulation = async () => {
    if (!simDeviceId) {
      toast.error("Pilih Tempat Sampah (Node) terlebih dahulu!");
      return;
    }
    try {
      setIsStartingSim(true);
      const isAll = simDeviceId === "all";
      const res = await iotWebservice.startSimulator({
        deviceId: isAll ? undefined : simDeviceId,
        deviceIds: isAll ? "all" : undefined,
        intervalMinutes: streamIntervalMinutes,
      });
      setBackendSimStatus(res);
      toast.success(
        `Aliran otomatis background server aktif! Berjalan untuk ${res.targetDeviceCount || 1} perangkat tiap ${res.intervalMinutes} menit.`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal memulai background service");
    } finally {
      setIsStartingSim(false);
    }
  };

  // Handler Menghentikan Simulator Background Service di Server
  const handleStopBackendSimulation = async () => {
    try {
      setIsStoppingSim(true);
      const res = await iotWebservice.stopSimulator();
      setBackendSimStatus(res);
      toast.success("Aliran otomatis background server berhasil dihentikan.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menghentikan background service");
    } finally {
      setIsStoppingSim(false);
    }
  };

  // Validasi Google Gemini API Key & Muat Daftar Model Resmi
  const handleValidateGeminiKey = async (customKey?: string) => {
    const key = (customKey ?? geminiApiKey).trim();
    if (!key) {
      toast.error("Masukkan API Key Google Gemini terlebih dahulu");
      return;
    }
    try {
      setIsValidatingKey(true);
      setKeyValidationMsg("");
      const res = await iotWebservice.validateGeminiApiKey(key);
      setGeminiModels(res.models);
      setRecommendedModel(res.recommendedModel);
      setKeyValidationStatus("valid");
      setKeyValidationMsg(`Kunci valid! ${res.totalModels} model Gemini resmi tersedia.`);

      const selectedM =
        !geminiModel || !res.models.some((m) => m.id === geminiModel)
          ? res.recommendedModel
          : geminiModel;
      if (selectedM !== geminiModel) {
        setGeminiModel(selectedM);
      }

      await iotWebservice.updateConfig({
        geminiApiKey: key,
        geminiModel: selectedM,
      });

      toast.success(`Kunci Valid & Tersimpan! ${res.totalModels} model resmi ditemukan.`);
    } catch (err: any) {
      setKeyValidationStatus("invalid");
      const msg = err?.response?.data?.message || err?.message || "Validasi API Key Google Gemini gagal";
      setKeyValidationMsg(msg);
      toast.error(msg);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const targetDev = devices.find((d) => d.id === simDeviceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <IotPageHeader
        title="Konfigurasi"
        description="Pengaturan ambang batas baku mutu, simulator telemetri, integrasi jaringan, dan manajemen hak akses grup IoT"
        icon={Settings}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
              <span>{isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}</span>
            </button>
            <button
              type="button"
              onClick={loadInitialData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Muat ulang pengaturan"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        }
      />

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-xs flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: "ambang", label: "Ambang Batas & Sensor", icon: Flame },
            { id: "emulator", label: "Simulator Telemetri", icon: Sliders },
            { id: "mqtt", label: "Integrasi Jaringan & MQTT", icon: Radio },
            { id: "analisis", label: "Rekomendasi Cerdas", icon: Cpu },
            { id: "rbac", label: "Hak Akses Grup IoT", icon: Shield },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: AMBANG BATAS & OPERASIONAL */}
      {activeTab === "ambang" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Standar Ambang Batas Konsentrasi Gas Metana (CH₄)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi batas klasifikasi status kualitas udara lingkungan operasional berbasis standar baku mutu
              </p>
            </div>

            <div className="space-y-4">
              {/* Normal Threshold */}
              <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Batas Maksimal Kategori Normal
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 w-32">
                    <input
                      type="number"
                      value={thresholdNormalMax}
                      onChange={(e) => setThresholdNormalMax(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs font-mono font-bold text-right rounded-lg border border-emerald-300 bg-white focus:outline-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-800">ppm</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Konsentrasi di bawah angka ini dikategorikan aman tanpa potensi bahaya maupun akumulasi anaerobik berlebih.
                </p>
              </div>

              {/* Warning Threshold */}
              <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Batas Maksimal Kategori Peringatan (Waspada)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 w-32">
                    <input
                      type="number"
                      value={thresholdWarningMax}
                      onChange={(e) => setThresholdWarningMax(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs font-mono font-bold text-right rounded-lg border border-amber-300 bg-white focus:outline-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-800">ppm</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Konsentrasi antara rentang Normal dan angka ini memicu status Waspada. Nilai di atas angka ini secara otomatis diklasifikasikan sebagai{" "}
                  <strong className="text-rose-600 font-bold">Bahaya (&ge; {thresholdWarningMax} ppm)</strong>.
                </p>
              </div>

              {/* Heartbeat Timeout */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Batas Waktu Timeout Heartbeat (Offline)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 w-32">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={offlineTimeoutMinutes}
                      onChange={(e) => setOfflineTimeoutMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs font-mono font-bold text-right rounded-lg border border-slate-300 bg-white focus:outline-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">menit</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Preset Cepat:</span>
                  {[30, 60, 120, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOfflineTimeoutMinutes(m)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-all cursor-pointer ${
                        offlineTimeoutMinutes === m
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {m} Menit
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Perangkat yang tidak mengirimkan paket telemetri melampaui durasi ini akan ditandai Offline. Jika sensor mengirim tiap 60 menit, setel minimal 70 - 120 menit.
                </p>
              </div>
            </div>
          </div>

          {/* Standards Reference Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Layers className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Rujukan Baku Mutu & Fisika Lingkungan
              </h4>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-normal">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <strong className="text-slate-800 block text-xs mb-1">
                  1. Rasio Lower Explosive Limit (LEL)
                </strong>
                Metana murni memiliki ambang batas bawah ledakan sebesar 5% volume di udara (ekuivalen 50.000 ppm). Ambang waspada 1.000 ppm berada pada faktor keselamatan 50x LEL.
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <strong className="text-slate-800 block text-xs mb-1">
                  2. Konversi Satuan Internasional
                </strong>
                {"ppm = (mg/m³) × (24.45 / M_CH₄)"}
                <br />
                Dengan massa molar M(CH₄) = 16.04 g/mol pada kondisi standar 25 °C dan 1 atm.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SIMULATOR TELEMETRI DINAMIS */}
      {activeTab === "emulator" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Simulator Telemetri Sensor & GPS Real-Time
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Uji coba transmisi data paket telemetri secara interaktif tanpa memerlukan perangkat keras fisik
              </p>
            </div>

            {/* Target Node Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Node Target:</span>
              <select
                value={simDeviceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSimDeviceId(val);
                  if (val !== "all") {
                    const dev = devices.find((d) => d.id === val);
                    if (dev) {
                      setSimLat(Number(dev.latitude) || -6.8722);
                      setSimLng(Number(dev.longitude) || 107.5422);
                    }
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-emerald-500 cursor-pointer"
              >
                <option value="all" className="font-bold text-emerald-700">
                  Semua Perangkat (Aliran Otomatis Multi-Node)
                </option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.nodeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Streaming Indicator Banner (Server-side background service) */}
          {backendSimStatus?.isActive && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="font-bold flex items-center gap-1.5 flex-wrap">
                    <Server className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Background Service Server Aktif</span>
                    {backendSimStatus.isAllDevices || (backendSimStatus.targetDeviceCount && backendSimStatus.targetDeviceCount > 1) ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200/90 font-mono text-[11px] font-bold text-emerald-900 border border-emerald-300">
                        Multi-Node ({backendSimStatus.targetDeviceCount} Perangkat Simultan)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 font-mono text-[11px] font-bold text-emerald-800">
                        {backendSimStatus.nodeCode || "Node"} ({backendSimStatus.deviceName})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {backendSimStatus.isAllDevices || (backendSimStatus.targetDeviceCount && backendSimStatus.targetDeviceCount > 1)
                      ? `Mengalirkan denyut telemetri mandiri ke ${backendSimStatus.targetDeviceCount} sensor Tempat Sampah secara serentak di server.`
                      : "Tetap berjalan otomatis di server backend meskipun tab peramban ditutup atau berpindah halaman."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono shrink-0 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-slate-500 font-sans">Total Paket:</span>{" "}
                  <span className="font-bold text-emerald-800">
                    {backendSimStatus.totalReadingsSent ?? backendSimStatus.pulseCount}
                  </span>
                </div>
                <div className="border-l border-emerald-200 pl-3">
                  <span className="text-slate-500 font-sans">Denyut:</span>{" "}
                  <span className="font-bold text-emerald-800">#{backendSimStatus.pulseCount}</span>
                </div>
                <div className="border-l border-emerald-200 pl-3">
                  <span className="text-slate-500 font-sans">Terkini:</span>{" "}
                  <span className="font-bold text-purple-700">{backendSimStatus.currentPpm} ppm</span>
                </div>
                <div className="border-l border-emerald-200 pl-3">
                  <span className="text-slate-500 font-sans">Interval:</span>{" "}
                  <span className="font-bold text-emerald-900">{backendSimStatus.intervalMinutes}m</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sliders Control Panel */}
            <div className="space-y-4">
              {/* Quick Presets & Randomizer */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Preset Baku Mutu:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("normal")}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80 transition-colors cursor-pointer"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("warning")}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-amber-100/80 text-amber-800 hover:bg-amber-200/80 transition-colors cursor-pointer"
                >
                  Waspada
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("danger")}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-rose-100/80 text-rose-800 hover:bg-rose-200/80 transition-colors cursor-pointer"
                >
                  Bahaya
                </button>
                <button
                  type="button"
                  onClick={handleRandomizeImmediate}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Acak Seketika</span>
                </button>
              </div>

              {/* CH4 Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>Konsentrasi Gas Metana (CH₄)</span>
                  </span>
                  <span className="text-sm font-mono font-extrabold text-emerald-700">
                    {simCh4} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="8000"
                  step="50"
                  value={simCh4}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSimCh4(val);
                    simStateRef.current.ch4 = val;
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Baterai & RSSI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Baterai Node</span>
                    <span className="font-mono font-bold">{simBaterai} %</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={simBaterai}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimBaterai(val);
                      simStateRef.current.baterai = val;
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Sinyal (RSSI)</span>
                    <span className="font-mono font-bold">{simRssi} dBm</span>
                  </div>
                  <input
                    type="range"
                    min="-110"
                    max="-35"
                    step="1"
                    value={simRssi}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimRssi(val);
                      simStateRef.current.rssi = val;
                    }}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Random Fluctuation & GPS Drift Toggles */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Fluktuasi Acak Dinamis saat Streaming
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Otomatis memberikan variasi nilai acak alami pada CH₄ & RSSI tiap interval stream
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={simRandomFluctuation}
                    onChange={(e) => {
                      setSimRandomFluctuation(e.target.checked);
                      simStateRef.current.randomFluctuation = e.target.checked;
                    }}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Live Payload Preview & Ingestion Log */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <span>POST /api/v1/iot/readings/ingest</span>
                  <span className="text-emerald-400 font-bold">JSON Payload</span>
                </div>
                <pre className="text-emerald-300">
                  {JSON.stringify(
                    {
                      apiKey: targetDev?.apiKey ? `${targetDev.apiKey.slice(0, 8)}...` : "NO_KEY",
                      nilaiPpm: simCh4,
                      baterai: simBaterai,
                      rssi: simRssi,
                      latitude: simLat,
                      longitude: simLng,
                      lokasiName: targetDev?.locationName || "TPS Pasar Antri",
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {simResponseLog && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono">
                  {simResponseLog}
                </div>
              )}

              {/* Pengaturan Interval Streaming Telemetri */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Interval Pengiriman Telemetri (Menit)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Periode waktu pengiriman data sensor berkala otomatis dari Tempat Sampah ke server (Default: 60 menit)
                    </p>
                  </div>

                  {/* Manual Input Angka (Bisa Diketik Bebas) */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-purple-500 transition-all">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        disabled={backendSimStatus?.isActive}
                        value={streamIntervalMinutes}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setStreamIntervalMinutes(isNaN(val) ? 60 : val);
                        }}
                        className="w-16 text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-hidden text-right disabled:opacity-50"
                        placeholder="60"
                      />
                      <span className="text-xs font-bold text-purple-700 select-none">menit</span>
                    </div>
                  </div>
                </div>

                {/* Quick Selection Presets (Bisa Milih Cepat) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Pilihan Cepat:</span>
                  {[
                    { label: "15 Menit (Default)", val: 15 },
                    { label: "30 Menit", val: 30 },
                    { label: "60 Menit (1 Jam)", val: 60 },
                    { label: "120 Menit (2 Jam)", val: 120 },
                    { label: "360 Menit (6 Jam)", val: 360 },
                    { label: "1440 Menit (24 Jam)", val: 1440 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      disabled={backendSimStatus?.isActive}
                      onClick={() => setStreamIntervalMinutes(p.val)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        streamIntervalMinutes === p.val
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      } ${backendSimStatus?.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSimSending}
                  onClick={() => handleSendSimulatorPulse(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSimSending ? "Mengirimkan..." : "Kirim 1x Telemetri"}</span>
                </button>

                <button
                  type="button"
                  disabled={isStartingSim || isStoppingSim}
                  onClick={() => {
                    if (backendSimStatus?.isActive) {
                      handleStopBackendSimulation();
                    } else {
                      handleStartBackendSimulation();
                    }
                  }}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    backendSimStatus?.isActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {backendSimStatus?.isActive ? (
                    <>
                      {isStoppingSim ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Square className="w-4 h-4 fill-white" />
                      )}
                      <span>
                        {isStoppingSim
                          ? "Menghentikan Server..."
                          : `Hentikan Aliran Server (${backendSimStatus.intervalMinutes} Menit)`}
                      </span>
                    </>
                  ) : (
                    <>
                      {isStartingSim ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-700" />
                      )}
                      <span>
                        {isStartingSim
                          ? "Memulai di Server..."
                          : `Mulai Aliran Server (${streamIntervalMinutes} Menit)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INTEGRASI JARINGAN & MQTT */}
      {activeTab === "mqtt" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Koneksi Broker MQTT & Integrasi Hardware
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Parameter koneksi protokol Message Queuing Telemetry Transport untuk transmisi data mikrokontroler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL / Host Broker MQTT
              </label>
              <input
                type="text"
                value={mqttBrokerUrl}
                onChange={(e) => setMqttBrokerUrl(e.target.value)}
                placeholder="Contoh: mqtt://broker.emqx.io:1883"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topik Publikasi Telemetri CH₄
              </label>
              <input
                type="text"
                value={mqttTopicCh4}
                onChange={(e) => setMqttTopicCh4(e.target.value)}
                placeholder="Contoh: berseka/iot/ch4/telemetry"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Firmware Code Snippet */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Contoh Cuplikan Payload ESP32 / Arduino C++:
            </div>
            <pre className="text-emerald-400">
{`// Struktur Payload Telemetri JSON
StaticJsonDocument<256> doc;
doc["apiKey"] = "PSC-IOT-SECRET-KEY";
doc["nilaiPpm"] = sensorCh4Reading;
doc["baterai"] = readBatteryPercentage();
doc["rssi"] = WiFi.RSSI();
doc["latitude"] = gps.location.lat();
doc["longitude"] = gps.location.lng();

char buffer[256];
serializeJson(doc, buffer);
mqttClient.publish("${mqttTopicCh4}", buffer);`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: ANALISIS SISTEM CERDAS */}
      {activeTab === "analisis" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pengaturan Mesin Rekomendasi Cerdas Sistem
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Konfigurasi model penalaran sintesis polutan, baku mutu lingkungan, dan saran mitigasi operasional
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  geminiApiKey && geminiApiKey.trim().length > 10
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>
                  {geminiApiKey && geminiApiKey.trim().length > 10
                    ? "Google Gemini AI (Aktif)"
                    : "Standar Baku Mutu (Aktif Otomatis)"}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Kunci Akses API (Google Gemini API Key)
                </label>
                {keyValidationStatus === "valid" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                )}
                {keyValidationStatus === "invalid" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                    <XCircle className="w-3.5 h-3.5" />
                    Kunci Tidak Valid
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    setKeyValidationStatus("idle");
                  }}
                  placeholder="AIzaSy..."
                  className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-purple-500 bg-slate-50 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showApiKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isValidatingKey || !geminiApiKey.trim()}
                  onClick={() => handleValidateGeminiKey()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidatingKey ? "animate-spin" : ""}`} />
                  <span>{isValidatingKey ? "Memvalidasi & Memuat Model..." : "Validasi Kunci & Ambil Model"}</span>
                </button>
              </div>

              {keyValidationMsg ? (
                <p
                  className={`text-[11px] mt-1.5 font-medium ${
                    keyValidationStatus === "valid"
                      ? "text-emerald-600"
                      : keyValidationStatus === "invalid"
                      ? "text-rose-600"
                      : "text-slate-400"
                  }`}
                >
                  {keyValidationMsg}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Kunci akses tersimpan aman di server. Klik "Validasi Kunci & Ambil Model" untuk memastikan kuota aktif dan memuat pilihan model resmi akun Anda.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Model Analisis Gemini
                </label>
                {geminiModels.length > 0 && (
                  <span className="text-[11px] font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {geminiModels.length} Model Tersedia
                  </span>
                )}
              </div>

              {geminiModels.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-purple-300 bg-purple-50/40 text-slate-900 focus:outline-purple-500 font-semibold cursor-pointer"
                    >
                      {geminiModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} {m.isRecommended ? `★ (${m.recommendationLabel})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Penjelasan Rekomendasi Terbaik */}
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-[11px] text-purple-900 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-purple-800">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Saran Model Terbaik: {recommendedModel}</span>
                    </div>
                    <p className="text-purple-800/90 font-sans">
                      Model <strong className="font-mono">{recommendedModel}</strong> adalah pilihan paling optimal untuk analisis telemetri Tempat Sampah karena memiliki latensi inferensi tercepat (&lt; 1.2 detik), keandalan penalaran tinggi, serta penggunaan kuota token paling efisien.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">Pilihan Cepat:</span>
                    <div className="flex items-center gap-1">
                      {["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setGeminiModel(m)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                            geminiModel === m
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {m.replace("gemini-", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    placeholder="Contoh: gemini-3.1-flash-lite"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-purple-500 bg-slate-50 focus:bg-white transition-all"
                  />
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    <span className="font-semibold block mb-0.5">Daftar model belum divalidasi:</span>
                    Klik <strong>"Validasi Kunci & Ambil Model"</strong> pada kolom kiri untuk memuat seluruh daftar model resmi yang diizinkan untuk API Key Anda. Rekomendasi terbaik: <strong className="font-mono">gemini-3.1-flash-lite</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test & Verification Action */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verifikasi Status & Uji Evaluasi Langsung</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menyimpan konfigurasi dan memicu evaluasi langsung terhadap data telemetri terkini sistem
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSavingAi}
                onClick={handleSaveAiConfig}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 ${isSavingAi ? "animate-spin text-purple-600" : "text-slate-500"}`} />
                <span>{isSavingAi ? "Menyimpan..." : "Simpan Pengaturan AI"}</span>
              </button>
              <button
                type="button"
                disabled={isTestingAi}
                onClick={handleTestRecommendation}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? "animate-spin" : ""}`} />
                <span>{isTestingAi ? "Mengevaluasi..." : "Uji Mesin Rekomendasi"}</span>
              </button>
            </div>
          </div>

          {/* Test Result Preview */}
          {testAiResult && (
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3 transition-all animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-900">
                    Hasil Uji Evaluasi Sistem
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-900 font-semibold font-mono">
                    Model: {testAiResult.modelAnalisis}
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 font-mono">
                  {testAiResult.dianalisisPada ? new Date(testAiResult.dianalisisPada).toLocaleTimeString("id-ID") : ""}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Ringkasan Kondisi:</span>
                  <p className="text-slate-600 leading-relaxed">{testAiResult.ringkasanKondisi}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Evaluasi Fisika & Kimia Lingkungan:</span>
                  <p className="text-slate-600 leading-relaxed">{testAiResult.evaluasiFisikaKimia}</p>
                </div>
                {testAiResult.langkahPenangananSop && testAiResult.langkahPenangananSop.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Rekomendasi SOP Tindakan Lapangan:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {testAiResult.langkahPenangananSop.slice(0, 3).map((sop, idx) => (
                        <li key={idx}>{sop}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: MANAJEMEN HAK AKSES KHUSUS GRUP IOT (RBAC) */}
      {/* User instruction: 'Manajemen Fitur itu cuman khusus untuk group Internet of Things aja' */}
      {activeTab === "rbac" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Manajemen Hak Akses Khusus Grup Internet of Things
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Konfigurasi otorisasi peran (RBAC) khusus untuk 4 sub-halaman di dalam kelompok menu Internet of Things
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>DEVELOPER: Full Akses Permanen</span>
            </div>
          </div>

          {/* RBAC Table Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-72">Sub-Halaman IoT</th>
                    {ROLES_LIST.map((r) => (
                      <th key={r.role} className="py-3 px-3 text-center whitespace-nowrap">
                        <div>{r.label}</div>
                        <div className="text-[9px] text-slate-400 font-mono font-normal">
                          {r.role}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {IOT_SUBPAGES.map((page) => {
                    const allowedForPage = rbacPermissions[page.key] || ["DEVELOPER", "SUPER_USER"];

                    return (
                      <tr key={page.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{page.name}</div>
                          <div className="font-mono text-[10px] text-emerald-700">{page.path}</div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            {page.desc}
                          </div>
                        </td>

                        {ROLES_LIST.map((r) => {
                          const isDeveloper = r.role === "DEVELOPER";
                          const isAllowed = isDeveloper || allowedForPage.includes(r.role);

                          return (
                            <td key={r.role} className="py-3 px-3 text-center">
                              {isDeveloper ? (
                                <div
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700"
                                  title="Akses Penuh Permanen (Tidak dapat diubah)"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAllowed}
                                    onChange={() => handleToggleRbac(page.key, r.role)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IotKonfigurasiPage;
