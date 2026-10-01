import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Search,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  Radio,
  MapPin,
  Flame,
  Battery,
  Wifi,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  iotWebservice,
  type CH4Reading,
  type IoTDevice,
  type ReadingsPagination,
} from "../../services/iotService";
import { IotPageHeader } from "../../components/IoT/IotPageHeader";

export const IotDataSensorPage: React.FC = () => {
  const [readings, setReadings] = useState<CH4Reading[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [pagination, setPagination] = useState<ReadingsPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load Devices for filter
  const loadDevices = useCallback(async () => {
    try {
      const data = await iotWebservice.getDevices();
      setDevices(data);
    } catch (err) {
      console.error("Gagal memuat perangkat:", err);
    }
  }, []);

  // Load Readings Table Data
  const loadReadings = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        const params: {
          page: number;
          limit: number;
          deviceId?: string;
          search?: string;
          startDate?: string;
          endDate?: string;
        } = {
          page: pageToLoad,
          limit: 20,
        };

        if (selectedDeviceId !== "all") params.deviceId = selectedDeviceId;
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (startDate) params.startDate = new Date(startDate).toISOString();
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          params.endDate = end.toISOString();
        }

        const res = await iotWebservice.getReadings(params);
        setReadings(res?.data || []);
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error("Gagal memuat data telemetri sensor:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDeviceId, searchQuery, startDate, endDate]
  );

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    loadReadings(1);
  }, [loadReadings]);

  // Export CSV Handler
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params: {
        deviceId?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      if (selectedDeviceId !== "all") params.deviceId = selectedDeviceId;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }

      await iotWebservice.downloadExportCsv(params);
      toast.success("Laporan data telemetri (.csv) berhasil diunduh.");
    } catch (err) {
      console.error("Gagal mengunduh CSV:", err);
      toast.error("Gagal mengunduh berkas laporan CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper date formatting
  const formatTimeStacked = (isoString: string) => {
    const d = new Date(isoString);
    const timeStr = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateStr = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { timeStr: `${timeStr} WIB`, dateStr };
  };

  // Status Badge Helper
  const getStatusBadge = (status: "NORMAL" | "WARNING" | "DANGER") => {
    switch (status) {
      case "DANGER":
        return {
          label: "Bahaya",
          style: "bg-rose-100 text-rose-800 border-rose-300",
        };
      case "WARNING":
        return {
          label: "Waspada",
          style: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "NORMAL":
      default:
        return {
          label: "Normal",
          style: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IotPageHeader
        title="Data Sensor"
        description="Riwayat log telemetri transmisi sensor metana dan kondisi operasional seluruh perangkat"
        icon={Database}
        actions={
          <div className="flex items-center gap-2">
            {/* Tombol icon "Laporan Data" (per user prompt) */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Unduh laporan telemetri dalam format CSV resmi"
            >
              <FileSpreadsheet className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "Mengunduh..." : "Laporan Data"}</span>
            </button>

            <button
              type="button"
              onClick={() => loadReadings(pagination.page)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Segarkan data tabel"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        }
      />

      {/* FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lokasi, kode, atau status..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Node Device Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Radio className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Perangkat ({devices.length} Node)</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.nodeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 shrink-0">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Date End */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 shrink-0">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {(searchQuery || selectedDeviceId !== "all" || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Menampilkan hasil terfilter. Ditemukan total{" "}
              <strong className="text-slate-900 font-mono">{pagination.total}</strong> baris log.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedDeviceId("all");
                setStartDate("");
                setEndDate("");
              }}
              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* DATA TELEMETRY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Waktu Pencatatan</th>
                <th className="py-3.5 px-4">Kode Perangkat</th>
                <th className="py-3.5 px-4">Nama Perangkat</th>
                <th className="py-3.5 px-4">Konsentrasi CH₄</th>
                <th className="py-3.5 px-4">Koordinat GPS</th>
                <th className="py-3.5 px-4">Baterai</th>
                <th className="py-3.5 px-4">Sinyal (RSSI)</th>
                <th className="py-3.5 px-4">Lokasi Penempatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Memuat log data telemetri...</span>
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-1">
                    <Database className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-500">Belum ada rekaman data telemetri</p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan fitur Simulator Sensor di menu Monitoring untuk menguji aliran data
                    </p>
                  </td>
                </tr>
              ) : (
                readings.map((row) => {
                  const { timeStr, dateStr } = formatTimeStacked(row.timestamp);
                  const badge = getStatusBadge(row.statusLevel);
                  const latNum =
                    row.latitude != null && !isNaN(Number(row.latitude))
                      ? Number(row.latitude)
                      : null;
                  const lngNum =
                    row.longitude != null && !isNaN(Number(row.longitude))
                      ? Number(row.longitude)
                      : null;
                  const hasCoordinates =
                    latNum !== null && lngNum !== null && (latNum !== 0 || lngNum !== 0);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Waktu Bertumpuk: Atas HH:mm:ss, Bawah DD MMMM YYYY */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {timeStr}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {dateStr}
                        </div>
                      </td>

                      {/* Kode Perangkat */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80 text-[11px]">
                          {row.device?.nodeCode || "-"}
                        </span>
                      </td>

                      {/* Nama Perangkat */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {row.device?.name || "Node Sensor"}
                      </td>

                      {/* Konsentrasi CH4 (ppm) + Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            {row.nilaiPpm}{" "}
                            <span className="text-[10px] font-normal text-slate-500">ppm</span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </td>

                      {/* Koordinat GPS: LAT & LONG */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {hasCoordinates ? (
                          <div>
                            <span className="text-slate-400 text-[10px]">Lat:</span> {latNum!.toFixed(5)}
                            <br />
                            <span className="text-slate-400 text-[10px]">Lng:</span> {lngNum!.toFixed(5)}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Static Base</span>
                        )}
                      </td>

                      {/* Baterai */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                          <Battery
                            className={`w-4 h-4 ${
                              (row.baterai ?? 100) < 20
                                ? "text-rose-500"
                                : (row.baterai ?? 100) < 50
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          />
                          <span>{row.baterai != null ? `${row.baterai}%` : "-"}</span>
                        </div>
                      </td>

                      {/* RSSI */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                          <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{row.rssi != null ? `${row.rssi} dBm` : "-"}</span>
                        </div>
                      </td>

                      {/* Lokasi Penempatan (Baku EYD, Tempat Sampah / TPS) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-normal">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.lokasiName || row.device?.locationName || "-"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="text-slate-500">
            Halaman <strong className="text-slate-900 font-mono">{pagination.page}</strong> dari{" "}
            <strong className="text-slate-900 font-mono">{pagination.totalPages}</strong> (Total{" "}
            <strong className="text-slate-900 font-mono">{pagination.total}</strong> rekaman)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => loadReadings(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
              {pagination.page}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => loadReadings(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IotDataSensorPage;
