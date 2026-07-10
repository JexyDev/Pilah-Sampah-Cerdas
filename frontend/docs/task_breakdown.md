# Task Breakdown
## pilahsampah.id | Frontend Web Dashboard
**Versi:** 1.0.0 | **Assignee:** Jeremy Darrell (Fullstack) | **Sprint:** 1
**Prasyarat:** Backend berjalan di `http://localhost:3000` dengan data seed

---

## Aturan Umum
- Branch: `feature/fe-<nama-task>` dari `main`
- Backend HARUS berjalan lebih dulu sebelum Frontend dikembangkan
- Gunakan React DevTools dan TanStack Query DevTools saat development

---

## FASE 0: Setup Project (Estimasi: 1 jam)

### Task FE-00: Inisialisasi Project
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependensi:
  ```
  axios zustand @tanstack/react-query recharts
  react-router-dom react-leaflet leaflet lucide-react
  @tanstack/react-query-devtools
  ```
- [ ] Install Tailwind: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init`
- [ ] Konfigurasi `tailwind.config.ts` dengan custom color tokens (lihat `sdd.md` Section 3.1)
- [ ] Import `Plus Jakarta Sans` di `index.html` dari Google Fonts:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```
- [ ] Buat struktur folder sesuai `sdd.md` Section 2
- [ ] Buat `.env` dengan `VITE_API_URL` dan `VITE_WS_URL`

### Task FE-01: Setup Infrastruktur
- [ ] Buat `src/lib/axios.ts` (instance + interceptor 401 → redirect login)
- [ ] Buat `src/lib/queryClient.ts` (TanStack Query config, staleTime default 60s)
- [ ] Buat `src/lib/websocket.ts` (singleton WsClient dengan reconnect backoff)
- [ ] Buat `src/types/api.types.ts`: `ApiResponse<T>`, `ApiError`
- [ ] Buat `src/stores/useAuthStore.ts`, `useNotifStore.ts`, `useMapStore.ts`
- [ ] Setup React Router di `App.tsx` dengan protected route + AppShell wrapper

**Verifikasi:** `npm run dev` → app berjalan di `http://localhost:5173`

---

## FASE 1: Auth & Layout (Estimasi: 3 jam)

### Task FE-02: Halaman Login / Register
- [ ] Buat `LoginPage.tsx` dengan split-screen layout (60/40)
- [ ] Sisi kiri: hero panel dengan gradient + teks branding
- [ ] Buat `LoginForm.tsx`:
  - Email input + Password input (show/hide toggle)
  - Role dropdown
  - Submit → `POST /api/v1/auth/login { clientType: "web" }`
  - Error handling: shake animation + pesan error Bahasa Indonesia
- [ ] Buat `RegisterForm.tsx`:
  - NIK, nama, telepon (+62), kelurahan, RT, RW, alamat, geotag GPS
  - GPS button: `navigator.geolocation.getCurrentPosition()`
  - Submit → `POST /api/v1/auth/register`
  - Success toast hijau
- [ ] Toggle animasi mulus antara LoginForm dan RegisterForm
- [ ] Setelah login sukses: init WebSocket → navigate ke "/"

### Task FE-03: AppShell (Layout Global)
- [ ] Buat `Sidebar.tsx`:
  - Logo "pilahsampah.id" + subtitle "Kecamatan Coblong"
  - 6 nav items dengan ikon Lucide + active state (border kiri hijau)
  - User info di bagian bawah: avatar + nama + role badge
- [ ] Buat `Topbar.tsx`:
  - Search input global
  - Date chip hari ini (format: "Selasa, 8 Juli 2026")
  - `NotifBell.tsx`: badge merah + dropdown list notifikasi
  - Avatar profil
- [ ] Buat `AppShell.tsx`: gabungkan Sidebar + Topbar + `<Outlet />`

**Verifikasi:** Login → muncul AppShell dengan sidebar dan topbar

---

## FASE 2: Komponen Shared (Estimasi: 2 jam)

### Task FE-04: Shared Components
- [ ] `EmptyState.tsx`: props = { title, subtext, ctaLabel, onCtaClick, illustrationType }
- [ ] `SkeletonLoader.tsx`: props = { count, height, width }
- [ ] `ErrorCard.tsx`: pesan error + tombol "Coba Lagi" (onRetry callback)
- [ ] `ConfirmModal.tsx`: props = { isOpen, title, message, onConfirm, onCancel, isLoading }
- [ ] `Toast.tsx`: slide-in kanan atas, auto-dismiss 4 detik, type = success/error/warning
- [ ] `StatusBadge.tsx`: pill komponen untuk AI status (SUCCESS/TIMEOUT/IMAGE_UNREADABLE/QUOTA_EXCEEDED)
- [ ] `CapacityProgressBar.tsx`: full logic warna (green/amber/red) sesuai `sdd.md` Section 3.6

---

## FASE 3: Dashboard Utama (Estimasi: 3 jam)

### Task FE-05: Dashboard Page
- [ ] Buat `useAnalytics.ts` hook:
  - `useSummary()` → TanStack Query wrap `GET /api/v1/analytics/summary`
  - `useTrends(days)` → wrap `GET /api/v1/analytics/trends`
