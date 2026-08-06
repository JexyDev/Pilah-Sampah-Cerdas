/**
 * Project: TrashCare Web App
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Registrasi Terpadu TrashCare (Default: Warga, Opsi: Mahasiswa KKN & Petugas Residu)
 */

import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Phone, Lock, Eye, EyeOff, MapPin, GraduationCap, Truck, ArrowRight, ShieldCheck, RefreshCcw, CheckCircle2 } from "lucide-react";
import api from "../../utils/api";

// Exact Vector SVG Icon matching the TrashCare logo
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="-6 -8 112 116" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M 25 54 A 31 31 0 1 1 76 34"
      fill="none"
      stroke="#0284c7"
      strokeWidth="7.5"
      strokeLinecap="round"
    />
    <polygon points="76,20 88,36 68,36" fill="#0284c7" />
    <path
      d="M 76 46 A 31 31 0 0 1 25 64"
      fill="none"
      stroke="#16a34a"
      strokeWidth="7.5"
      strokeLinecap="round"
    />
    <rect x="36" y="27" width="28" height="6" rx="2" fill="#0284c7" />
    <path d="M43 27 C43 23 57 23 57 27 Z" fill="#0284c7" />
    <path d="M38 35 L41 68 C41 71 44 73 48 73 L52 73 L48 55 C48 45 58 40 62 35 Z" fill="#0284c7" />
    <path
      d="M 46 68 C 46 47 70 41 70 41 C 70 41 74 61 58 68 C 50 71 46 68 46 68 Z"
      fill="#16a34a"
    />
    <path
      d="M 48 66 Q 58 56 68 43"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role State (Default: WARGA)
  const initialRole = (searchParams.get("role") || "WARGA").toUpperCase();
  const [role, setRole] = useState<string>(
    initialRole === "MAHASISWA_KKN" || initialRole === "PETUGAS_RESIDU" ? initialRole : "WARGA"
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Common Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Warga Form State
  const [alamat, setAlamat] = useState("");
  const [kecamatan, setKecamatan] = useState("Kecamatan Coblong");
  const [kelurahan, setKelurahan] = useState("Dago");
  const [rt, setRt] = useState("01");
  const [rw, setRw] = useState("06");

  // Mahasiswa Form State
  const [email, setEmail] = useState("");
  const [nim, setNim] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Petugas Residu Form State
  const [nip, setNip] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Nama lengkap wajib diisi.");
    if (!phone.trim()) return toast.error("Nomor telepon wajib diisi.");
    if (!password.trim() || password.length < 6) return toast.error("Kata sandi minimal 6 karakter.");
    if (password !== confirmPassword) return toast.error("Konfirmasi kata sandi tidak cocok.");

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+62" + formattedPhone.slice(1);
    }

    setLoading(true);

    try {
      if (role === "WARGA") {
        await api.post("/auth/register/warga", {
          name: name.trim(),
          phone: formattedPhone,
          noWa: formattedPhone,
          password: password.trim(),
          address: alamat.trim(),
          alamat: alamat.trim(),
          kecamatan,
          kelurahan,
          rtRw: `RT ${rt} / RW ${rw}`,
          rt,
          rw,
        });
        toast.success("Registrasi Warga Berhasil! Silakan masuk ke sistem.");
      } else if (role === "MAHASISWA_KKN") {
        await api.post("/auth/register/mahasiswa-kkn", {
          name: name.trim(),
          email: email.trim() || `${phone.replace(/\D/g, "")}@student.ac.id`,
          password: password.trim(),
          phone: formattedPhone,
          noWa: formattedPhone,
          nim: nim.trim(),
          jurusan: jurusan.trim(),
          fakultas: fakultas.trim(),
          startDate,
          endDate,
          rtRwId: 1,
        });
        toast.success("Registrasi Mahasiswa KKN Berhasil! Menunggu persetujuan Admin DLH.");
      } else if (role === "PETUGAS_RESIDU") {
        await api.post("/auth/register/petugas-residu", {
          name: name.trim(),
          phone: formattedPhone,
          noWa: formattedPhone,
          password: password.trim(),
          nip: nip.trim(),
          assignedZone: kelurahan,
          kecamatan,
          kelurahan,
        });
        toast.success("Registrasi Petugas Residu Berhasil! Silakan masuk ke sistem.");
      }

      setShowSuccessOverlay(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal melakukan pendaftaran. Periksa kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 p-4 sm:p-8 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky-300/30 blur-3xl pointer-events-none"></div>

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex flex-col items-center justify-center z-50 transition-all duration-500 animate-in fade-in">
          <div className="flex flex-col items-center gap-6 text-center text-white px-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce shadow-lg border border-white/30">
              <CheckCircle2 className="text-white" size={64} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Registrasi Berhasil!</h2>
              <p className="text-sm text-emerald-100 max-w-sm mx-auto leading-relaxed font-medium">
                Mengalihkan Anda ke halaman login...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-200">
              <RefreshCcw className="animate-spin text-lg" />
              <span>Memuat...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[920px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10">
        
        {/* Left Side: Eco Feature Showcase */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-emerald-200/30 text-white text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
              <span>Pendaftaran Akun Terpadu</span>
            </div>

            <div className="space-y-3 pt-2 text-left">
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
                Bergabunglah Dalam Gerakan Kebersihan
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Daftarkan diri Anda untuk berpartisipasi aktif dalam tata kelola sampah Kecamatan Coblong.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs font-semibold text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <User size={18} className="text-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-white">Registrasi Warga Mandiri</p>
                  <p className="text-[10px] text-emerald-200 font-medium">Dapatkan poin insentif &amp; 2 Tong Sampah</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-white">Pendamping KKN</p>
                  <p className="text-[10px] text-emerald-200 font-medium">Bantu pemetaan GPS &amp; edukasi warga</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-amber-300" />
                </div>
                <div>
                  <p className="font-bold text-white">Keamanan Tanpa NIK</p>
                  <p className="text-[10px] text-emerald-200 font-medium">Verifikasi aman via WhatsApp OTP (+62)</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-white/15 relative z-10 text-[11px] text-emerald-200/80 font-medium text-left">
            © 2026 UNIKOM. All rights reserved.
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white space-y-6">
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 group">
                <TrashCareLogoIcon className="w-9 h-9 transition-transform group-hover:scale-105" />
                <div className="flex flex-col text-left">
                  <span className="text-lg font-black tracking-tight leading-none">
                    <span className="text-sky-600">Trash</span>
                    <span className="text-emerald-600">Care</span>
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                    Pilah Sampah Cerdas
                  </span>
                </div>
              </Link>

              <Link to="/login" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 transition">
                Masuk Sistem →
              </Link>
            </div>

            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Akun Baru</h1>
              <p className="text-xs text-slate-500 font-medium">Lengkapi data diri Anda untuk bergabung ke dalam platform.</p>
            </div>

            {/* Role Selection Dropdown/Tabs (Default: Warga) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                PILIH PERAN
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("WARGA")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === "WARGA"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <User size={14} />
                  Warga
                </button>

                <button
                  type="button"
                  onClick={() => setRole("MAHASISWA_KKN")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === "MAHASISWA_KKN"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <GraduationCap size={14} />
                  Mahasiswa
                </button>

                <button
                  type="button"
                  onClick={() => setRole("PETUGAS_RESIDU")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === "PETUGAS_RESIDU"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Truck size={14} />
                  Petugas
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  NAMA LENGKAP
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda..."
                    className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-600 focus:ring-1 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  NOMOR TELEPON (WHATSAPP)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-600 focus:ring-1 outline-none transition-all"
                  />
                </div>
              </div>

              {/* ROLE SPECIFIC FIELDS */}

              {/* WARGA FIELDS */}
              {role === "WARGA" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      ALAMAT RUMAH
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        required
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Jl. Dipatiukur No. 10..."
                        className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-600 focus:ring-1 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        KECAMATAN
                      </label>
                      <select
                        value={kecamatan}
                        onChange={(e) => setKecamatan(e.target.value)}
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-600 outline-none"
                      >
                        <option value="Kecamatan Coblong">Kecamatan Coblong</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        KELURAHAN
                      </label>
                      <select
                        value={kelurahan}
                        onChange={(e) => setKelurahan(e.target.value)}
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-600 outline-none"
                      >
                        <option value="Dago">Kel. Dago</option>
                        <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
                        <option value="Sadang Serang">Kel. Sadang Serang</option>
                        <option value="Sekeloa">Kel. Sekeloa</option>
                        <option value="Cipaganti">Kel. Cipaganti</option>
                        <option value="Lebak Gede">Kel. Lebak Gede</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">RT</label>
                      <input
                        type="text"
                        value={rt}
                        onChange={(e) => setRt(e.target.value)}
                        placeholder="RT 01"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">RW</label>
                      <input
                        type="text"
                        value={rw}
                        onChange={(e) => setRw(e.target.value)}
                        placeholder="RW 06"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MAHASISWA KKN FIELDS */}
              {role === "MAHASISWA_KKN" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">NIM</label>
                      <input
                        type="text"
                        required
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        placeholder="10121001"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">EMAIL</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mhs@univ.ac.id"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">JURUSAN</label>
                      <input
                        type="text"
                        required
                        value={jurusan}
                        onChange={(e) => setJurusan(e.target.value)}
                        placeholder="Teknik Lingkungan"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">FAKULTAS</label>
                      <input
                        type="text"
                        required
                        value={fakultas}
                        onChange={(e) => setFakultas(e.target.value)}
                        placeholder="FTSL"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PETUGAS RESIDU FIELDS */}
              {role === "PETUGAS_RESIDU" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    NIP / KODE PETUGAS (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="PTG-001"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">KATA SANDI</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-9 pr-8 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">KONFIRMASI SANDI</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-9 pr-3 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <><RefreshCcw className="animate-spin" size={16} /><span>Memproses...</span></>
                ) : (
                  <><ArrowRight size={18} /><span>DAFTAR SEKARANG</span></>
                )}
              </button>
            </form>

          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Sudah memiliki akun?{" "}
            <Link to="/login" className="text-emerald-600 font-extrabold hover:underline">
              Masuk
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;
