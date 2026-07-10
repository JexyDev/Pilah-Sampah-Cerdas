# UI/UX Flow Document
## pilahsampah.id | Frontend Web Dashboard
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026
**Acuan Desain:** Stitch AI design pilahsampah.id (web version) + design.md

---

## Konvensi Dokumen
- `→` = navigasi ke halaman/state lain
- `[Component]` = nama React component
- `API:` = endpoint backend yang dipanggil
- `WS:` = event WebSocket yang ditangani

---

## SCREEN 1: HALAMAN LOGIN / REGISTER

### Layout
```
+--[60% HERO PANEL]--+--[40% FORM PANEL]--+
|                    |                    |
|  Gradient hijau-   |  Logo kecil        |
|  biru diagonal     |  pilahsampah.id    |
|                    |                    |
|  Ilustrasi SVG     |  [LoginForm] ATAU  |
|  permukiman asri   |  [RegisterForm]    |
|  Bandung           |  (toggle link)     |
|                    |                    |
|  Headline text     |                    |
|  Feature chips     |                    |
+--------------------+--------------------+
```

### State: LOGIN (default)
- Input: Email (type=email, autofocus)
- Input: Password (type=password, toggle show/hide dengan Eye icon)
- Select: Peran → Admin Kecamatan / Petugas RT/RW / Warga
- Button: "Masuk ke Dashboard →" (full-width, green gradient)
- Toggle: "Belum punya akun? Daftar sekarang"

**Alur Submit Login:**
```
1. Klik "Masuk ke Dashboard"
2. Validasi client-side (email format, password min 8 char)
3. Loading state: button disabled + spinner
4. API: POST /api/v1/auth/login { email, password, clientType: "web" }
5. Response 200:
   → Set wsToken dari response ke useAuthStore
   → Inisialisasi WebSocket: wsClient.connect(wsToken)
   → Navigate ke "/" (Dashboard)
6. Response 401:
   → Tampilkan error di bawah password input: "Email atau password yang Anda masukkan salah."
   → Clear password field
   → Shake animation di form card
```

### State: REGISTER (toggle)
- Input: NIK (16 digit, max-length=16, pattern=\d{16})
- Input: Nama Kepala Keluarga
- Input: No. Telepon (prefix +62 chip readonly)
- Select: Kelurahan (Dago / Sadangserang / Sekeloa / Lebak Siliwangi / Cipaganti / Coblong)
- Select: Nomor RT + Nomor RW (side-by-side, 2 kolom)
- Textarea: Alamat Lengkap
- Button: "📍 Ambil Lokasi GPS Saat Ini" (outlined)
  → Tampilkan lat/lng chip hijau setelah diambil
- Button: "Daftar & Tunggu Verifikasi RT" (full-width, blue gradient)

**Alur Submit Register:**
```
1. Klik "Daftar & Tunggu Verifikasi RT"
2. Validasi NIK 16 digit, semua field wajib diisi
3. API: POST /api/v1/auth/register
4. Response 201:
   → Toast slide-in kanan atas (hijau): "✅ Pendaftaran Berhasil! Akun Anda menunggu verifikasi RT."
   → Auto-switch ke state LOGIN setelah 3 detik
5. Response 422:
   → Tampilkan field-level errors di bawah input masing-masing
```

---

## SCREEN 2: DASHBOARD UTAMA (`/`)

### Layout
```
[AppShell]
  └─ [Topbar]: Search | Tanggal | [NotifBell] | Avatar
  └─ [Sidebar]: active = Dashboard
  └─ Content:
      Row 1: [KpiCard×4]
      Row 2: [TrendLineChart (55%)] | [CapacityDonutChart (45%)]
      Row 3: [MapPreviewCard (60%)] | [AlertPanel (40%)]
      Row 4: [EvaluasiCard] | [PrediksiCard] | [AksiCepatCard]
```

### KpiCard Behavior
- API: `GET /api/v1/analytics/summary` (staleTime: 5 menit)
- Loading: tampilkan skeleton 4 card
- Data binding:
  - Card 1: `data.activeHouseholds` → "1.245" | sub: "82% dari total terdaftar"
  - Card 2: `data.avgCompliancePercent` → "48%" | sub: "Rata-rata kepatuhan se-RT"
  - Card 3: `data.totalWeightKg` → "8.450 Kg" | sub: `Organik: ${data.organicKg} | Anorganik: ${data.nonOrganicKg}`
  - Card 4: `data.interventionCount` → "7 RT" | sub: "Kepatuhan di bawah 40%"

### TrendLineChart
- API: `GET /api/v1/analytics/trends?days=30`
- Recharts LineChart: 2 lines (green=organik, blue dashed=anorganik)
- Hover tooltip: "Organik: X Kg · Anorganik: Y Kg"

### CapacityDonutChart
- Data dari `summary.binStatusCounts`: `{ safe: 820, warning: 312, full: 113 }`
- Center label: "68% Terisi"
- 3 legend strips: 🟢 Aman · 🟡 Hampir Penuh · 🔴 Penuh [Lihat Semua →]

### AlertPanel
- API: `GET /api/v1/notifications?type=BIN_FULL&isRead=false&limit=5`
- WS: event `bin_full_alert` → tambah item baru ke list (tanpa refetch)
- Setiap item: red-left-border card + nama warga + alamat + volume + waktu relatif

### MapPreviewCard
- SVG peta mini statis Coblong dengan zone RT berwarna
- Tombol "Lihat Peta Lengkap" → Navigate ke `/map`
- Klik zona RT langsung → Navigate ke `/map/:rtRwId`

