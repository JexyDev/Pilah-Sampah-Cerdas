import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  HardDriveDownload,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  iotWebservice,
  type IoTDevice,
} from "../../services/iotService";
import { IotPageHeader } from "../../components/IoT/IotPageHeader";
import { IotDeviceModal } from "../../components/IoT/IotDeviceModal";
import { IotFirmwareModal } from "../../components/IoT/IotFirmwareModal";

export const IotPerangkatPage: React.FC = () => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);

  const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
  const [targetFirmwareDevice, setTargetFirmwareDevice] = useState<IoTDevice | null>(null);

  const [deviceToDelete, setDeviceToDelete] = useState<IoTDevice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Devices
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const devList = await iotWebservice.getDevices();
      setDevices(devList);
    } catch (err) {
      console.error("Gagal memuat data perangkat:", err);
      toast.error("Gagal memuat data perangkat IoT");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Device (Create or Update)
  const handleSaveDevice = async (formData: Partial<IoTDevice>) => {
    try {
      if (editingDevice) {
        await iotWebservice.updateDevice(editingDevice.id, formData);
        toast.success(`Perangkat ${formData.name} berhasil diperbarui.`);
      } else {
        await iotWebservice.createDevice(formData);
        toast.success(`Perangkat baru ${formData.name} berhasil didaftarkan.`);
      }
      setIsDeviceModalOpen(false);
      setEditingDevice(null);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal menyimpan data perangkat";
      toast.error(msg);
      throw err;
    }
  };

  // Handle OTA Firmware Update
  const handleOtaUpdate = async (targetVersion: string) => {
    if (!targetFirmwareDevice) return;
    try {
      await iotWebservice.updateFirmwareOta(targetFirmwareDevice.id, targetVersion);
      toast.success(`Firmware ${targetFirmwareDevice.nodeCode} berhasil diupdate ke v${targetVersion}.`);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal update firmware OTA";
      toast.error(msg);
      throw err;
    }
  };

  // Handle Delete Device
  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      setIsDeleting(true);
      await iotWebservice.deleteDevice(deviceToDelete.id);
      toast.success(`Perangkat ${deviceToDelete.name} berhasil dihapus.`);
      setDeviceToDelete(null);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal menghapus perangkat";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      d.name.toLowerCase().includes(q) ||
      d.nodeCode.toLowerCase().includes(q) ||
      d.locationName.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE"
        ? devIsActive(d)
        : !devIsActive(d));
    return matchQuery && matchStatus;
  });

  function devIsActive(d: IoTDevice): boolean {
    return d.isOnline || d.status === "ACTIVE";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <IotPageHeader
        title="Perangkat"
        description="Inventaris dan manajemen operasional perangkat keras sensor gas metana Internet of Things"
        icon={Cpu}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingDevice(null);
                setIsDeviceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Perangkat</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Segarkan daftar perangkat"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        }
      />

      {/* FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode perangkat, nama, atau lokasi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Mengirim Data)</option>
            <option value="INACTIVE">Tidak Aktif (Terputus)</option>
          </select>
        </div>
      </div>

      {/* DEVICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Kode Perangkat</th>
                <th className="py-3.5 px-4">Nama Perangkat</th>
                <th className="py-3.5 px-4">Lokasi Penempatan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Firmware</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Memuat daftar inventaris perangkat...</span>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <Cpu className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-500">Tidak ada perangkat IoT yang ditemukan</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDevice(null);
                        setIsDeviceModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Daftarkan Perangkat Pertama</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev) => {
                  const isActive = devIsActive(dev);
                  return (
                    <tr key={dev.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kode Perangkat */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80 text-[11px]">
                          {dev.nodeCode}
                        </span>
                      </td>

                      {/* Nama Perangkat */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {dev.name}
                      </td>

                      {/* Lokasi Penempatan */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{dev.locationName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {dev.latitude != null &&
                          !isNaN(Number(dev.latitude)) &&
                          dev.longitude != null &&
                          !isNaN(Number(dev.longitude))
                            ? `${Number(dev.latitude).toFixed(5)}, ${Number(dev.longitude).toFixed(5)}`
                            : "Koordinat belum diatur"}
                        </div>
                      </td>

                      {/* Status Otomatis */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                          >
                            {isActive ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                        {dev.lastSeenAt ? (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            Denyut: {new Date(dev.lastSeenAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })} WIB
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1 italic">
                            Belum ada denyut
                          </div>
                        )}
                      </td>

                      {/* Firmware & OTA Button */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                            v{dev.firmwareVersion || "1.0.0"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetFirmwareDevice(dev);
                              setIsFirmwareModalOpen(true);
                            }}
                            className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Pembaruan Firmware Nirkabel (OTA)"
                          >
                            <HardDriveDownload className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDevice(dev);
                              setIsDeviceModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Sunting Perangkat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeviceToDelete(dev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Perangkat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* DEVICE MODAL */}
      <IotDeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => {
          setIsDeviceModalOpen(false);
          setEditingDevice(null);
        }}
        onSubmit={handleSaveDevice}
        device={editingDevice}
      />

      {/* FIRMWARE MODAL */}
      <IotFirmwareModal
        isOpen={isFirmwareModalOpen}
        onClose={() => {
          setIsFirmwareModalOpen(false);
          setTargetFirmwareDevice(null);
        }}
        onConfirm={handleOtaUpdate}
        device={targetFirmwareDevice}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Perangkat IoT?</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus perangkat{" "}
              <strong className="text-slate-900 font-semibold">{deviceToDelete.name}</strong> (
              <span className="font-mono text-slate-700">{deviceToDelete.nodeCode}</span>)?
              Seluruh riwayat pembacaan sensor terkait juga akan dibersihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeviceToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDevice}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IotPerangkatPage;
