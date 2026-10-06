import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radio,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Flame,
  Battery,
  Wifi,
  Clock,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  iotWebservice,
  type IoTDevice,
  type IoTTelemetrySummary,
  type SystemRecommendation,
  type IoTSystemConfig,
} from "../../services/iotService";
import { IotPageHeader } from "../../components/IoT/IotPageHeader";
import { SensorFlipCard } from "../../components/IoT/SensorFlipCard";
import { IotSatelliteMap } from "../../components/IoT/IotSatelliteMap";
import { IotTelemetryChart } from "../../components/IoT/IotTelemetryChart";
import { IotAiRecommendationCard } from "../../components/IoT/IotAiRecommendationCard";

export const IotMonitoringPage: React.FC = () => {
  const [summary, setSummary] = useState<IoTTelemetrySummary | null>(null);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [config, setConfig] = useState<IoTSystemConfig | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [recommendation, setRecommendation] = useState<SystemRecommendation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Load Devices List
  const loadDevices = useCallback(async () => {
    try {
      const data = await iotWebservice.getDevices();
      setDevices(data);
    } catch (err) {
      console.error("Gagal memuat daftar perangkat IoT:", err);
    }
  }, []);

  // Calculate start date based on filter
  const getFilterDates = useCallback(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === "24h") {
      start.setHours(start.getHours() - 24);
    } else if (timeRange === "7d") {
      start.setDate(start.getDate() - 7);
    } else if (timeRange === "30d") {
      start.setDate(start.getDate() - 30);
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [timeRange]);

  // Load Telemetry Summary
  const loadSummary = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const { startDate, endDate } = getFilterDates();
      const params: { deviceId?: string; startDate?: string; endDate?: string } = {
        startDate,
        endDate,
      };
      if (selectedDeviceId !== "all") {
        params.deviceId = selectedDeviceId;
      }
      const data = await iotWebservice.getSummary(params);
      setSummary(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Gagal memuat ringkasan telemetri IoT:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDeviceId, getFilterDates]);

  // Handle Manual Refresh with Toast Notification
  const handleManualRefresh = async () => {
    try {
      await loadSummary(true);
      toast.success("Data telemetri berhasil diperbarui");
    } catch {
      toast.error("Gagal menyegarkan data telemetri");
    }
  };

  // Load System Config (Thresholds)
  const loadConfig = useCallback(async () => {
    try {
      const cfg = await iotWebservice.getConfig();
      setConfig(cfg);
    } catch (err) {
      console.error("Gagal memuat konfigurasi sistem IoT:", err);
    }
  }, []);

  // Load Recommendation
  const loadRecommendation = useCallback(async (force = false) => {
    try {
      setIsAiLoading(true);
      const data = await iotWebservice.getRecommendations(
        force,
        selectedDeviceId !== "all" ? selectedDeviceId : undefined
      );
      setRecommendation(data);
    } catch (err) {
      console.error("Gagal memuat rekomendasi sistem:", err);
    } finally {
      setIsAiLoading(false);
    }
  }, [selectedDeviceId]);

  // Handle Refresh Recommendation with Notification
  const handleRefreshRecommendation = async () => {
    try {
      await loadRecommendation(true);
      toast.success("Rekomendasi sistem berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui rekomendasi sistem");
    }
  };

  useEffect(() => {
    loadDevices();
    loadConfig();
  }, [loadDevices, loadConfig]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  useEffect(() => {
    loadSummary(true);
  }, [loadSummary]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadSummary(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadSummary]);

  // Selected Device Object
  const currentDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  // Dynamic Thresholds from System Config
  const warningThreshold = config?.thresholdNormalMax ?? 1000;
  const dangerThreshold = config?.thresholdWarningMax ?? 5000;

  // Reading calculations for Flip Cards (murni nilai aktual 0 jika offline/kosong)
  const latest = summary?.latestReading;
  const currentCh4 =
    latest?.nilaiPpm != null ? Number(latest.nilaiPpm) : (summary?.avgCh4Ppm || 0);
  const currentBaterai =
    latest?.baterai != null ? Number(latest.baterai) : 0;
  const currentRssi =
    latest?.rssi != null ? Number(latest.rssi) : 0;

  // Status Level Badge (Dinamis dari ambang batas sistem)
  const ch4Status =
    latest?.statusLevel ||
    (currentCh4 >= dangerThreshold
      ? "DANGER"
      : currentCh4 >= warningThreshold
      ? "WARNING"
      : "NORMAL");

  const ch4BadgeVariant =
    ch4Status === "DANGER" ? "danger" : ch4Status === "WARNING" ? "warning" : "success";
  const ch4BadgeLabel =
    ch4Status === "DANGER" ? "Bahaya" : ch4Status === "WARNING" ? "Waspada" : "Normal";

  const batteryVariant =
    currentBaterai < 20 ? "danger" : currentBaterai < 50 ? "warning" : "success";
  const batteryLabel =
    currentBaterai < 20 ? "Kritis" : currentBaterai < 50 ? "Sedang" : "Optimal";

  const rssiVariant =
    currentRssi < -95 ? "danger" : currentRssi < -80 ? "warning" : "success";
  const rssiLabel =
    currentRssi < -95 ? "Lemah" : currentRssi < -80 ? "Cukup" : "Kuat";

  // Sparklines formatting dengan sinkronisasi zona waktu WIB
  const sparklines = useMemo(() => {
    return (summary?.sparklines || []).map((s) => {
      let clientTime = s.time;
      if (s.timestamp) {
        const d = new Date(s.timestamp);
        if (!isNaN(d.getTime())) {
          clientTime = d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          });
        }
      }
      return {
        ...s,
        time: clientTime,
      };
    });
  }, [summary?.sparklines]);

  const ch4Sparkline = sparklines.map((s) => ({
    time: s.time,
    value: s.ch4Ppm,
  }));
  const batSparkline = sparklines.map((s) => ({
    time: s.time,
    value: s.baterai ?? 0,
  }));
  const rssiSparkline = sparklines.map((s) => ({
    time: s.time,
    value: s.rssi ?? -100,
  }));

  // Header Actions Toolbar (Simetris seragam h-10)
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Device Filter */}
      <div className="h-10 flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 shadow-2xs transition-colors">
        <Radio className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="h-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer pr-1"
        >
          <option value="all">Semua Perangkat ({devices.length} Perangkat)</option>
          {devices.length === 0 ? (
            <option value="" disabled>
              Tidak ada perangkat
            </option>
          ) : (
            devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.nodeCode})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Time Range Filter */}
      <div className="h-10 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
        <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
        {(
          [
            { id: "24h", label: "24 Jam" },
            { id: "7d", label: "7 Hari" },
            { id: "30d", label: "30 Hari" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTimeRange(tab.id)}
            className={`h-full px-2.5 flex items-center text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeRange === tab.id
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Manual Refresh Button with Notification */}
      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
        title="Segarkan data sekarang"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Standard Page Header */}
      <IotPageHeader
        title="Monitoring"
        description="Pemantauan data sensor dan kondisi konsentrasi gas metana pada seluruh wilayah operasional"
        icon={Radio}
        badgeText="Dalam Pengembangan"
        actions={headerActions}
      />

      {/* Notice Banner: Tahap Pengembangan & Pengujian Lapangan */}
      <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-emerald-50/60 border border-amber-200/90 rounded-2xl p-4 sm:p-4.5 flex items-start sm:items-center gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-amber-950 tracking-tight">
              Modul IoT Dalam Tahap Pengembangan & Pengujian Lapangan
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 tracking-wider">
              Pilot Project
            </span>
          </div>
          <p className="text-xs text-amber-800/95 mt-0.5 leading-relaxed">
            Sistem pemantauan sensor gas metana (CH₄) dan telemetri perangkat ini sedang dalam tahap pengembangan aktif dengan data simulator prototipe wilayah Coblong.
          </p>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Perangkat Sensor
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary?.totalDevices ?? devices.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">Perangkat</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tersebar di {summary?.devices?.length || devices.length} lokasi TPS/wilayah
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perangkat Aktif / Online
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {summary?.activeDevices ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {summary?.totalDevices ?? devices.length} Perangkat
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{summary?.offlineDevices ?? 0} Perangkat Terputus (Timeout)</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Puncak CH₄ Terukur
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary?.maxCh4Ppm != null ? summary.maxCh4Ppm : "-"}
            </span>
            <span className="text-xs text-slate-500 font-semibold">ppm</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Ambang bahaya baku mutu: 5.000 ppm
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Konsentrasi
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {summary?.avgCh4Ppm != null ? summary.avgCh4Ppm : "-"}
            </span>
            <span className="text-xs text-slate-500 font-semibold">ppm</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Rerata terukur baku mutu lingkungan
          </div>
        </div>
      </div>

      {/* SECTION 1: TELEMETRI SENSOR (3D Flip Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Telemetri Sensor Waktu Nyata
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Sinkronisasi:{" "}
              {lastRefreshedAt.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Jakarta",
              })}{" "}
              WIB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flip Card 1: CH4 */}
          <SensorFlipCard
            title="Gas Metana (CH₄)"
            value={currentCh4}
            unit="ppm"
            icon={Flame}
            colorScheme={ch4BadgeVariant === "danger" ? "rose" : ch4BadgeVariant === "warning" ? "amber" : "emerald"}
            statusBadge={{
              label: ch4BadgeLabel,
              variant: ch4BadgeVariant,
            }}
            trend={{
              direction: currentCh4 > 1000 ? "up" : "flat",
              value: `${summary?.sparklines?.length || 0} titik telemetri tercatat`,
            }}
            sparklineData={ch4Sparkline}
            statsBack={{
              avg: summary?.avgCh4Ppm != null ? `${summary.avgCh4Ppm} ppm` : "-",
              max: summary?.maxCh4Ppm != null ? `${summary.maxCh4Ppm} ppm` : "-",
              min: summary?.minCh4Ppm != null ? `${summary.minCh4Ppm} ppm` : "-",
              parameterRef: "Baku Mutu Gas Metana (CH₄)",
              standardNote: `Konsentrasi batas bawah ledakan (LEL) metana adalah 5% (50.000 ppm). Ambang waspada diset pada ${warningThreshold.toLocaleString("id-ID")} ppm dan ambang bahaya pada ${dangerThreshold.toLocaleString("id-ID")} ppm.`,
            }}
          />

          {/* Flip Card 2: Baterai */}
          <SensorFlipCard
            title="Daya Baterai"
            value={currentBaterai}
            unit="%"
            icon={Battery}
            colorScheme="blue"
            statusBadge={{
              label: batteryLabel,
              variant: batteryVariant,
            }}
            trend={{
              direction: "flat",
              value: "Manajemen Siklus Catu Daya Sensor",
            }}
            sparklineData={batSparkline}
            statsBack={{
              avg: `${currentBaterai}%`,
              max: "100%",
              min: "15%",
              parameterRef: "Spesifikasi Catu Daya",
              standardNote:
                "Tegangan operasional optimal 3.7V - 4.2V. Dilengkapi sirkuit proteksi over-discharge dan pemanen energi surya.",
            }}
          />

          {/* Flip Card 3: Sinyal RSSI */}
          <SensorFlipCard
            title="Kekuatan Jaringan (RSSI)"
            value={currentRssi}
            unit="dBm"
            icon={Wifi}
            colorScheme="indigo"
            statusBadge={{
              label: rssiLabel,
              variant: rssiVariant,
            }}
            trend={{
              direction: "flat",
              value: "Protokol: MQTT",
            }}
            sparklineData={rssiSparkline}
            statsBack={{
              avg: `${currentRssi} dBm`,
              max: "-50 dBm",
              min: "-110 dBm",
              parameterRef: "Spesifikasi Jaringan Nirkabel",
              standardNote:
                "Sinyal di atas -80 dBm menjamin latensi rendah dan transmisi paket telemetri tanpa kehilangan data (packet loss < 0.1%).",
            }}
          />
        </div>
      </div>

      {/* SECTION 2: KONDISI WILAYAH (Peta Satelit Leaflet) */}
      <IotSatelliteMap
        devices={summary?.devices || devices}
        selectedDevice={currentDevice}
        onSelectDevice={(dev) => setSelectedDeviceId(dev ? dev.id : "all")}
        heightClass="h-[460px]"
        warningThreshold={warningThreshold}
        dangerThreshold={dangerThreshold}
      />

      {/* SECTION 3: GRAFIK TELEMETRI TIME-SERIES */}
      <IotTelemetryChart
        data={sparklines}
        heightClass="h-80"
        warningThreshold={warningThreshold}
        dangerThreshold={dangerThreshold}
      />

      {/* SECTION 4: REKOMENDASI SISTEM */}
      <IotAiRecommendationCard
        recommendation={recommendation}
        isLoading={isAiLoading}
        onRefresh={handleRefreshRecommendation}
      />
    </div>
  );
};

export default IotMonitoringPage;
