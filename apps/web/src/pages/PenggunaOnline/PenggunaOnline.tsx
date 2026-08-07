import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Users,
  Power,
  Clock,
  Monitor,
  Smartphone,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  X,
  PlusCircle,
  History,
  Volume2,
  VolumeX,
  Radio,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface OnlineUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  device: "Website (Desktop)" | "Mobile App (Android)" | "Mobile App (iOS)";
  loginTime: string;
  activeDuration: string;
  identifier: string; // NIP / NIM / ID
  ipAddress?: string;
  location?: string;
}

interface TerminatedLog {
  id: string;
  userName: string;
  userRole: string;
  reason: string;
  timestamp: string;
  terminatedBy: string;
}

export const PenggunaOnline: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selected user for emergency shutdown modal
  const [targetUser, setTargetUser] = useState<OnlineUser | null>(null);
  const [shutdownReason, setShutdownReason] = useState("🚨 Sesi Inaktif / Idle Timeout (>30 mnt)");
  const [customNote, setCustomNote] = useState("");
  const [isTerminating, setIsTerminating] = useState(false);
  const [shakeModal, setShakeModal] = useState(false);

  // Terminated user logs
  const [shutdownLogs, setShutdownLogs] = useState<TerminatedLog[]>([]);

  // Initial online users list matching system users
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([
    {
      id: "1",
      name: "Super User Test",
      phone: "+628111111111",
      role: "Super User",
      device: "Website (Desktop)",
      loginTime: "07 Agustus 2026, 10.00.28",
      activeDuration: "4 jam 58 menit",
      identifier: "SU-001",
      ipAddress: "180.252.12.91",
      location: "Coblong, Bandung",
    },
    {
      id: "2",
      name: "Tirta Gumelar, S.STP.",
      phone: "+6281200991021",
      role: "Lurah (Sekeloa)",
      device: "Website (Desktop)",
      loginTime: "07 Agustus 2026, 13.15.04",
      activeDuration: "1 jam 43 menit",
      identifier: "198204122008011002",
      ipAddress: "180.252.14.10",
      location: "Kelurahan Sekeloa",
    },
    {
      id: "3",
      name: "Dr. Budi Santoso, M.T.",
      phone: "+6281300000001",
      role: "DPL",
      device: "Website (Desktop)",
      loginTime: "07 Agustus 2026, 14.02.10",
      activeDuration: "56 menit",
      identifier: "4127.34.02.001",
      ipAddress: "103.21.19.45",
      location: "Kampus UNIKOM",
    },
    {
      id: "4",
      name: "Deni Rustandi",
      phone: "+628129991060",
      role: "Petugas Residu",
      device: "Mobile App (Android)",
      loginTime: "07 Agustus 2026, 14.30.22",
      activeDuration: "28 menit",
      identifier: "PR-RW03-CIP",
      ipAddress: "114.122.35.88",
      location: "RW 03 Cipurut",
    },
    {
      id: "5",
      name: "Siti Rahmawati",
      phone: "+628157778899",
      role: "Warga",
      device: "Mobile App (Android)",
      loginTime: "07 Agustus 2026, 15.10.05",
      activeDuration: "12 menit",
      identifier: "WG-RW02-012",
      ipAddress: "114.122.40.12",
      location: "RW 02 Sadang Serang",
    },
  ]);

  // Audio synthesizer for shocking alert sound effect
  const playSirenSound = (type: "open" | "shutdown") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "open") {
        // Warning chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Shutdown alarm siren drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4); // A3 drop
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // Audio context ignored if blocked
    }
  };

  const handleOpenShutdownModal = (user: OnlineUser) => {
    setTargetUser(user);
    setShutdownReason("🚨 Sesi Inaktif / Idle Timeout (>30 mnt)");
    setCustomNote("");
    setShakeModal(true);
    playSirenSound("open");
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    setTimeout(() => setShakeModal(false), 500);
  };

  const handleConfirmShutdown = () => {
    if (!targetUser) return;
    setIsTerminating(true);
    playSirenSound("shutdown");

    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([150, 50, 150, 50, 200]);
    }

    setTimeout(() => {
      const now = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Remove from online list
      setOnlineUsers((prev) => prev.filter((u) => u.id !== targetUser.id));

      // Append to termination audit log
      const newLog: TerminatedLog = {
        id: `LOG-${Date.now()}`,
        userName: targetUser.name,
        userRole: targetUser.role,
        reason: customNote ? `${shutdownReason} (${customNote})` : shutdownReason,
        timestamp: `${now} WIB`,
        terminatedBy: "Super User (Anda)",
      };
      setShutdownLogs((prev) => [newLog, ...prev]);

      setIsTerminating(false);

      // Shocking & interactive toast alert
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-bounce" : "opacity-0"
            } max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl p-4 border-2 border-rose-500 flex items-start gap-3 relative overflow-hidden`}
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40 animate-pulse">
              <Zap size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  SHUTDOWN BERHASIL
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{now}</span>
              </div>
              <h4 className="font-extrabold text-sm text-white mt-1">
                Sesi {targetUser.name} Diputus Paksa!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Pengguna dikeluarkan dari {targetUser.device}. Sesi token dibatalkan seketika.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ),
        { duration: 4500 }
      );

      setTargetUser(null);
    }, 600);
  };

  const handleSimulateNewUser = () => {
    const roles = ["Warga", "Mahasiswa KKN", "Petugas Residu", "RW", "DPL"];
    const devices: OnlineUser["device"][] = [
      "Website (Desktop)",
      "Mobile App (Android)",
      "Mobile App (iOS)",
    ];
    const randomId = Math.floor(100 + Math.random() * 900);
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];

    const newUser: OnlineUser = {
      id: `SIM-${Date.now()}`,
      name: `Pengguna Simulasi ${randomId}`,
      phone: `+628${Math.floor(100000000 + Math.random() * 900000000)}`,
      role: randomRole,
      device: randomDevice,
      loginTime: "Baru saja",
      activeDuration: "1 menit",
      identifier: `SIM-${randomId}`,
      ipAddress: `180.252.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      location: "Kecamatan Coblong",
    };

    setOnlineUsers((prev) => [newUser, ...prev]);
    toast.success(`⚡ Live Join: ${newUser.name} (${newUser.role}) telah masuk!`);
  };

  const filteredUsers = onlineUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase());

    const isMobile = u.device.toLowerCase().includes("mobile");
    const matchesDevice =
      deviceFilter === "ALL" ||
      (deviceFilter === "DESKTOP" && !isMobile) ||
      (deviceFilter === "MOBILE" && isMobile);

    return matchesSearch && matchesDevice;
  });

  const totalDesktop = onlineUsers.filter(
    (u) => !u.device.toLowerCase().includes("mobile")
  ).length;
  const totalMobile = onlineUsers.filter((u) =>
    u.device.toLowerCase().includes("mobile")
  ).length;

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Master Data
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-bold">Pengguna Online</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Globe size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Pengguna Online
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE MONITORING
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pemantauan sesi aktif real-time & kendali keamanan akun pengguna Trashcare
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              soundEnabled
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
            }`}
            title={soundEnabled ? "Efek Suara Siren Aktif" : "Efek Suara Senyap"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">
              {soundEnabled ? "Audio Siren ON" : "Audio Mute"}
            </span>
          </button>

          <button
            onClick={handleSimulateNewUser}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Simulasi Live Join</span>
          </button>

          <button
            onClick={() => toast.success("Data sesi pengguna online diperbarui!")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className="text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Sesi Aktif
            </span>
            <span className="text-2xl font-black text-slate-900">
              {onlineUsers.length}{" "}
              <span className="text-xs font-semibold text-slate-400">User</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Radio size={20} className="animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Website (Desktop)
            </span>
            <span className="text-2xl font-black text-blue-600">
              {totalDesktop}{" "}
              <span className="text-xs font-semibold text-slate-400">User</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Monitor size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mobile App
            </span>
            <span className="text-2xl font-black text-indigo-600">
              {totalMobile}{" "}
              <span className="text-xs font-semibold text-slate-400">User</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <Smartphone size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Shutdown Sesi
            </span>
            <span className="text-2xl font-black text-rose-600">
              {shutdownLogs.length}{" "}
              <span className="text-xs font-semibold text-slate-400">Ditutup</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter & Search Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 text-base">
                  Daftar Pengguna Online
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {filteredUsers.length} ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Klik tombol power (Shutdown) untuk memaksa pengguna keluar dari sistem secara langsung.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Device Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => setDeviceFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  deviceFilter === "ALL"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setDeviceFilter("DESKTOP")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deviceFilter === "DESKTOP"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Monitor size={13} /> Desktop
              </button>
              <button
                onClick={() => setDeviceFilter("MOBILE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deviceFilter === "MOBILE"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone size={13} /> Mobile
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, HP, role, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table Content (No horizontal scroll, clean 1-by-1 separated columns) */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                <th className="py-3 px-2 text-center w-8">NO</th>
                <th className="py-3 px-2">NAMA LENGKAP</th>
                <th className="py-3 px-2">NOMOR HP</th>
                <th className="py-3 px-2">ID / NIP / NIM</th>
                <th className="py-3 px-2">DEVICE</th>
                <th className="py-3 px-2">IP ADDRESS</th>
                <th className="py-3 px-2">ROLE</th>
                <th className="py-3 px-2">WAKTU LOGIN</th>
                <th className="py-3 px-2">LAMA AKTIF</th>
                <th className="py-3 px-2 text-center w-24">AKSI SHUTDOWN</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    <Globe size={32} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    Tidak ada pengguna online yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const isMobile = user.device.toLowerCase().includes("mobile");

                  // Consistent role badge style mapping
                  const getRoleStyle = (role: string) => {
                    const r = role.toLowerCase();
                    if (r.includes("super")) return "bg-purple-50 text-purple-700 border-purple-200/80";
                    if (r.includes("lurah") || r.includes("camat")) return "bg-sky-50 text-sky-700 border-sky-200/80";
                    if (r.includes("dpl") || r.includes("mahasiswa")) return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
                    if (r.includes("petugas") || r.includes("residu")) return "bg-amber-50 text-amber-700 border-amber-200/80";
                    if (r.includes("rw") || r.includes("rt")) return "bg-teal-50 text-teal-700 border-teal-200/80";
                    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
                  };

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group align-middle"
                    >
                      <td className="py-3 px-2 text-center font-extrabold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-500 font-medium whitespace-nowrap">
                        {user.phone}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {user.identifier}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {isMobile ? (
                            <Smartphone size={12} className="text-indigo-500 shrink-0" />
                          ) : (
                            <Monitor size={12} className="text-blue-500 shrink-0" />
                          )}
                          {user.device}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        {user.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getRoleStyle(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-600 whitespace-nowrap text-[11px]">
                        {user.loginTime}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 text-[10px]">
                          <Clock size={11} className="text-emerald-500 animate-pulse shrink-0" />
                          <span>{user.activeDuration}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenShutdownModal(user)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center gap-1 font-black text-[10px] cursor-pointer border border-rose-200/80 hover:shadow-md hover:shadow-rose-600/30 active:scale-95"
                          title="Paksa Logout Pengguna (Shutdown Sesi)"
                        >
                          <Power size={12} className="animate-pulse shrink-0" />
                          <span>Shutdown</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>
            Menampilkan {paginatedUsers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
            {Math.min(currentPage * rowsPerPage, filteredUsers.length)} dari {filteredUsers.length} data
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Tampilkan:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-slate-100 rounded-lg font-extrabold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                &lt;
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-black">
                {currentPage}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-100 rounded-lg font-extrabold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Card of Terminated Sessions */}
      {shutdownLogs.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-rose-400" />
              <h3 className="font-extrabold text-sm text-white">
                Riwayat Sesi Yang Diputus Paksa (Audit Log)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full">
              {shutdownLogs.length} EVENT TERMINATED
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {shutdownLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0 border border-rose-500/30">
                    <Power size={15} />
                  </div>
                  <div>
                    <span className="font-extrabold text-white block">
                      {log.userName}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({log.userRole})
                      </span>
                    </span>
                    <span className="text-[11px] text-rose-300 font-medium">
                      Alasan: {log.reason}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {log.timestamp}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    Oleh: {log.terminatedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Impact Interactive Emergency Shutdown Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-lg bg-slate-900 text-white rounded-3xl border-2 border-rose-500 shadow-2xl overflow-hidden relative ${
              shakeModal ? "animate-bounce" : ""
            }`}
          >
            {/* Top Alarm Header Banner */}
            <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 p-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black shadow-xl shadow-rose-950/50 animate-pulse">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-white tracking-tight uppercase">
                      SHUTDOWN AKUN PAKSA
                    </h3>
                    <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/30">
                      HIGH SECURITY
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 font-medium">
                    Terminasi sesi aktif & putus otorisasi pengguna seketika
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTargetUser(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target User Detail Box */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  TARGET PENGGUNA TERHUBUNG:
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white font-black text-sm flex items-center justify-center shadow-lg">
                      {targetUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base">
                        {targetUser.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{targetUser.phone}</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">{targetUser.identifier}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-800">
                    {targetUser.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Perangkat:</span>
                    <span className="font-bold text-slate-200">{targetUser.device}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Lama Aktif:</span>
                    <span className="font-bold text-emerald-400">{targetUser.activeDuration}</span>
                  </div>
                </div>
              </div>

              {/* Shutdown Reason Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 block">
                  PILIH ALASAN SHUTDOWN SESI:
                </label>
                <select
                  value={shutdownReason}
                  onChange={(e) => setShutdownReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="🚨 Sesi Inaktif / Idle Timeout (>30 mnt)">
                    🚨 Sesi Inaktif / Idle Timeout (&gt;30 mnt)
                  </option>
                  <option value="🛡️ Indikasi Pelanggaran Keamanan / Multi-login">
                    🛡️ Indikasi Pelanggaran Keamanan / Multi-login
                  </option>
                  <option value="⚙️ Pemeliharaan Akun Administrator">
                    ⚙️ Pemeliharaan Akun Administrator
                  </option>
                  <option value="🔒 Paksa Reset Kredensial Pengguna">
                    🔒 Paksa Reset Kredensial Pengguna
                  </option>
                </select>
              </div>

              {/* Optional Custom Note */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 block">
                  CATATAN TAMBAHAN (OPSIONAL):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sesi ditinggalkan di perangkat umum..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Warning Box */}
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong className="text-rose-300">Peringatan:</strong> Pengguna akan langsung dikeluarkan ke halaman login secara mendadak. Token JWT & Cookie aktif akan dibatalkan.
                </p>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setTargetUser(null)}
                disabled={isTerminating}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmShutdown}
                disabled={isTerminating}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-900/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isTerminating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>MEMUTUSKAN SESI...</span>
                  </>
                ) : (
                  <>
                    <Power size={16} />
                    <span>TERMINATE SESI SEKARANG</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenggunaOnline;
