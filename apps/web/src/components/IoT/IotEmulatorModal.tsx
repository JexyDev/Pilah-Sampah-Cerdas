import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Square,
  Send,
  Radio,
  Sliders,
  Compass,
  Battery,
  Flame,
  Wifi,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { iotWebservice } from "../../services/iotService";
import type { IoTDevice } from "../../services/iotService";

interface IotEmulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: IoTDevice[];
  onDataSent?: () => void;
}

export const IotEmulatorModal: React.FC<IotEmulatorModalProps> = ({
  isOpen,
  onClose,
  devices,
  onDataSent,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [ch4Ppm, setCh4Ppm] = useState<number>(450);
  const [baterai, setBaterai] = useState<number>(94);
  const [rssi, setRssi] = useState<number>(-65);
  const [latitude, setLatitude] = useState<number>(-6.8722);
  const [longitude, setLongitude] = useState<number>(107.5422);
  const [autoStreamIntervalMinutes, setAutoStreamIntervalMinutes] = useState<number | null>(null);
  const [streamIntervalMinutes, setStreamIntervalMinutes] = useState<number>(60);

  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const intervalRef = useRef<any>(null);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (selectedDevice) {
      setLatitude(Number(selectedDevice.latitude) || -6.8722);
      setLongitude(Number(selectedDevice.longitude) || 107.5422);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const sendPayload = async (currentLat = latitude, currentLng = longitude) => {
    if (!selectedDevice?.apiKey) {
      setErrorMsg("Perangkat ini belum memiliki API Key valid.");
      return;
    }

    try {
      setIsSending(true);
      setErrorMsg(null);

      const res = await iotWebservice.ingestReading({
        apiKey: selectedDevice.apiKey,
        nilaiPpm: ch4Ppm,
        baterai,
        rssi,
        latitude: currentLat,
        longitude: currentLng,
        lokasiName: selectedDevice.locationName,
      });

      setLastResponse(
        `Sukses: ID ${res.id.slice(0, 8)} | ${res.nilaiPpm} ppm | Level: ${res.statusLevel} | Waktu: ${new Date().toLocaleTimeString()}`
      );
      if (onDataSent) onDataSent();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal mengirimkan telemetri emulator");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAutoStream = (intervalMinutes: number) => {
    if (autoStreamIntervalMinutes === intervalMinutes) {
      // Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAutoStreamIntervalMinutes(null);
    } else {
      // Start
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAutoStreamIntervalMinutes(intervalMinutes);
      sendPayload();
      const intervalMs = Math.max(1000, Math.round(intervalMinutes * 60 * 1000));
      intervalRef.current = setInterval(() => {
        // Berikan sedikit fluktuasi acak alami pada konsentrasi CH4 & baterai
        setCh4Ppm((prev) => {
          const delta = (Math.random() - 0.48) * 40;
          return Math.max(100, Math.min(10000, Math.round(prev + delta)));
        });
        sendPayload();
      }, intervalMs);
    }
  };

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAutoStreamIntervalMinutes(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulator Telemetri Node IoT (Dynamic Emulator)
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Uji transmisi data sensor CH₄ dan GPS dinamis secara langsung ke sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {lastResponse && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lastResponse}</span>
            </div>
          )}

          {/* Device Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Target Perangkat Node
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 bg-white"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.nodeCode}) — {d.locationName}
                </option>
              ))}
            </select>
          </div>

          {/* CH4 Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>Konsentrasi Gas Metana (CH₄)</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ch4Ppm >= 5000
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : ch4Ppm >= 1000
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {ch4Ppm >= 5000 ? "Bahaya" : ch4Ppm >= 1000 ? "Peringatan" : "Normal"}
                </span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  {ch4Ppm} ppm
                </span>
              </div>
            </div>
            <input
              type="range"
              min="50"
              max="8000"
              step="50"
              value={ch4Ppm}
              onChange={(e) => setCh4Ppm(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50 ppm (Udara Bersih)</span>
              <span className="text-amber-600 font-bold">1.000 ppm (Ambang Waspada)</span>
              <span className="text-rose-600 font-bold">5.000 ppm (Ambang Bahaya)</span>
              <span>8.000 ppm</span>
            </div>
          </div>

          {/* Multi-parameter Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Baterai */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Daya Baterai Node</span>
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">{baterai} %</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={baterai}
                onChange={(e) => setBaterai(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* RSSI */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-purple-500" />
                  <span>Sinyal (RSSI)</span>
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">{rssi} dBm</span>
              </div>
              <input
                type="range"
                min="-110"
                max="-35"
                step="1"
                value={rssi}
                onChange={(e) => setRssi(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Koordinat Lokasi TPS */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Koordinat Lokasi TPS (Sensor Statis)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Titik penempatan sensor tetap pada fisik Tempat Sampah (TPS)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Latitude (DD):</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Longitude (DD):</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Continuous stream button and interval in minutes */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Interval:</span>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  disabled={autoStreamIntervalMinutes !== null}
                  value={streamIntervalMinutes}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setStreamIntervalMinutes(isNaN(v) ? 60 : v);
                  }}
                  className="w-14 text-xs font-mono font-bold text-right text-slate-800 focus:outline-hidden"
                  placeholder="60"
                />
                <span className="text-[11px] font-bold text-purple-700 select-none">menit</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[
                { label: "15m", val: 15 },
                { label: "30m", val: 30 },
                { label: "60m (Default)", val: 60 },
                { label: "120m", val: 120 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  disabled={autoStreamIntervalMinutes !== null}
                  onClick={() => setStreamIntervalMinutes(p.val)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    streamIntervalMinutes === p.val
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } ${autoStreamIntervalMinutes !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleToggleAutoStream(streamIntervalMinutes)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                autoStreamIntervalMinutes
                  ? "bg-purple-600 text-white shadow-xs ring-2 ring-purple-300"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {autoStreamIntervalMinutes ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Hentikan ({autoStreamIntervalMinutes} Menit)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                  <span>Kirim Rutin ({streamIntervalMinutes} Menit)</span>
                </>
              )}
            </button>
          </div>

          {/* Manual Pulse Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() => sendPayload()}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Mengirim..." : "Kirim 1x Telemetri"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IotEmulatorModal;
