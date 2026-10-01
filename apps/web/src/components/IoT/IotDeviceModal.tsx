import React, { useState, useEffect } from "react";
import { X, Cpu, MapPin, LocateFixed } from "lucide-react";
import type { IoTDevice } from "../../services/iotService";

interface IotDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IoTDevice>) => Promise<void>;
  device: IoTDevice | null;
}

export const IotDeviceModal: React.FC<IotDeviceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  device,
}) => {
  const [formData, setFormData] = useState<Partial<IoTDevice>>({
    name: "",
    nodeCode: "",
    locationName: "",
    latitude: -6.8722,
    longitude: 107.5422,
    useSensorGps: true,
    sensorRadius: 50,
    firmwareVersion: "1.0.0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || "",
        nodeCode: device.nodeCode || "",
        locationName: device.locationName || "",
        latitude: Number(device.latitude) || -6.8722,
        longitude: Number(device.longitude) || 107.5422,
        useSensorGps: device.useSensorGps ?? true,
        sensorRadius: device.sensorRadius || 50,
        firmwareVersion: device.firmwareVersion || "1.0.0",
      });
    } else {
      setFormData({
        name: "",
        nodeCode: `NODE-${Math.floor(100 + Math.random() * 900)}`,
        locationName: "",
        latitude: -6.8722,
        longitude: 107.5422,
        useSensorGps: true,
        sensorRadius: 50,
        firmwareVersion: "1.0.0",
      });
    }
    setErrorMsg(null);
  }, [device, isOpen]);

  if (!isOpen) return null;

  const handleGetAutoLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Peramban Anda tidak mendukung sensor GPS Geolocation.");
      return;
    }
    setIsDetectingLocation(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn("Gagal deteksi GPS:", err);
        setErrorMsg(`Gagal mendeteksi lokasi GPS: ${err.message}`);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.locationName?.trim()) {
      setErrorMsg("Nama perangkat dan nama lokasi penempatan wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menyimpan data perangkat");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {device ? "Sunting Data Perangkat" : "Daftarkan Perangkat IoT Baru"}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Konfigurasi node sensor CH₄ dan integrasi modul geospasial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kode Perangkat */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Perangkat
              </label>
              <input
                type="text"
                value={formData.nodeCode || ""}
                onChange={(e) => setFormData({ ...formData, nodeCode: e.target.value.toUpperCase() })}
                placeholder="Contoh: NODE-CH4-01"
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all"
              />
            </div>

            {/* Nama Perangkat */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perangkat
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Sensor Metana TPS Pasar Antri"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Lokasi Penempatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lokasi Penempatan
            </label>
            <input
              type="text"
              value={formData.locationName || ""}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="Contoh: TPS Pasar Antri Baru, Jl. Sriwijaya"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 transition-all"
            />
          </div>

          {/* Koordinat Geografis & Toggle Lokasi Sensor GPS */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <LocateFixed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Ambil Lokasi dari Sensor GPS</span>
                    {formData.useSensorGps ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                        Aktif (Otomatis)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded-md">
                        Nonaktif (Manual)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formData.useSensorGps
                      ? "Koordinat otomatis diambil & disinkronkan dari payload data sensor GPS telemetri"
                      : "Koordinat fisik Tempat Sampah diisi manual oleh pengguna"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!formData.useSensorGps && (
                  <button
                    type="button"
                    onClick={handleGetAutoLocation}
                    disabled={isDetectingLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Deteksi koordinat GPS sekarang via browser"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isDetectingLocation ? "animate-spin text-emerald-600" : ""}`} />
                    <span>{isDetectingLocation ? "Mendeteksi..." : "Deteksi GPS"}</span>
                  </button>
                )}

                {/* Toggle On/Off Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.useSensorGps}
                  onClick={() => setFormData({ ...formData, useSensorGps: !formData.useSensorGps })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.useSensorGps ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                  title={formData.useSensorGps ? "Ubah ke Input Manual" : "Aktifkan Sinkronisasi Sensor GPS"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.useSensorGps ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Latitude (Garis Lintang)</span>
                  {formData.useSensorGps && (
                    <span className="text-[10px] text-emerald-600 font-normal ml-auto">(Sensor GPS)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  readOnly={formData.useSensorGps}
                  value={formData.latitude ?? ""}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  required
                  placeholder={formData.useSensorGps ? "Otomatis dari sensor..." : "Contoh: -6.8722"}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    formData.useSensorGps
                      ? "bg-slate-100 text-slate-500 border-dashed border-slate-300 cursor-not-allowed select-none"
                      : "bg-white text-slate-800 border-slate-200 focus:outline-emerald-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Longitude (Garis Bujur)</span>
                  {formData.useSensorGps && (
                    <span className="text-[10px] text-emerald-600 font-normal ml-auto">(Sensor GPS)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  readOnly={formData.useSensorGps}
                  value={formData.longitude ?? ""}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  required
                  placeholder={formData.useSensorGps ? "Otomatis dari sensor..." : "Contoh: 107.5422"}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    formData.useSensorGps
                      ? "bg-slate-100 text-slate-500 border-dashed border-slate-300 cursor-not-allowed select-none"
                      : "bg-white text-slate-800 border-slate-200 focus:outline-emerald-500"
                  }`}
                />
              </div>
            </div>

            {formData.useSensorGps ? (
              <p className="text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                Titik koordinat diperbarui secara otomatis dari modul GPS perangkat saat mengirim data telemetri.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 bg-slate-100/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                Mode manual aktif: Titik koordinat bersifat statis sesuai input Anda dan tidak akan ditimpa sinyal GPS.
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : device ? "Simpan Perubahan" : "Daftarkan Perangkat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IotDeviceModal;