- [ ] `KpiCard.tsx`: terima props sesuai interface `sdd.md` Section 3.5
- [ ] Render 4 KPI cards dengan data dari `useSummary()`
- [ ] `TrendLineChart.tsx`: Recharts LineChart 2 garis (hijau + biru dashed)
- [ ] `CapacityDonutChart.tsx`: Recharts PieChart + center label custom
- [ ] `MapPreviewCard.tsx`: SVG mini peta statis dengan zone warna + link ke `/map`
- [ ] `AlertPanel.tsx`: list notif BIN_FULL dari API + WS update real-time
- [ ] `EvaluationPanel.tsx`: data evaluasi + prediksi AI dari summary

**Verifikasi:** Dashboard load penuh dengan data seed — semua chart render tanpa error

---

## FASE 4: Peta Wilayah (Estimasi: 4 jam)

### Task FE-06: Map Page
- [ ] Install types: `npm install -D @types/leaflet`
- [ ] Buat `WasteMap.tsx`: init React-Leaflet MapContainer + OpenStreetMap tiles
  - Center: koordinat Kecamatan Coblong Bandung: `[-6.8834, 107.6198]`
  - Zoom default: 15
- [ ] Buat `RtPolygon.tsx`: Leaflet Polygon per RT dengan fillColor dinamis
- [ ] Buat `HouseholdMarker.tsx`: CircleMarker per koordinat household dengan warna bin status
- [ ] `MapFilterPanel.tsx`: filter kelurahan + kepatuhan + kapasitas
- [ ] Klik polygon RT → `navigate('/map/${rtRwId}')`
- [ ] Buat `MapRtDetailPage.tsx`:
  - Header dengan tombol "← Kembali ke Peta"
  - 4 KPI mini RT
  - Alert merah list household penuh
  - HouseholdTable filtered by rtRwId
  - EmptyState jika belum ada transaksi

**Verifikasi:** Peta render dengan polygon dan marker · Klik RT → RT detail slide-in

---

## FASE 5: Halaman Data Warga (Estimasi: 2 jam)

### Task FE-07: Households Page
- [ ] Buat `useHouseholds.ts`: TanStack Query + pagination + filter params
- [ ] `HouseholdTable.tsx`: tabel 9 kolom sesuai `ui_ux_flow.md` Screen 4
- [ ] Inline `CapacityProgressBar` per row dengan warna dinamis + pulse animation untuk ≥90%
- [ ] `AiStatusBadge` per row
- [ ] "Reset Volume" button → `ResetVolumeModal.tsx` → `POST /api/v1/bins/:id/empty`
- [ ] Pagination controls: prev/next + halaman nomor
- [ ] EmptyState jika filter tidak menemukan hasil

---

## FASE 6: Leaderboard & AI Eval (Estimasi: 2 jam)

### Task FE-08: Leaderboard Page
- [ ] `useLeaderboard.ts`: query rt + households dengan bulan sebagai param
- [ ] `PodiumDisplay.tsx`: 3 card podium (2nd kiri, 1st tengah tinggi, 3rd kanan)
- [ ] `RtRankList.tsx`: list lengkap dengan rank number + trend arrow
- [ ] `TopFamiliesList.tsx`: top 5 dengan medal emoji + gold/silver/bronze row bg
- [ ] Month navigator ← → (update query param)

### Task FE-09: AI Evaluation Page
- [ ] `AiEvaluationPage.tsx` dengan 4 KPI cards AI
- [ ] Bar chart request per jam (Recharts BarChart)
- [ ] Line chart akurasi 30 hari dengan dashed threshold line 75%
- [ ] `AiRequestLogTable.tsx`: tabel paginated 15 per halaman

---

## FASE 7: WebSocket Integration (Estimasi: 1 jam)

### Task FE-10: WebSocket Events
- [ ] Buat `useWebSocket.ts` hook: connect setelah auth, disconnect saat logout
- [ ] Handle `bin_full_alert` → `useNotifStore.addNotif()` + badge increment
- [ ] Handle `capacity_update` → `queryClient.invalidateQueries(['households'])`
- [ ] Handle `notification_new` → increment unread count
- [ ] Implementasi ping setiap 30 detik
- [ ] Test reconnect: matikan backend → hidupkan kembali → WS reconnect otomatis

---

## Urutan Eksekusi (Sequential)

```
FE-00 → FE-01 → FE-02 → FE-03 → FE-04 → FE-05 → FE-06 → FE-07 → FE-08 → FE-09 → FE-10
```

**Estimasi total:** ±18 jam kerja (±3-4 hari kerja efektif sprint 1)

---

## Link Trello Terkait
- `[FE] Setup Proyek React.js + Tailwind CSS + Vite`
- `[FE] Implementasi Dashboard Utama (KPI, Chart Tren, Peta Kepatuhan)`
- `[FE] Implementasi Tabel Data Warga Real-Time (Progress Bar + WebSocket)`
- `[FE] Leaderboard RT & Gamifikasi Warga (Papan Peringkat)`
- `[FE] Halaman Login & Registrasi Warga (Auth Form)`