---

## SCREEN 3: PETA WILAYAH (`/map`)

### Layout
```
[Content Area Full Width]
  └─ [MapFilterPanel (kanan, 280px fixed)] 
  └─ [WasteMap (sisa area)]
      └─ Leaflet tiles + [RtPolygon×n] + [HouseholdMarker×n]
      └─ [MapLegend (bottom-left overlay)]
      └─ [MapControls (top-right overlay)]
```

### WasteMap
- API: `GET /api/v1/households` → render HouseholdMarker per koordinat
- API: Data RT polygon (GeoJSON) dari `/api/v1/analytics/summary` (include rtRwAreas)
- WS: event `capacity_update` → refetch markers

### RtPolygon Interaction
- Hover: Tooltip muncul: "RT 04 / RW 05 — Kepatuhan: 41% 🔴"
- Klik: `navigate('/map/rt04-rw05')`
- Color logic: compliance >= 70 → fillColor '#4CAF50', 50-69 → '#F59E0B', < 50 → '#EF4444'
- fillOpacity: 0.4

### HouseholdMarker
- CircleMarker radius 8px
- Volume < 70%: color '#4CAF50'
- Volume 70-89%: color '#F59E0B'
- Volume ≥ 90%: color '#EF4444' + pulsing CSS animation
- Klik: Popup mini: "Bp. Asep — 23.8L / 25L ⚠️" + link "Lihat Detail"

---

## SCREEN 3B: RT DETAIL SUB-PAGE (`/map/:rtRwId`)

### Transition: slide-in dari kanan, durasi 300ms

### Layout
```
← Kembali ke Peta    |  Detail RT 04 / RW 05 — Kelurahan Dago
─────────────────────────────────────────────────────────────
[KpiMini×4]: Kepatuhan | Rumah Aktif | Volume | Poin RT
─────────────────────────────────────────────────────────────
[IntervensiAlert]: Tong penuh (≥90%) - list nama KK
[HouseholdTable]: Filtered by rtRwId
```

### Empty State (RT baru, belum ada transaksi)
```
[EmptyState Component]
  ilustrasi: SVG tong sampah kosong + kaca pembesar
  judul: "Belum Ada Data Transaksi"
  sub: "RT ini belum memiliki riwayat pemilahan. Bagikan QR Code kepada warga."
  CTA1 (green): "📤 Bagikan QR Code RT"
  CTA2 (outlined): "📋 Lihat Panduan Pendaftaran"
```

---

## SCREEN 4: DATA WARGA & TONG (`/households`)

### Topbar Controls
- Search input: placeholder "Cari nama, NIK, atau alamat..."
- Select: Filter Kelurahan
- Select: Filter Status Kapasitas (Aman / Hampir Penuh / Penuh)
- Button "+Tambah Warga" (blue) → slide-in drawer form

### HouseholdTable Columns
| # | Nama KK | Alamat | Jenis Tong | Kapasitas | Status AI | Poin | Aktif | Aksi |
- Pagination: 10 per halaman, "Menampilkan 1-10 dari 1.245 warga"

### ResetVolumeModal Flow
```
1. Klik "🔄 Reset Volume"
2. [ConfirmModal] muncul:
   Judul: "Konfirmasi Reset Volume"
   Pesan: "Apakah tong sampah Bp. Asep Syaepudin (RT 04) sudah dikosongkan secara fisik oleh petugas?"
   CTA: [Ya, Reset Sekarang] (red) | [Batal] (outlined)
3. Klik "Ya, Reset Sekarang":
   API: POST /api/v1/bins/:id/empty
   → Loading state di button
   → Response 200: 
     Toast: "✅ Volume tong berhasil direset ke 0L"
     Invalidate query households → tabel ter-refresh otomatis
4. Klik "Batal": tutup modal
```

---

## SCREEN 5: PAPAN PERINGKAT (`/leaderboard`)

### Layout
```
Header: "Papan Peringkat 🏆" | ← Juni 2026 →
─────────────────────────────────────────────
[PodiumDisplay]: 🥈 RT03 | 🥇 RT01 | 🥉 RT02
─────────────────────────────────────────────
[RtRankList (50%)] | [TopFamiliesList (50%)]
─────────────────────────────────────────────
[GamifikasiStats×3]
```

- API: `GET /api/v1/leaderboard/rt?month=2026-06`
- API: `GET /api/v1/leaderboard/households?month=2026-06`
- Month navigation: update query param

---

## SCREEN 6: EVALUASI AI (`/ai-evaluation`)

### Layout
```
[KpiAiCard×4]
[AiRequestChart (bar, per jam)] | [AccuracyTrendChart (line, 30 hari)]
[AiRequestLogTable (paginated)]
```

- API: `GET /api/v1/analytics/ai-evaluation`
- API: `GET /api/v1/waste/logs?page=1&limit=15`
- Accuracy threshold line di 75% (dashed red)

---

## Global: Notifikasi Bell

```
[NotifBell Component di Topbar]
  └─ Badge merah: count dari useNotifStore.unreadCount
  └─ Klik → Dropdown slide-down:
      Judul: "Notifikasi Terkini"
      List notif (scroll max 400px):
        - [BIN_FULL] 🔴 "Tong Penuh — Bp. Asep, RT 04 · 2j lalu"
        - [AI_FAILURE] 🟡 "3 upload gagal terdeteksi · 5j lalu"
      Footer: "Tandai Semua Dibaca"
  └─ WS: event `bin_full_alert` → increment badge + tambah ke list tanpa reload
```
