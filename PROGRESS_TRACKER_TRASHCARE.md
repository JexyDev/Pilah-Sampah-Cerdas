# PROGRESS_TRACKER_TRASHCARE.md — Monitoring Integrasi Data Real vs Dummy

> Standar status per Aturan Anti-Dummy Section 11 AGENTS.md:
> - 🔴 Belum / Dummy Terbukti
> - 🟡 Siap Direview (Backend terhubung, menunggu verifikasi manual 4-mata)
> - 🟢 Sudah (Verifikasi 4-mata penguji manual selesai)

---

## Modul & Dashboard Monitoring Super Admin

| Modul / Komponen Tampilan | Path Komponen UI | Status Integrasi | Endpoint Backend API | Bukti Verification |
|---|---|---|---|---|
| **Volume Sampah Terpilah (Aktivitas Monitoring)** | `apps/web/src/pages/SuperAdmin/AktivitasMonitoring.tsx` | 🟡 Siap Direview | `GET /api/v1/dashboard/kpi?period=bulanan` | Memanggil `kpi.organikKg`, `kpi.anorganikKg`, `kpi.residuKg` real dari database `setoranOtomatis` & `setoranManual` |
| **Review & Evaluasi Diskrepansi AI** | `apps/web/src/pages/SuperAdmin/ReviewDiscrepancy.tsx` | 🟡 Siap Direview | `GET /api/v1/waste/logs/discrepancies` | Fallback `DEFAULT_DISCREPANCY_LOGS` dihilangkan, menampilkan empty state jujur bila log 0 |
| **Persaingan Kebersihan Kelurahan (Bar Chart Race)** | `apps/web/src/components/BarChartRace.tsx` | 🟡 Siap Direview | `GET /api/v1/gamification/leaderboard` | Seed statis `KELURAHAN_SEEDS` dihilangkan, memplot akumulasi tonase real `regions` |
| **Analytics & Leaderboard Overview Board** | `apps/web/src/components/analytics/AnalyticsOverviewBoard.tsx` | 🟡 Siap Direview | `GET /api/v1/gamification/leaderboard` & `GET /api/v1/gamification/leaderboard-kkn` | Default mock arrays & fake score fallback `Math.max` dihilangkan |
| **Pusat Notifikasi Real-time** | `apps/web/src/pages/Notifikasi/Notifikasi.tsx` | 🟡 Siap Direview | `GET /api/v1/notifications?role=:role` | Fallback `DEFAULT_COBLONG_NOTIFICATIONS` dihilangkan, empty state saat log kosong |
| **Master QR Manager** | `apps/web/src/pages/SuperAdmin/MasterQrManager.tsx` | 🟡 Siap Direview | `GET /api/v1/super-admin/bins/qr-master` | Mengambil daftar QR real dari DB |
| **Audit Trail (Log Mentah)** | `apps/web/src/pages/SuperAdmin/AuditTrailList.tsx` | 🟡 Siap Direview | `GET /api/v1/super-admin/audit-trail` | Mengambil log audit mutasi data real dari DB |
| **Konfigurasi Parameter Sistem** | `apps/web/src/pages/SuperAdmin/ManageConfigs.tsx` | 🟡 Siap Direview | `GET /api/v1/configs` | Mengambil & menyimpan konfigurasi parameter sistem real |
| **Role & Permission Matrix** | `apps/web/src/pages/SuperAdmin/RolePermissionPage.tsx` | 🟡 Siap Direview | `GET /api/v1/permissions` | Mengambil matriks hak akses real dari DB |

---

## Modul & Dashboard Role Pengurus RW / RT & Warga / Petugas / KKN / DPL

| Modul / Komponen Tampilan | Path Komponen UI | Status Integrasi | Endpoint Backend API | Bukti Verification |
|---|---|---|---|---|
| **Dashboard RW (Fasilitas & GIS)** | `apps/web/src/pages/RwPortal/RwDashboard.tsx` | 🟡 Siap Direview | `GET /api/v1/facilities` & `GET /api/v1/rw/dashboard` | Statistik fasilitas & status tempat sampah ditarik real dari DB |
| **Portal Approval RW** | `apps/web/src/pages/RwPortal/RwApproval.tsx` | 🟡 Siap Direview | `GET /api/v1/rw/petugas/pending` & `GET /api/v1/rw/bins/inactive` | Verifikasi petugas & bin inactive ditarik real dari DB |
| **Input Fasilitas & Produksi RW** | `apps/web/src/pages/RwPortal/RwFacilityInput.tsx` | 🟡 Siap Direview | `GET /api/v1/rw/facilities` & `GET /api/v1/rw/ide` | Data ide daur ulang & produksi fasilitas ditarik real dari DB |
| **Dashboard Personal Warga** | `apps/web/src/pages/Dashboard/Dashboard.tsx` (`WargaDashboard`) | 🟡 Siap Direview | `GET /api/v1/dashboard/summary` & `GET /api/v1/bins/my-bins` | Poin, saldo, setoran, & tempat sampah ditarik real dari DB |
| **Portal Petugas Residu** | `apps/web/src/pages/ResiduDashboard/ResiduDashboard.tsx` | 🟡 Siap Direview | `GET /api/v1/residu/dashboard` & `GET /api/v1/residu/analytics` | Timbulan & laporan residu ditarik real dari DB |
| **Dashboard KKN & DPL** | `apps/web/src/pages/dpl/DplDashboardPage.tsx` & `KknDashboard.tsx` | 🟡 Siap Direview | `GET /api/v1/dpl/groups` & `GET /api/v1/kkn/me` | Kelompok, log kerja, & verifikasi ditarik real dari DB |

