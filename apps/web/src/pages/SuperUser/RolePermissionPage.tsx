import React, { useEffect, useState } from "react";
import { Shield, Save, RefreshCw, CheckSquare, Square, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RolePermissions {
  roleId: number;
  roleName: string;
  permissions: Record<
    string,
    { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
  >;
}

const RESOURCES: { key: string; label: string; group: string }[] = [
  // Monitoring & Operasional
  { key: "dashboard_utama", label: "Dashboard Utama", group: "Monitoring" },
  { key: "dashboard_kkn", label: "Dashboard KKN", group: "Monitoring" },
  { key: "monitoring_sampah", label: "Monitoring Sampah", group: "Monitoring" },
  { key: "laporan_analitik", label: "Laporan Analitik", group: "Monitoring" },
  // Operasional
  { key: "pengangkutan", label: "Pengangkutan & Dispatch", group: "Operasional" },
  { key: "pemanfaatan", label: "Pemanfaatan Sampah", group: "Operasional" },
  { key: "hasil_pemanfaatan", label: "Hasil Pemanfaatan", group: "Operasional" },
  { key: "evaluasi_ai", label: "Evaluasi & Diskrepansi AI", group: "Operasional" },
  { key: "manajemen_pengguna", label: "Manajemen Pengguna", group: "Manajemen Data" },
  { key: "manajemen_tempat_sampah", label: "Manajemen Tempat Sampah", group: "Manajemen Data" },
  { key: "manajemen_lokasi", label: "Manajemen Lokasi & Fasilitas", group: "Manajemen Data" },
  { key: "master_data_wilayah", label: "Master Data Wilayah", group: "Manajemen Data" },
  // Komunitas
  { key: "rw_approval", label: "Persetujuan RW", group: "Komunitas" },
  { key: "rw_fasilitas", label: "Input Fasilitas RW", group: "Komunitas" },
  { key: "poin_warga", label: "Poin & Gamifikasi", group: "Komunitas" },
  { key: "ide_daur_ulang", label: "Ide Daur Ulang", group: "Komunitas" },
  // Sistem
  { key: "konfigurasi_sistem", label: "Konfigurasi Sistem", group: "Sistem" },
  { key: "audit_trail", label: "Audit Trail", group: "Sistem" },
];

const PERMISSION_COLS = [
  { key: "canView", label: "Lihat", color: "text-sky-600" },
  { key: "canCreate", label: "Tambah", color: "text-emerald-600" },
  { key: "canEdit", label: "Ubah", color: "text-amber-600" },
  { key: "canDelete", label: "Hapus", color: "text-rose-600" },
] as const;

const ROLE_COLORS: Record<string, string> = {
  DEVELOPER: "bg-emerald-100 text-emerald-800 border-emerald-300",
  SUPER_USER: "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN_DLH: "bg-blue-100 text-blue-800 border-blue-200",
  CAMAT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  LURAH: "bg-teal-100 text-teal-800 border-teal-200",
  RW: "bg-green-100 text-green-800 border-green-200",
  RT: "bg-lime-100 text-lime-800 border-lime-200",
  MAHASISWA_KKN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DPL: "bg-violet-100 text-violet-800 border-violet-200",
  PEMIMPIN: "bg-orange-100 text-orange-800 border-orange-200",
  PANITIA_TASKFORCE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PETUGAS_RESIDU: "bg-red-100 text-red-800 border-red-200",
  WARGA: "bg-slate-100 text-slate-800 border-slate-200",
};

// ─── Component ───────────────────────────────────────────────────────────────

const RolePermissionPage: React.FC = () => {
  const { user } = useAuthStore();
  const isDev = ["DEVELOPER", "SUPER_USER"].includes(user?.peran?.toUpperCase() || "");

  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Monitoring", "Operasional", "Manajemen Data", "Komunitas", "Sistem"])
  );
  const [localPerms, setLocalPerms] = useState<Record<number, RolePermissions["permissions"]>>({});
  const [dirty, setDirty] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isDev) {
      loadPermissions();
    }
  }, [isDev]);

  if (!isDev) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 font-extrabold text-xs">
        Akses Ditolak: Fitur Manajemen Hak Akses (RBAC) hanya dapat diakses oleh akun dengan peran Developer atau Super User.
      </div>
    );
  }

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/permissions");
      const data: RolePermissions[] = res.data.data;
      setRoles(data);

      // Init local state
      const initLocal: Record<number, RolePermissions["permissions"]> = {};
      for (const role of data) {
        initLocal[role.roleId] = { ...role.permissions };
        // Ensure all resources exist in local
        for (const r of RESOURCES) {
          if (!initLocal[role.roleId][r.key]) {
            initLocal[role.roleId][r.key] = {
              canView: false,
              canCreate: false,
              canEdit: false,
              canDelete: false,
            };
          }
        }
      }
      setLocalPerms(initLocal);

      if (data.length > 0 && selectedRoleId === null) {
        setSelectedRoleId(data[0].roleId);
      }
    } catch (err) {
      toast.error("Gagal memuat data hak akses");
    } finally {
      setLoading(false);
    }
  };

  const togglePerm = (
    roleId: number,
    resource: string,
    col: "canView" | "canCreate" | "canEdit" | "canDelete"
  ) => {
    setLocalPerms((prev) => {
      const curr = prev[roleId]?.[resource] ?? {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      };
      return {
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [resource]: { ...curr, [col]: !curr[col] },
        },
      };
    });
    setDirty((prev) => new Set([...prev, roleId]));
  };

  const saveRole = async (roleId: number) => {
    setSaving(roleId);
    try {
      await api.put(`/permissions/${roleId}`, { permissions: localPerms[roleId] });
      toast.success("Hak akses berhasil disimpan");
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(roleId);
        return next;
      });
    } catch (err) {
      toast.error("Gagal menyimpan hak akses");
    } finally {
      setSaving(null);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const selectedRole = roles.find((r) => r.roleId === selectedRoleId);
  const groups = [...new Set(RESOURCES.map((r) => r.group))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Memuat data hak akses...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Shield className="text-purple-600" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Hak Akses (RBAC)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur hak akses per fitur untuk setiap role pengguna sistem.
            </p>
          </div>
        </div>
        <button
          onClick={loadPermissions}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left: Role List */}
        <div className="col-span-3 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Role</p>
          {roles.map((role) => (
            <button
              key={role.roleId}
              onClick={() => setSelectedRoleId(role.roleId)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer flex items-center justify-between gap-2 ${
                selectedRoleId === role.roleId
                  ? "bg-slate-800 text-white border-slate-700 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{role.roleName}</span>
              {dirty.has(role.roleId) && (
                <span className="shrink-0 w-2 h-2 bg-amber-400 rounded-full" title="Ada perubahan belum disimpan" />
              )}
            </button>
          ))}
        </div>

        {/* Right: Permission Matrix */}
        <div className="col-span-9">
          {selectedRole && localPerms[selectedRole.roleId] ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      ROLE_COLORS[selectedRole.roleName] ?? "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {selectedRole.roleName}
                  </span>
                  {dirty.has(selectedRole.roleId) && (
                    <span className="text-xs text-amber-600 font-medium">● Ada perubahan belum disimpan</span>
                  )}
                </div>
                <button
                  onClick={() => saveRole(selectedRole.roleId)}
                  disabled={!dirty.has(selectedRole.roleId) || saving === selectedRole.roleId}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {saving === selectedRole.roleId ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Simpan Perubahan
                </button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[1fr_repeat(4,_80px)] px-5 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fitur / Resource</span>
                {PERMISSION_COLS.map((col) => (
                  <span key={col.key} className={`text-xs font-bold text-center uppercase tracking-wide ${col.color}`}>
                    {col.label}
                  </span>
                ))}
              </div>

              {/* Permission Rows per Group */}
              <div className="divide-y divide-slate-50">
                {groups.map((group) => {
                  const groupResources = RESOURCES.filter((r) => r.group === group);
                  const isExpanded = expandedGroups.has(group);
                  return (
                    <div key={group}>
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full grid grid-cols-[1fr_repeat(4,_80px)] px-5 py-2.5 bg-slate-100/70 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          {group}
                        </div>
                        {PERMISSION_COLS.map((col) => (
                          <div key={col.key} />
                        ))}
                      </button>

                      {/* Resource Rows */}
                      {isExpanded &&
                        groupResources.map((resource) => {
                          const perm = localPerms[selectedRole.roleId][resource.key] ?? {
                            canView: false,
                            canCreate: false,
                            canEdit: false,
                            canDelete: false,
                          };
                          return (
                            <div
                              key={resource.key}
                              className="grid grid-cols-[1fr_repeat(4,_80px)] px-5 py-3 hover:bg-slate-50/80 transition items-center"
                            >
                              <span className="text-sm text-slate-700 font-medium">{resource.label}</span>
                              {PERMISSION_COLS.map((col) => {
                                const val = perm[col.key];
                                return (
                                  <div key={col.key} className="flex justify-center">
                                    <button
                                      onClick={() => togglePerm(selectedRole.roleId, resource.key, col.key)}
                                      className="cursor-pointer hover:scale-110 transition-transform"
                                      title={`${val ? "Cabut" : "Beri"} akses ${col.label}`}
                                    >
                                      {val ? (
                                        <CheckSquare className={col.color} size={19} />
                                      ) : (
                                        <Square className="text-slate-300" size={19} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Pilih role di sebelah kiri untuk mengatur hak akses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionPage;
