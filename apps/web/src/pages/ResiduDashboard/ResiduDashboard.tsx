/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Upload,
  Camera,
  BarChart2,
  Map,
  ShieldAlert,
  Check,
  X,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

const ResiduDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [pendingLogs, setPendingLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationForm, setViolationForm] = useState({
    binQrCode: "",
    type: "RESIDU_TERCAMPUR_ORGANIK",
    severity: "LIGHT",
    notes: "",
  });
  const [violationPhoto, setViolationPhoto] = useState<File | null>(null);
  const [violationPhotoPreview, setViolationPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  
  // Submit Log states
  const [showSubmitLogModal, setShowSubmitLogModal] = useState(false);
  const [submitLogForm, setSubmitLogForm] = useState({
    logId: "",
    actualWeightKg: "",
    classification: "RESIDU",
  });
  const [submitLogPhoto, setSubmitLogPhoto] = useState<File | null>(null);
  const [submitLogPhotoPreview, setSubmitLogPhotoPreview] = useState<string | null>(null);
  const submitLogFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, analyticsRes, jadwalRes, pendingLogsRes] = await Promise.all([
        api.get("/residu/dashboard"),
        api.get("/residu/analytics"),
        api.get("/residu/jadwal-harian").catch(() => ({ data: { data: [] } })),
        api.get("/residu/pending-logs").catch(() => ({ data: { data: [] } })),
      ]);
      setSummary(summaryRes.data?.data);
      setAnalytics(analyticsRes.data?.data);
      setJadwal(jadwalRes.data?.data || []);
      setPendingLogs(pendingLogsRes.data?.data || []);
    } catch (err: any) {
      console.error("Gagal memuat data portal residu:", err);
      toast.error(err.response?.data?.message || "Gagal memuat data portal residu");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setViolationPhoto(file);
      setViolationPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleViolationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationForm.binQrCode) {
      toast.error("ID/QR Code tempat sampah wajib diisi!");
      return;
    }
    if (!violationPhoto) {
      toast.error("Foto bukti pelanggaran wajib diunggah!");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload photo first
      const formData = new FormData();
      formData.append("image", violationPhoto);
      const uploadRes = await api.post("/waste/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const evidencePhotoUrl = uploadRes.data.data.imageUrl;

      // Submit violation
      await api.post("/residu/violation", {
        ...violationForm,
        evidencePhotoUrl,
      });

      setShowSuccessOverlay(true);
      setTimeout(() => {
        setShowSuccessOverlay(false);
        setShowViolationModal(false);
        // Reset form
        setViolationForm({
          binQrCode: "",
          type: "RESIDU_TERCAMPUR_ORGANIK",
          severity: "LIGHT",
          notes: "",
        });
        setViolationPhoto(null);
        setViolationPhotoPreview(null);
        fetchInitialData();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mencatat pelanggaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitLogForm.logId || !submitLogForm.actualWeightKg || !submitLogPhoto) {
      toast.error("Semua field wajib diisi termasuk foto dokumentasi riil!");
      return;
    }

    try {
      setIsSubmittingLog(true);
      
      // Upload evidence photo first
      const formData = new FormData();
      formData.append("image", submitLogPhoto);
      const uploadRes = await api.post("/waste/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const evidencePhotoUrl = uploadRes.data.data.imageUrl;
      await api.post("/residu/submit-log", {
        logId: submitLogForm.logId,
        actualWeightKg: parseFloat(submitLogForm.actualWeightKg),
        classification: "RESIDU",
        evidencePhotoUrl,
      });

      toast.success("Setoran berhasil divalidasi!");
      setShowSubmitLogModal(false);
      setSubmitLogForm({
        logId: "",
        actualWeightKg: "",
        classification: "RESIDU",
      });
      setSubmitLogPhoto(null);
      setSubmitLogPhotoPreview(null);
      fetchInitialData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mencatat setoran");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-primary w-12 h-12" />
        <p className="text-on-surface-variant font-medium">Memuat Portal Petugas Residu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SUCCESS OVERLAY */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-red-600/95 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="text-center text-white space-y-4 max-w-sm px-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto animate-bounce border border-white/30">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Pelanggaran Dicatat!</h2>
            <p className="text-sm text-red-100">
              Pelanggaran residu telah tervalidasi. Poin warga dipotong dan peringatan otomatis
              dikirimkan via WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <ShieldAlert className="text-red-600 w-7 h-7" />
            Portal Pengawasan Residu
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Petugas: {user?.name} • Zona Tugas: {summary?.assignedZone}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSubmitLogModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Validasi Berat Aktual
          </button>
          <button
            onClick={() => setShowViolationModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Input Ketidakpatuhan
          </button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Violations Count Card */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">CATATAN HARI INI</span>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black">{summary?.totalViolationsToday} Laporan</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Pelanggaran residu tercampur hari ini
            </p>
          </div>
        </div>

        {/* KPI Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">SKOR KPI PETUGAS</span>
            <CheckCircle className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-primary">{summary?.kpiScore} pts</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Status target kinerja: Sangat Baik
            </p>
          </div>
        </div>

        {/* Total residu tonnage mock / stats */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">ZONA OPERASIONAL</span>
            <Map className="text-indigo-600 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-indigo-600">{summary?.assignedZone}</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Sektor monitoring residu hilir
            </p>
          </div>
        </div>

        {/* Schedule Summary widget */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">PROGRES HARIAN</span>
            <AlertTriangle className="text-amber-500 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-amber-600">
              {summary?.tugasSelesaiHariIni || 0} / {(summary?.tugasSelesaiHariIni || 0) + jadwal.length}
            </h3>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${((summary?.tugasSelesaiHariIni || 0) / (((summary?.tugasSelesaiHariIni || 0) + jadwal.length) || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Schedule List */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              <Map className="text-primary w-5 h-5" />
              Estimasi Tugas Harian (Jemput &gt;70%)
            </h3>
            {jadwal.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">Tidak ada tugas jemput mendesak hari ini.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jadwal.map(j => {
                  const vol = Number(j.currentVolumeLiter);
                  const max = Number(j.maxCapacityLiter);
                  const percentage = max > 0 ? (vol/max)*100 : 0;
                  return (
                    <div key={j.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{j.rtRw?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">QR: {j.qrCode}</p>
                        <p className="text-xs text-slate-500">Pemilik: {j.user?.name || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${percentage > 90 ? 'text-red-500' : 'text-amber-500'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{vol}L / {max}L</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Chart volume residu aggregate */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              <Map className="text-primary w-5 h-5" />
              Estimasi Tugas Harian (Jemput &gt;70%)
            </h3>
            {jadwal.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">Tidak ada tugas jemput mendesak hari ini.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jadwal.map(j => {
                  const vol = Number(j.currentVolumeLiter);
                  const max = Number(j.maxCapacityLiter);
                  const percentage = max > 0 ? (vol/max)*100 : 0;
                  return (
                    <div key={j.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{j.rtRw?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">QR: {j.qrCode}</p>
                        <p className="text-xs text-slate-500">Pemilik: {j.user?.name || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${percentage > 90 ? 'text-red-500' : 'text-amber-500'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{vol}L / {max}L</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Chart volume residu aggregate */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              <BarChart2 className="text-primary w-5 h-5" />
              Volume Residu Agregat Mingguan (kg)
            </h3>
            <div className="flex items-end gap-3 h-48 pt-4">
              {analytics?.trend.map((t: any) => (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-red-100 rounded-t-lg relative"
                    style={{ height: `${(t.weightKg / 200) * 140}px` }}
                  >
                    <div
                      className="bg-red-500 absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-300"
                      style={{ height: "100%" }}
                    ></div>
                    <div className="absolute top-[-20px] left-0 right-0 text-center font-bold text-[9px] text-red-700">
                      {t.weightKg}kg
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{t.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zones Compliance list */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              <FileText className="text-indigo-600 w-5 h-5" />
              Tabel Kepatuhan Wilayah RT/RW
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant pb-2">
                    <th className="pb-2 font-bold">Wilayah RT/RW</th>
                    <th className="pb-2 font-bold">Tingkat Kepatuhan</th>
                    <th className="pb-2 font-bold">Total Pelanggaran</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.zones.map((z: any) => (
                    <tr
                      key={z.id}
                      className="border-b border-outline-variant/30 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 font-bold text-slate-700">{z.region}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${z.complianceScore >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {z.complianceScore}% Patuh
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600">
                        {z.violationsCount} Pelanggaran
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Petugas own recorded violations log */}
        <div className="col-span-4 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <h3 className="font-extrabold text-lg">Riwayat Catatan Laporan</h3>
          <div
            className="space-y-3 max-h-[460px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {summary?.recentViolations.length > 0 ? (
              summary.recentViolations.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{v.wargaName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-[9px] font-bold ${v.severity === "SEVERE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {v.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Bin ID: {v.binCode}</div>
                  <div className="text-slate-600 mt-1">{v.type}</div>
                  <div className="text-[9px] text-slate-400 mt-1 text-right">
                    {new Date(v.createdAt).toLocaleString("id-ID")}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Belum ada laporan pelanggaran dicatat.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* INPUT VIOLATION MODAL */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-on-surface">
                <ShieldAlert className="text-red-600 w-5 h-5" />
                Form Laporan Ketidakpatuhan
              </h3>
              <button
                onClick={() => setShowViolationModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleViolationSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  ID / QR Code tempat sampah *
                </label>
                <input
                  type="text"
                  required
                  value={violationForm.binQrCode}
                  onChange={(e) =>
                    setViolationForm({ ...violationForm, binQrCode: e.target.value })
                  }
                  placeholder="Scan atau ketik kode QR..."
                  className="border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Jenis Pelanggaran *
                </label>
                <select
                  required
                  value={violationForm.type}
                  onChange={(e) => setViolationForm({ ...violationForm, type: e.target.value })}
                  className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                >
                  <option value="RESIDU_TERCAMPUR_ORGANIK">Residu Tercampur di Organik</option>
                  <option value="RESIDU_TERCAMPUR_ANORGANIK">Residu Tercampur di Anorganik</option>
                  <option value="B3_TERCAMPUR_UMUM">Sampah B3 Tercampur Umum</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Tingkat Keparahan *
                </label>
                <select
                  required
                  value={violationForm.severity}
                  onChange={(e) => setViolationForm({ ...violationForm, severity: e.target.value })}
                  className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                >
                  <option value="LIGHT">Ringan (-50 Poin)</option>
                  <option value="MEDIUM">Sedang (-100 Poin)</option>
                  <option value="SEVERE">Berat (-150 Poin)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Catatan Tambahan
                </label>
                <textarea
                  value={violationForm.notes}
                  onChange={(e) => setViolationForm({ ...violationForm, notes: e.target.value })}
                  placeholder="Keterangan tambahan..."
                  rows={2}
                  className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Foto Bukti Pelanggaran */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Foto Bukti Pelanggaran *</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" /> Ambil Foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {violationPhotoPreview && (
                  <div className="flex gap-4 items-center animate-in fade-in duration-200">
                    <img
                      src={violationPhotoPreview}
                      alt="Preview Bukti"
                      className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Foto Terlampir
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Catat Pelanggaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT LOG MODAL */}
      {showSubmitLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-on-surface">
                <CheckCircle className="text-indigo-600 w-5 h-5" />
                Validasi Berat Aktual Setoran
              </h3>
              <button
                onClick={() => setShowSubmitLogModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Pilih Setoran (Log ID) *
                </label>
                <select
                  required
                  value={submitLogForm.logId}
                  onChange={(e) => {
                      setSubmitLogForm({
                        ...submitLogForm,
                        logId: e.target.value,
                        classification: "RESIDU",
                      });
                  }}
                  className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">-- Pilih Setoran --</option>
                  {pendingLogs.map((log: any) => (
                    <option key={log.id} value={log.id}>
                      {log.bin?.qrCode} - {log.bin?.user?.name || "Warga"} ({log.volumeLiter} L)
                    </option>
                  ))}
                </select>
              </div>

              {submitLogForm.logId && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-2">Info AI & Setoran</h4>
                  
                  {(() => {
                     const l = pendingLogs.find((x: any) => x.id === submitLogForm.logId);
                     return (
                       <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500 mb-0.5">Klasifikasi AI</p>
                            <p className="font-bold text-slate-800">{l?.aiClassification || "-"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">Confidence AI</p>
                            <p className="font-bold text-slate-800">{l?.aiConfidence ? `${(Number(l.aiConfidence)*100).toFixed(1)}%` : "-"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-500 mb-0.5">Geolokasi Saat Setor</p>
                            <p className="font-mono text-slate-800">{l?.geolocation || "-"}</p>
                          </div>
                          {l?.evidencePhotoUrl && (
                            <div className="col-span-2 mt-2">
                              <p className="text-slate-500 mb-1">Foto Bukti</p>
                              <img src={l.evidencePhotoUrl} alt="Bukti" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                            </div>
                          )}
                       </div>
                     )
                  })()}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Klasifikasi Aktual Petugas *
                </label>
                <div className="border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-100 text-slate-500 font-bold">
                  Residu
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Foto Dokumentasi Riil *</span>
                    <button
                      type="button"
                      onClick={() => submitLogFileInputRef.current?.click()}
                      className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" /> Ambil Foto
                    </button>
                    <input
                      ref={submitLogFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setSubmitLogPhotoPreview(URL.createObjectURL(file));
                          setSubmitLogPhoto(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
  
                  {submitLogPhotoPreview && (
                    <div className="flex gap-4 items-center animate-in fade-in duration-200">
                      <img
                        src={submitLogPhotoPreview}
                        alt="Preview Bukti"
                        className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                      />
                      <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Foto Terlampir
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Berat Aktual Timbangan (Kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={submitLogForm.actualWeightKg}
                  onChange={(e) =>
                    setSubmitLogForm({ ...submitLogForm, actualWeightKg: e.target.value })
                  }
                  placeholder="0.0"
                  className="border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-primary"
                />
                <p className="text-[10px] text-slate-500">Angka manual dari pembacaan timbangan industri fisik.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitLogModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingLog ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResiduDashboard;
