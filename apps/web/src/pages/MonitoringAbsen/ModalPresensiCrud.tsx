/**
 * ModalPresensiCrud.tsx
 * Komponen modal untuk operasi Tambah Manual & Edit presensi KKN oleh DPL/Admin.
 * Fitur: Kalkulasi Durasi Aktual + preview Akumulasi KKN otomatis saat jam masuk/pulang diinput.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  User,
  Save,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export interface CrudAttendancePayload {
  scheduleId?: string;
  studentId?: string;
  attendedAt?: string | null;
  checkOutAt?: string | null;
  status?: string;
  actualInZoneMinutes?: number | null;
  deskripsiKegiatan?: string;
}

export interface AttendanceRecordForCrud {
  id: string;
  studentId: string;
  scheduleId: string;
  attendedAt?: string;
  completedAt?: string;
  checkOutAt?: string;
  status: string;
  actualInZoneMinutes?: number;
  deskripsiKegiatan?: string;
  student: {
    id: string;
    name: string;
    studentProfile?: { nim?: string; kelompok?: { id: string; name: string } };
  };
}

interface Props {
  mode: "add" | "edit";
  existingRecord?: AttendanceRecordForCrud | null;
  scheduleId?: string;
  scheduleDate?: string;
  students?: Array<{
    id: string;
    name: string;
    nim?: string;
    kelompokName?: string;
    totalMinutes?: number;
  }>;
  targetTotalJam?: number;
  targetHarianJam?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "HADIR_MEMENUHI", label: "Hadir – Memenuhi Target" },
  { value: "HADIR_TIDAK_MEMENUHI", label: "Hadir – Tidak Memenuhi Target" },
  { value: "BERLANGSUNG", label: "Berlangsung (Aktif di Lapangan)" },
  { value: "TERJEDA", label: "Terjeda" },
  { value: "IZIN", label: "Izin (Disetujui)" },
  { value: "SAKIT", label: "Sakit (Disetujui)" },
  { value: "ALPHA", label: "Alpa / Tanpa Keterangan" },
  { value: "TIDAK_ADA_KEGIATAN", label: "Tidak Ada Kegiatan" },
];

const isoToTimeInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

const isoToDateInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const toISOStringWIB = (date: string, time: string): string | null => {
  if (!date || !time) return null;
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00+07:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const formatMinsLabel = (mins: number): string => {
  if (mins <= 0) return "0 menit";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} jam ${m} menit`;
  if (h > 0) return `${h} jam`;
  return `${m} menit`;
};

export const ModalPresensiCrud: React.FC<Props> = ({
  mode,
  existingRecord,
  scheduleId,
  scheduleDate,
  students = [],
  targetTotalJam = 200,
  targetHarianJam = 4,
  onClose,
  onSuccess,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    existingRecord?.studentId ?? ""
  );
  const [inputDate, setInputDate] = useState<string>(
    existingRecord?.attendedAt
      ? isoToDateInput(existingRecord.attendedAt)
      : scheduleDate ?? today
  );
  const [jamMasuk, setJamMasuk] = useState<string>(
    isoToTimeInput(existingRecord?.attendedAt ?? null) || "08:00"
  );
  const [jamPulang, setJamPulang] = useState<string>(
    isoToTimeInput(
      existingRecord?.completedAt ?? (existingRecord as any)?.checkOutAt ?? null
    ) || ""
  );
  const [status, setStatus] = useState<string>(
    existingRecord?.status ?? "HADIR_MEMENUHI"
  );
  const [keterangan, setKeterangan] = useState<string>(
    existingRecord?.deskripsiKegiatan ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const calculatedMins = useMemo<number>(() => {
    if (!jamMasuk || !jamPulang) return 0;
    const masukISO = toISOStringWIB(inputDate, jamMasuk);
    const pulangISO = toISOStringWIB(inputDate, jamPulang);
    if (!masukISO || !pulangISO) return 0;
    const diff = Math.floor(
      (new Date(pulangISO).getTime() - new Date(masukISO).getTime()) / 60000
    );
    return Math.max(0, diff);
  }, [inputDate, jamMasuk, jamPulang]);

  const previewAkumulasi = useMemo(() => {
    const student = students.find((s) => s.id === selectedStudentId);
    const existingMins = student?.totalMinutes ?? 0;
    const newTotal = existingMins + calculatedMins;
    const targetMins = Math.round(targetTotalJam * 60);
    const pct = targetMins > 0 ? Math.min(100, (newTotal / targetMins) * 100).toFixed(1) : "0";
    return { newTotal, targetMins, pct };
  }, [selectedStudentId, calculatedMins, students, targetTotalJam]);

  useEffect(() => {
    if (calculatedMins > 0) {
      const targetMins = Math.round(targetHarianJam * 60);
      setStatus(calculatedMins >= targetMins ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI");
    }
  }, [calculatedMins, targetHarianJam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "add" && !selectedStudentId) {
      toast.error("Pilih mahasiswa terlebih dahulu.");
      return;
    }
    if (!jamMasuk) {
      toast.error("Jam Masuk wajib diisi.");
      return;
    }
    const masukISO = toISOStringWIB(inputDate, jamMasuk);
    const pulangISO = jamPulang ? toISOStringWIB(inputDate, jamPulang) : null;
    setIsSaving(true);
    try {
      if (mode === "add") {
        await api.post("/kkn-attendance/manual", {
          scheduleId,
          studentId: selectedStudentId,
          startDateTime: masukISO,
          endDateTime: pulangISO,
          status,
          deskripsiKegiatan: keterangan || undefined,
          actualInZoneMinutes: calculatedMins > 0 ? calculatedMins : undefined,
          method: "MANUAL",
          latitude: -6.89,
          longitude: 107.61,
        });
        toast.success("Presensi manual berhasil ditambahkan.");
      } else {
        await api.put(`/kkn-attendance/${existingRecord!.id}`, {
          attendedAt: masukISO,
          checkOutAt: pulangISO,
          status,
          actualInZoneMinutes: calculatedMins > 0 ? calculatedMins : undefined,
          deskripsiKegiatan: keterangan || undefined,
        });
        toast.success("Data presensi berhasil diperbarui.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal menyimpan data presensi.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const targetHarianMins = Math.round(targetHarianJam * 60);
  const isMemenuhiHarian = calculatedMins >= targetHarianMins && calculatedMins > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
              {mode === "add" ? "Tambah Presensi Manual" : "Edit Data Presensi"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {mode === "add"
                ? "Input presensi secara manual untuk mahasiswa KKN"
                : `Mengedit: ${existingRecord?.student?.name ?? ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Pilih Mahasiswa (mode add) */}
          {mode === "add" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <User size={13} className="inline mr-1 text-emerald-600" />
                Pilih Mahasiswa
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="">— Pilih mahasiswa —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.nim ? ` (${s.nim})` : ""}{s.kelompokName ? ` – ${s.kelompokName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Calendar size={13} className="inline mr-1 text-emerald-600" />
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Jam Masuk & Jam Pulang */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock size={13} className="inline mr-1 text-blue-600" />
                Jam Masuk
              </label>
              <input
                type="time"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock size={13} className="inline mr-1 text-rose-500" />
                Jam Pulang <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="time"
                value={jamPulang}
                onChange={(e) => setJamPulang(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          {/* Preview Durasi Aktual (otomatis) */}
          {calculatedMins > 0 && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${
                isMemenuhiHarian
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
              }`}
            >
              {isMemenuhiHarian ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-xs">
                  Durasi Aktual:{" "}
                  <span className="font-extrabold">{formatMinsLabel(calculatedMins)}</span>
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isMemenuhiHarian
                    ? `✅ Memenuhi target harian (${formatMinsLabel(targetHarianMins)})`
                    : `⚠️ Belum memenuhi target harian (${formatMinsLabel(targetHarianMins)})`}
                </p>
                {selectedStudentId && previewAkumulasi.newTotal > 0 && (
                  <p className="text-[11px] mt-1 opacity-80">
                    <Info size={10} className="inline mr-1" />
                    Akumulasi KKN setelah disimpan:{" "}
                    <span className="font-black">
                      {formatMinsLabel(previewAkumulasi.newTotal)}
                    </span>{" "}
                    / {formatMinsLabel(previewAkumulasi.targetMins)} ({previewAkumulasi.pct}%)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Status Kehadiran
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan / Alasan{" "}
              <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder="Contoh: Presensi diinput manual karena mahasiswa tidak membawa HP..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{mode === "add" ? "Tambah Presensi" : "Simpan Perubahan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
