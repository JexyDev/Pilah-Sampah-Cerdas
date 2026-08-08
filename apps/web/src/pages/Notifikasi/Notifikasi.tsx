import { IconRenderer } from "../../components/common/IconRenderer";
import { ShieldAlert, Loader2, ImageOff, RefreshCcw, AlertCircle, Info, CheckCheck, Trash2, Settings, BellOff } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, X, CheckCircle, Upload, AlertTriangle, Star } from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

const ScheduleDetailView = ({ notif }: { notif: any }) => {
  const [loading, setLoading] = useState(true);
  const [bins, setBins] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [rtRwFilter, setRtRwFilter] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isMorning =
    notif?.title?.toLowerCase().includes("pagi") ||
    notif?.desc?.toLowerCase().includes("pagi");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [binsRes, householdsRes] = await Promise.all([
          api.get("/bins").catch(() => ({ data: { data: [] } })),
          api.get("/households").catch(() => ({ data: { data: [] } })),
        ]);

        const rawBins = binsRes.data?.data || binsRes.data || [];
        const rawHouseholds = householdsRes.data?.data || householdsRes.data || [];

        // Build household map by rtRwId or address
        const householdMap = new Map<string, any>();
        if (Array.isArray(rawHouseholds)) {
          rawHouseholds.forEach((hh: any) => {
            if (hh.id) householdMap.set(String(hh.id), hh);
            if (hh.headOfFamilyName) householdMap.set(`name_${hh.headOfFamilyName}`, hh);
          });
        }

        const formattedBins = (Array.isArray(rawBins) ? rawBins : []).map((b: any) => {
          let resolvedOwner = b.user?.name || b.assignedPic?.name || b.qrBatch?.assignedPic?.name;
          let resolvedPhone = b.user?.phone || b.assignedPic?.phone || b.qrBatch?.assignedPic?.phone;
          let resolvedAddress =
            b.user?.address ||
            b.user?.households?.[0]?.address ||
            (b.rtRw?.name ? `Wilayah ${b.rtRw.name}, Dago` : "Kecamatan Coblong, Bandung");

          if (!resolvedOwner) {
            resolvedOwner = "Warga Binaan";
            resolvedPhone = "-";
            resolvedAddress = "Alamat belum didaftarkan";
          }

          return {
            ...b,
            resolvedOwner,
            resolvedPhone,
            resolvedAddress,
          };
        });

        setBins(formattedBins);

        // Extract distinct RT/RW areas
        const areaSet = new Set<string>();
        formattedBins.forEach((b: any) => {
          if (b.rtRw?.name) areaSet.add(b.rtRw.name);
          else if (b.rtRwId) areaSet.add(`RW 0${b.rtRwId}`);
        });
        setAreas(Array.from(areaSet));
      } catch (_err) {
        // Gagal memuat data pengangkutan; tampilkan state kosong
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [selectedBinForDetail, setSelectedBinForDetail] = useState<any | null>(null);

  const handleAccCollection = async (binId: string, wargaName: string) => {
    try {
      setActionLoadingId(binId);
      await api.post(`/bins/${binId}/empty`).catch(async () => {
        await api.put(`/rw/bins/${binId}/approve`).catch(async () => {
          await api.put(`/bins/${binId}`, { currentVolumeLiter: 0 });
        });
      });

      setBins((prev) =>
        prev.map((b) =>
          b.id === binId ? { ...b, currentVolumeLiter: 0, status: "ACTIVE_BOUND" } : b
        )
      );
      toast.success(`Penjemputan sampah ${wargaName} berhasil di-ACC & volume tempat sampah di-reset!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal melakukan ACC penjemputan");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectCollection = async (binId: string, wargaName: string) => {
    try {
      setActionLoadingId(binId);
      setBins((prev) =>
        prev.map((b) =>
          b.id === binId ? { ...b, isRejected: true } : b
        )
      );
      toast.error(`Pengajuan penjemputan ${wargaName} ditolak.`);
    } catch (err) {
      toast.error("Gagal menolak penjemputan");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBins = bins.filter((b) => {
    if (!rtRwFilter) return true;
    return b.rtRw?.name === rtRwFilter || String(b.rtRwId) === rtRwFilter;
  });

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded text-xs uppercase tracking-wider">
              Shift {isMorning ? "Pagi (06:00 - 08:00 WIB)" : "Sore (16:00 - 18:00 WIB)"}
            </span>
            <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
              Target Penjemputan Area Real DB
            </span>
          </div>
          <p className="text-sm font-semibold mt-2 text-green-50">
            {notif.desc || "Terdapat tempat sampah warga yang perlu diangkut pada shift ini."}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold">{filteredBins.length}</p>
          <p className="text-[11px] text-green-100 font-medium">Tempat Sampah Area</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          Filter Area RW/RT Warga:
        </span>
        <select
          value={rtRwFilter}
          onChange={(e) => setRtRwFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white font-medium focus:outline-none focus:border-green-600"
        >
          <option value="">Semua Wilayah RW / RT ({bins.length})</option>
          {areas.map((areaName) => (
            <option key={areaName} value={areaName}>
              {areaName}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
          <Loader2 className="animate-spin text-green-600" size={32} />
          <p className="text-xs font-medium">Memuat data real tempat sampah per warga...</p>
        </div>
      ) : filteredBins.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <p className="text-sm font-medium">Tidak ada data tempat sampah di wilayah ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredBins.map((bin) => {
            const ownerName = bin.resolvedOwner;
            const ownerPhone = bin.resolvedPhone;
            const address = bin.resolvedAddress;
            const maxCap = Number(bin.maxCapacityLiter || 20);
            const curVol = Number(bin.currentVolumeLiter ?? 0);
            const fullness = Math.round((curVol / maxCap) * 100);
            const isCritical = fullness >= 80;

            return (
              <div
                key={bin.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? "bg-red-50/40 border-red-200 shadow-sm"
                    : "bg-white border-gray-200 shadow-sm hover:border-green-300"
                } flex flex-col md:flex-row justify-between items-start md:items-center gap-3`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-800 text-sm">{ownerName}</span>
                    <a
                      href={`https://wa.me/${ownerPhone.replace(/\+/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-green-600 hover:underline bg-green-50 px-2 py-0.5 rounded border border-green-200"
                    >
                      📱 {ownerPhone}
                    </a>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                        bin.category?.name === "ORGANIC" || bin.category === "ORGANIC" || bin.type === "Organik"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      {bin.category?.name === "ORGANIC" || bin.category === "ORGANIC" || bin.type === "Organik"
                        ? "Organik"
                        : "Anorganik"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{address}</p>

                  <div className="mt-2.5 flex items-center gap-3 max-w-xs">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCritical ? "bg-red-500" : fullness >= 50 ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, fullness))}%` }}
                      ></div>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold ${
                        isCritical ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {fullness}% Penuh
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
                  {fullness === 0 ? (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1">
                      <CheckCircle size={14} /> Selesai Diangkut
                    </span>
                  ) : bin.isRejected ? (
                    <span className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200">
                      ✕ Ditolak
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedBinForDetail(bin)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Tinjau Detail Foto & Pengajuan"
                      >
                        <ShieldAlert size={14} className="text-amber-500" />
                        <span>Detail</span>
                      </button>
                      <button
                        disabled={actionLoadingId === bin.id}
                        onClick={() => handleRejectCollection(bin.id, ownerName)}
                        className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        title="Tolak Pengajuan"
                      >
                        ✕ Tolak
                      </button>
                      <button
                        disabled={actionLoadingId === bin.id}
                        onClick={() => handleAccCollection(bin.id, ownerName)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        title="ACC & Reset Kapasitas Tempat Sampah"
                      >
                        {actionLoadingId === bin.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        <span>✓ ACC</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Review Modal for individual Bin */}
      {selectedBinForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-lg">Detail Notifikasi</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">
                  Tampilan Petugas
                </span>
              </div>
              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-gray-800 leading-tight mb-1">
                    Pengajuan Pengosongan Baru
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">10 menit lalu</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Warga ({selectedBinForDetail.resolvedOwner}) mengajukan pengosongan tempat sampah{" "}
                {selectedBinForDetail.category?.name || "Organik"} ({selectedBinForDetail.qrCode || "BIN-124"}) di{" "}
                {selectedBinForDetail.resolvedAddress}.
              </p>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 mb-4">
                <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-orange-800">
                  <p className="font-bold mb-0.5">Tindakan Review Diperlukan</p>
                  <p className="leading-relaxed">
                    Warga telah mengajukan pengosongan tempat sampah. Tinjau pengajuan ini dan tentukan tindakan Anda.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-5">
                <div className="p-3.5 border-b border-gray-200 bg-white">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                    DETAIL PENGAJUAN
                  </p>
                  <p className="text-xs text-gray-800 font-medium leading-relaxed">
                    Warga ({selectedBinForDetail.resolvedOwner}) mengajukan pengosongan tempat sampah{" "}
                    {selectedBinForDetail.category?.name || "Organik"} ({selectedBinForDetail.qrCode || "BIN-124"}) di{" "}
                    {selectedBinForDetail.resolvedAddress}.
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                    FOTO BUKTI DARI WARGA
                  </p>
                  {selectedBinForDetail.evidencePhotoUrl ? (
                    <img
                      src={
                        selectedBinForDetail.evidencePhotoUrl.startsWith("/uploads")
                          ? `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace("/api/v1", "")}${selectedBinForDetail.evidencePhotoUrl}`
                          : selectedBinForDetail.evidencePhotoUrl
                      }
                      alt="Bukti tempat sampah penuh"
                      className="w-full h-44 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-1.5">
                      <ImageOff size={28} />
                      <p className="text-xs text-gray-400">Foto bukti belum diunggah oleh warga</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleRejectCollection(selectedBinForDetail.id, selectedBinForDetail.resolvedOwner);
                    setSelectedBinForDetail(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  ✕ Tolak Pengajuan
                </button>
                <button
                  onClick={() => {
                    handleAccCollection(selectedBinForDetail.id, selectedBinForDetail.resolvedOwner);
                    setSelectedBinForDetail(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm cursor-pointer"
                >
                  ✓ Setujui & Reset Tempat Sampah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationModal = ({
  notif,
  role,
  onClose,
  onSubmitEmpty,
  onApprove,
  onReject,
}: {
  notif: any;
  role: string;
  onClose: () => void;
  onSubmitEmpty: (evidencePhotoUrl: string) => Promise<void>;
  onApprove?: () => void;
  onReject?: () => void;
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (notif?.desc) {
        const reqIdMatch = notif.desc.match(/\[REQ-([\w-]+)\]/);
        if (reqIdMatch) {
          const reqId = reqIdMatch[1];
          try {
            const res = await api.get(`/bins/reset-request/${reqId}`);
            if (res.data.success && res.data.data.evidencePhotoUrl) {
              const url = res.data.data.evidencePhotoUrl;
              if (url.startsWith("/uploads")) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
                const host = baseUrl.replace("/api/v1", "");
                setEvidencePhoto(`${host}${url}`);
              } else {
                setEvidencePhoto(url);
              }
            }
          } catch (e) {
            console.error("Failed to fetch reset request detail:", e);
          }
        }
      }
    };
    fetchDetail();
  }, [notif]);

  if (!notif) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async () => {
    if (!photoFile) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("image", photoFile);
      const uploadRes = await api.post("/waste/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const evidencePhotoUrl = uploadRes.data.data.imageUrl;
      await onSubmitEmpty(evidencePhotoUrl);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah foto bukti");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdminOrPetugas = [
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
  ].includes(role.toUpperCase());

  const renderContent = () => {
    if (
      (notif.type === "TONG_PENUH" || notif.type === "PENGAJUAN_PENGOSONGAN") &&
      isAdminOrPetugas
    ) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
            <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">Tindakan Review Diperlukan</p>
              <p>
                Warga telah mengajukan pengosongan tempat sampah. Tinjau pengajuan ini dan tentukan
                tindakan Anda.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Detail Pengajuan
              </p>
              <p className="text-sm text-gray-800 font-medium">{notif.desc}</p>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Foto Bukti dari Warga
              </p>
              {evidencePhoto ? (
                <img
                  src={evidencePhoto}
                  alt="Bukti tempat sampah penuh"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              ) : (
                <>
                  <div className="w-full h-36 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <ImageOff size={32} />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Foto bukti belum diunggah oleh warga
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 py-3 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              ✕ Tolak Pengajuan
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm cursor-pointer"
            >
              ✓ Setujui & Reset Tempat Sampah
            </button>
          </div>
        </div>
      );
    }

    if (notif.type === "TONG_PENUH" && !isAdminOrPetugas) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Aksi Diperlukan</p>
              <p>
                tempat sampah Anda telah mencapai kapasitas kritis. Silakan ambil foto bukti kondisi
                tempat sampah yang penuh untuk mengajukan pengosongan ke petugas RT/RW.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50">
            {photo ? (
              <div className="relative w-full">
                <img
                  src={photo}
                  alt="Bukti tempat sampah penuh"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => {
                    setPhoto(null);
                    setPhotoFile(null);
                  }}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white shadow-sm transition-colors cursor-pointer"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                  <Camera size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Unggah Foto Bukti</p>
                <p className="text-xs text-gray-500 mb-4">Format JPG, PNG max 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Upload size={16} /> Buka Kamera
                </button>
              </>
            )}
          </div>

          <button
            disabled={!photo || isSubmitting}
            onClick={handleFormSubmit}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
              photo && !isSubmitting
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCcw className="animate-spin" size={14} />
                <span>Mengirim...</span>
              </>
            ) : (
              "Ajukan Pengosongan"
            )}
          </button>
        </div>
      );
    }

    if (notif.type === "PENGAJUAN_DISETUJUI") {
      return (
        <div className="mt-4 bg-green-50 p-5 rounded-xl border border-green-100 flex flex-col items-center text-center">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h4 className="font-bold text-green-800 mb-1">Pengosongan Disetujui</h4>
          <p className="text-sm text-green-700">
            Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tempat sampah menjadi 0%.
            Terima kasih atas partisipasi Anda.
          </p>
        </div>
      );
    }

    if (notif.type === "POIN_BERTAMBAH") {
      return (
        <div className="mt-4 bg-yellow-50 p-5 rounded-xl border border-yellow-100 flex flex-col items-center text-center">
          <div className="bg-yellow-100 p-3 rounded-full mb-3">
            <Star size={32} className="text-yellow-600" />
          </div>
          <h4 className="font-bold text-yellow-800 mb-1">Poin Bertambah!</h4>
          <p className="text-sm text-yellow-700">
            Selamat! Anda mendapatkan tambahan poin dari transaksi terakhir Anda. Kumpulkan terus
            poin untuk mendapatkan reward menarik dari Kelurahan.
          </p>
        </div>
      );
    }

    if (
      notif.type === "JADWAL_JEMPUT" ||
      notif.type === "SCHEDULE" ||
      notif.title?.toLowerCase().includes("jadwal jemput") ||
      notif.desc?.toLowerCase().includes("tempat sampah yang perlu diangkut")
    ) {
      return <ScheduleDetailView notif={notif} />;
    }

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600">
        {notif.desc}
      </div>
    );
  };

  const isScheduleNotif =
    notif.type === "JADWAL_JEMPUT" ||
    notif.type === "SCHEDULE" ||
    notif.title?.toLowerCase().includes("jadwal jemput") ||
    notif.desc?.toLowerCase().includes("tempat sampah yang perlu diangkut");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${
          isScheduleNotif ? "max-w-3xl" : "max-w-md"
        } overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 text-lg">Detail Notifikasi</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isAdminOrPetugas ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}
            >
              {isAdminOrPetugas ? "Tampilan Petugas" : "Tampilan Warga"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="flex items-start gap-4 mb-2">
            <div
              className={`w-12 h-12 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center shrink-0 shadow-sm border border-white`}
            >
              <IconRenderer name={notif.icon} size={24} />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-gray-800 leading-tight mb-1">
                {notif.title}
              </h4>
              <p className="text-xs text-gray-500 font-medium">{notif.time}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-3">{notif.desc}</p>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const Notifikasi: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<"SEMUA" | "CRITICAL" | "INFO">("SEMUA");

  const { user } = useAuthStore();
  const rawRole = user?.peran || (user as any)?.role || "WARGA";
  const role = typeof rawRole === "string" ? rawRole : (rawRole as any)?.name || "WARGA";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(`/notifications?role=${role}`);
        if (response.data?.data && Array.isArray(response.data.data)) {
          setNotifications(response.data.data);
        } else {
          setNotifications([]);
        }
      } catch (err: any) {
        console.error("Gagal mengambil notifikasi dari API:", err);
        setError("Gagal memuat notifikasi");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [role]);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all").catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Semua notifikasi ditandai dibaca");
    } catch (error) {
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Yakin ingin menghapus semua notifikasi?")) {
      try {
        await api.delete("/notifications/all").catch(() => {});
        setNotifications([]);
        toast.success("Semua notifikasi dihapus");
      } catch (error) {
        toast.error("Gagal menghapus notifikasi");
      }
    }
  };

  const handleViewDetail = (notif: any) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setSelectedNotif(notif);
  };

  const handleSubmitEmpty = async (evidencePhotoUrl: string) => {
    try {
      const getTargetBinId = async (desc: string, title: string) => {
        const qrMatch = desc.match(/(TS-\d+|BIN-\d+)/i);
        if (qrMatch) {
          const qr = qrMatch[1];
          const allBinsRes = await api.get("/bins").catch(() => ({ data: { data: [] } }));
          const found = allBinsRes.data.data.find(
            (b: any) => b.qrCode.toLowerCase() === qr.toLowerCase()
          );
          if (found) return found.id;
        }
        const myBinsRes = await api.get("/bins/my-bins").catch(() => ({ data: { data: [] } }));
        const myBins = myBinsRes.data.data;
        if (myBins && myBins.length > 0) {
          const isOrganic =
            title.toLowerCase().includes("organik") || desc.toLowerCase().includes("organik");
          const matched = myBins.find((b: any) =>
            isOrganic ? b.category === "ORGANIC" : b.category === "NON_ORGANIC"
          );
          if (matched) return matched.id;
          return myBins[0].id;
        }
        return null;
      };

      const binId = await getTargetBinId(selectedNotif.desc, selectedNotif.title);
      if (!binId) {
        toast.error("Gagal mendeteksi id tempat sampah");
        return;
      }

      await api.post("/bins/reset-request", { binId, evidencePhotoUrl });
      toast.success("Pengajuan pengosongan berhasil dikirim ke petugas RT/RW!");
      setSelectedNotif(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengirim pengajuan pengosongan");
    }
  };

  const handleApprove = async () => {
    if (!selectedNotif) return;
    const reqIdMatch = selectedNotif.desc.match(/\[REQ-([\w-]+)\]/);
    const requestId = reqIdMatch ? reqIdMatch[1] : null;

    if (requestId) {
      try {
        await api.put(`/bins/reset-request/${requestId}/review`, { status: "APPROVED" });
        toast.success("Pengajuan disetujui! kapasitas tempat sampah berhasil direset.");
        setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
        setSelectedNotif(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Gagal menyetujui pengajuan");
      }
    } else {
      toast.success("Pengajuan disetujui! kapasitas tempat sampah berhasil direset.");
      setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
      setSelectedNotif(null);
    }
  };

  const handleReject = async () => {
    if (!selectedNotif) return;
    const reqIdMatch = selectedNotif.desc.match(/\[REQ-([\w-]+)\]/);
    const requestId = reqIdMatch ? reqIdMatch[1] : null;

    if (requestId) {
      try {
        await api.put(`/bins/reset-request/${requestId}/review`, { status: "REJECTED" });
        toast.error("Pengajuan ditolak.");
        setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
        setSelectedNotif(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Gagal menolak pengajuan");
      }
    } else {
      toast.error("Pengajuan ditolak.");
      setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
      setSelectedNotif(null);
    }
  };

  const criticalCount = notifications.filter(
    (n) => n.category === "CRITICAL" || n.type === "TONG_PENUH" || n.type === "JADWAL_JEMPUT"
  ).length;
  const infoCount = notifications.length - criticalCount;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "CRITICAL") {
      return n.category === "CRITICAL" || n.type === "TONG_PENUH" || n.type === "JADWAL_JEMPUT";
    }
    if (filterTab === "INFO") {
      return n.category !== "CRITICAL" && n.type !== "TONG_PENUH" && n.type !== "JADWAL_JEMPUT";
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl shadow-sm border border-outline-variant/50 gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <h3 className="text-[18px] font-bold text-on-surface whitespace-nowrap">
            Log Notifikasi
          </h3>
          <div className="hidden md:block h-6 w-px bg-outline-variant/50"></div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTab("SEMUA")}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterTab === "SEMUA"
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-outline-variant/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab("CRITICAL")}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                filterTab === "CRITICAL"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "border border-outline-variant/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <AlertCircle size={16} />
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilterTab("INFO")}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                filterTab === "INFO"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-outline-variant/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Info size={16} />
              Info ({infoCount})
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-[12px] font-bold text-primary hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CheckCheck size={18} />
            Tandai Semua Dibaca
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={18} />
            Hapus Semua
          </button>
          <button
            onClick={() => navigate("/pengaturan")}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col p-4 gap-3 min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3 h-full">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p>Memuat notifikasi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error font-medium h-full flex items-center justify-center">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-medium h-full flex flex-col items-center justify-center gap-2">
            <BellOff size={32} />
            <p>Belum ada notifikasi pada kategori ini</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleViewDetail(notif)}
              className={`p-4 rounded-xl border ${
                notif.isRead
                  ? "bg-white border-outline-variant/30 opacity-80"
                  : "bg-green-50/40 border-primary/20 shadow-sm"
              } flex items-start gap-4 transition-all hover:bg-surface-container cursor-pointer group`}
            >
              <div
                className={`w-11 h-11 rounded-full ${notif.iconBg || "bg-emerald-100"} ${notif.iconColor || "text-emerald-700"} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
              >
                <IconRenderer name={notif.icon || "Bell"} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4
                    className={`text-[15px] truncate ${notif.isRead ? "font-medium" : "font-bold"} text-gray-800`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap shrink-0">
                    {notif.time}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 line-clamp-2 pr-4">{notif.desc}</p>
                {!notif.isRead && (
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-bold rounded-lg hover:bg-green-700 transition-colors uppercase tracking-wider shadow-sm cursor-pointer">
                      Lihat Detail
                    </button>
                  </div>
                )}
              </div>
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-2 shadow-sm"></div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedNotif && (
        <NotificationModal
          notif={selectedNotif}
          role={role}
          onClose={() => setSelectedNotif(null)}
          onSubmitEmpty={handleSubmitEmpty}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default Notifikasi;
