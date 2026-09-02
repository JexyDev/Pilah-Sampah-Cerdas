# 🔴 Laporan Bug untuk Tim Backend: Status "TERJEDA" Otomatis Tanpa Peringatan

**Tanggal Analisis:** 01–02 September 2026  
**Dilaporkan oleh:** Tim Mobile  
**Target:** Tim Backend — Perlu Perubahan Kode di `kknAttendanceService.ts`  
**Severity:** 🔴 **CRITICAL** — Berdampak pada seluruh mahasiswa KKN yang menggunakan multi-tasking

---

## 🧩 Ringkasan Masalah

Mahasiswa menekan **"Mulai Kegiatan"**, kemudian berpindah ke aplikasi lain (minimize/buka WhatsApp dll). Dalam waktu **≤ 15 detik**, status presensi langsung berubah menjadi **TERJEDA** di dashboard web, **tanpa peringatan apapun**, meskipun mahasiswa **secara fisik tidak beranjak dari posko** dan background service mobile **terus mengirim ping dengan benar**.

---

## 🔍 Mengapa GPS Bisa "Meleset" Padahal Mahasiswa Tidak Pindah?

Ini adalah inti dari permasalahan yang perlu dipahami oleh tim backend sebelum melihat kode.

### Perilaku OS Android saat Aplikasi di-Minimize

Ketika pengguna menekan tombol Home atau berpindah ke aplikasi lain, OS Android melakukan serangkaian tindakan untuk menghemat baterai:

1. **Android "mencekik" akses hardware GPU/GPS** — Prioritas akses ke chip GPS yang boros baterai langsung diturunkan drastis untuk aplikasi yang di-background.

2. **Dart Isolate utama dibekukan** — Timer bawaan Dart (termasuk `LocationPingController` yang interval 15 detik) langsung mati karena tidak bisa berjalan di luar Dart Isolate yang aktif.

3. **Namun, timer tersebut masih sempat menembakkan 1 ping terakhir** tepat di momen transisi (saat Android sedang "mencekik" akses GPS namun isolate belum sepenuhnya beku).

4. **Pada momen inilah, library GPS tidak punya cukup waktu** untuk meminta posisi segar dari satelit. Sebagai fallback, library menggunakan salah satu dari:
   - **`getLastKnownPosition`** — posisi terakhir yang di-cache di memori, bisa dari beberapa menit lalu (stale)
   - **Network Location (BTS/WiFi)** — akurasi sangat rendah, bisa meleset **50–500 meter**

5. **Ping dengan koordinat tidak akurat ini dikirim ke backend**, yang secara matematis murni menghitung: *"Titik ini ada di dalam poligon? Tidak. Berarti DI LUAR ZONA."*

### Kesimpulan Penting
> **Mahasiswa tidak pernah benar-benar keluar dari zona.** Yang terjadi adalah **glitch GPS sesaat** yang bersifat teknikal dan alamiah di semua perangkat Android. Sistem backend seharusnya mengetahui hal ini dan memberikan toleransi, bukan langsung memvonis TERJEDA.

---

## 🔁 Kronologi Bug Lengkap (Step-by-Step)

| Waktu | Aktor | Event |
|-------|-------|-------|
| T+0s | Mobile | Mahasiswa tekan "Mulai Kegiatan" → status = `BERLANGSUNG` |
| T+0s | Mobile | `LocationPingController` (Dart Timer, interval 15 detik) mulai |
| T+0s | Mobile | GPS Foreground Service (Android Service, interval 30 detik) mulai |
| T+5s | OS Android | Mahasiswa tekan Home → pindah ke WhatsApp |
| T+5s | OS Android | Android mulai "mencekik" akses GPS aplikasi |
| T+6s | OS Android | Dart Isolate utama dibekukan → `LocationPingController` MATI |
| T+10s | Mobile | ⚠️ Dart sempat menembakkan **ping terakhir** sebelum beku, menggunakan **posisi GPS cache/network yang tidak akurat** → koordinat meleset keluar zona |
| T+11s | Backend | Terima ping, hitung geofence: `!isCurrInside` = **true** |
| T+11s | Backend | 🔴 **Langsung update database** → `status = "TERJEDA"` |
| T+11s | Backend | Broadcast WebSocket → dashboard web berubah ke "⏸️ TERJEDA" |
| T+12s | Mobile | Terima response: `attendanceStatus: "TERJEDA"` |
| T+30s | Mobile | **GPS Foreground Service** kirim ping dengan **koordinat GPS satelit akurat** (mahasiswa masih di dalam zona) |
| T+30s | Backend | Terima ping, deteksi `isCurrInside` = **true**, trigger auto-resume |
| T+30s | Backend | Update database → `status = "BERLANGSUNG"` kembali |

**Efek yang terlihat:** Status berkedip BERLANGSUNG → TERJEDA → BERLANGSUNG dalam 20–30 detik, tanpa mahasiswa berpindah tempat.

---

## 🔍 Akar Masalah di Kode Backend

### File: `apps/api/src/services/kknAttendanceService.ts`  
### Fungsi: `pingLocation()` — Baris 712–743

```typescript
// Auto-Pause saat keluar zona  ← INI AKAR MASALAHNYA
if (!isCurrInside && currentAttStatus === "BERLANGSUNG") {
    // Backend LANGSUNG ubah ke TERJEDA hanya dari 1 ping!
    // Tidak ada pengecekan: apakah ini GPS glitch atau benar-benar keluar?
    currentAttStatus = "TERJEDA";
    await prisma.activityAttendance.update({
        where: { id: existingAtt.id },
        data: { status: "TERJEDA", ... },
    });
    // Broadcast WebSocket → dashboard web langsung berubah
}
```

**Masalah:** Backend mengubah status `BERLANGSUNG → TERJEDA` hanya berdasarkan **SATU kali ping** yang mendeteksi mahasiswa di luar zona, **tanpa memperhitungkan kemungkinan GPS glitch/inaccuracy**.

---

## ❗ Tiga Faktor Penyebab yang Saling Memperparah

### 1. ⚡ Zero-Tolerance Auto-Pause di Backend *(Akar Utama)*
Backend memvonis "keluar zona" dari **satu kali** deteksi `!isCurrInside`. Tidak ada counter "berapa ping berturut-turut terdeteksi di luar zona" dan tidak ada jeda waktu sebelum status benar-benar diubah.

### 2. 📡 GPS Glitch saat App Minimize *(Faktor Pemicu)*
Saat transisi ke background, Android "mencekik" akses GPS sesaat. Ping terakhir dari Dart (sebelum isolate beku) menggunakan koordinat yang tidak akurat (cache/network location), sehingga posisi yang dilaporkan ke backend seolah-olah di luar zona, padahal mahasiswa tidak pindah.

### 3. 🔄 Dual-Mechanism Mobile yang Justru Membuktikan Masalah *(Bukti)*
Mobile menggunakan dua mekanisme ping: Dart Timer (15 detik, mati saat background) dan Foreground Service (30 detik, tetap hidup di background). Fakta bahwa **30 detik kemudian** Foreground Service kirim ping dan backend langsung auto-resume justru **membuktikan** mahasiswa tidak pernah benar-benar keluar zona.

---

## 📊 Kondisi Saat Ini vs Yang Seharusnya

| Aspek | Saat Ini (Bermasalah) | Yang Seharusnya |
|-------|----------------------|-----------------|
| Trigger auto-jeda | 1 ping di luar zona → **langsung TERJEDA** | Minimal **3 ping berturut-turut** di luar zona |
| Toleransi GPS glitch | **0 detik** | Minimal **90 detik** (3× siklus ping 30 detik) |
| Peringatan ke mahasiswa | **Tidak ada** | Ada notifikasi sebelum status diubah |
| Grace period | **Tidak ada** | Minimal 60–90 detik |
| Pertimbangan akurasi GPS | **Tidak ada** | Tidak memvonis dari 1 titik yang bisa jadi glitch |

---

## 🛠️ Solusi yang Direkomendasikan: Grace Period dengan `jedaLogs`

### Konsep Solusi

Jangan langsung mengubah status ke TERJEDA saat 1 ping pertama di luar zona terdeteksi. Sebaliknya, **simpan catatan sementara (`PENDING_PAUSE`)** ke field `jedaLogs` yang sudah ada, tanpa mengubah status. Baru setelah **grace period 90 detik terlampaui** dan mahasiswa **masih** terdeteksi di luar zona, barulah status diubah ke TERJEDA.

### Keunggulan Pendekatan Ini
- ✅ **Tanpa schema migration** — menggunakan field `jedaLogs` (JSON) yang sudah ada
- ✅ **Backward compatible** — logika auto-resume yang sudah ada tidak perlu diubah
- ✅ **Toleran terhadap GPS glitch** — 1 titik meleset tidak langsung memvonis
- ✅ **Jika mahasiswa kembali ke zona sebelum 90 detik**, `PENDING_PAUSE` dibersihkan otomatis, **seolah tidak pernah terjadi**

---

### Implementasi: Ganti Blok Auto-Pause di `pingLocation()` (Baris 712–743)

**SEBELUM (Kode Bermasalah — Baris 712–743):**
```typescript
// Auto-Pause saat keluar zona
if (!isCurrInside && currentAttStatus === "BERLANGSUNG") {
    const currentLiveSecs = calculateLiveInZoneSeconds(existingAtt);
    const currentLiveMins = Math.floor(currentLiveSecs / 60);
    currentLogs.push({
        alasan: "Keluar Zona Geofence (Otomatis)",
        waktuJeda: new Date().toISOString(),
        durasiSebelumJedaMenit: currentLiveMins,
        durasiSebelumJedaDetik: currentLiveSecs,
        autoTriggered: true,
    });
    currentAttStatus = "TERJEDA";
    existingAtt.actualInZoneMinutes = currentLiveMins;
    await prisma.activityAttendance.update({
        where: { id: existingAtt.id },
        data: {
            status: "TERJEDA",
            actualInZoneMinutes: currentLiveMins,
            jedaLogs: currentLogs,
        },
    });
    existingAtt.status = "TERJEDA";
    existingAtt.jedaLogs = currentLogs as any;
    websocketService.broadcastStudentAttendance({
        id: existingAtt.id,
        studentId: existingAtt.studentId,
        scheduleId: existingAtt.scheduleId,
        status: "TERJEDA",
        currentStatus: "DI_LUAR_ZONA",
        attendedAt: existingAtt.attendedAt.toISOString(),
        actualInZoneMinutes: currentLiveMins,
    });
}
```

**SESUDAH (Kode yang Disarankan — Ganti Seluruh Blok di Atas):**
```typescript
// ─────────────────────────────────────────────────────────────────────────────
// AUTO-PAUSE dengan GRACE PERIOD — Mencegah false pause akibat GPS glitch
//
// Konteks: Saat mahasiswa minimize app, OS Android "mencekik" akses GPS sesaat.
// Ping terakhir dari Dart Timer (15 detik) bisa menggunakan koordinat cache/network
// yang tidak akurat, sehingga mahasiswa seolah "keluar zona" padahal tidak.
// Foreground Service (30 detik) akan segera mengirim koordinat akurat berikutnya.
// 
// Solusi: Jangan vonis TERJEDA dari 1 ping. Tunggu 90 detik (3 siklus ping).
// Jika mahasiswa kembali ke zona sebelum 90 detik → hapus pending, tidak ada perubahan.
// ─────────────────────────────────────────────────────────────────────────────

if (!isCurrInside && currentAttStatus === "BERLANGSUNG") {
  const GRACE_PERIOD_MS = 90_000; // 90 detik = 3 siklus ping background (30 detik)

  // Cek apakah sudah ada entri "pending pause" dari ping sebelumnya
  const pendingPauseIdx = currentLogs.findIndex(
    (l: any) => l.type === "PENDING_PAUSE" && !l.confirmed
  );
  const pendingPauseLog = pendingPauseIdx !== -1 ? currentLogs[pendingPauseIdx] : null;

  if (!pendingPauseLog) {
    // === PING PERTAMA DI LUAR ZONA ===
    // Kemungkinan GPS glitch. Catat sebagai "pending", JANGAN ubah status.
    const currentLiveSecs = calculateLiveInZoneSeconds(existingAtt);
    currentLogs.push({
      type: "PENDING_PAUSE",
      alasan: "Keluar Zona Geofence (Menunggu Konfirmasi Grace Period)",
      waktuDeteksiKeluar: new Date().toISOString(),
      durasiSebelumJedaDetik: currentLiveSecs,
      durasiSebelumJedaMenit: Math.floor(currentLiveSecs / 60),
      autoTriggered: true,
      confirmed: false,
    });

    // Hanya update jedaLogs — STATUS TETAP "BERLANGSUNG"
    await prisma.activityAttendance.update({
      where: { id: existingAtt.id },
      data: { jedaLogs: currentLogs },
    });
    existingAtt.jedaLogs = currentLogs as any;
    // currentAttStatus TIDAK BERUBAH — tetap "BERLANGSUNG"

  } else {
    // === PING BERIKUTNYA — CEK APAKAH GRACE PERIOD SUDAH TERLAMPAUI ===
    const firstDetectedAt = new Date(pendingPauseLog.waktuDeteksiKeluar).getTime();
    const elapsedMs = Date.now() - firstDetectedAt;

    if (elapsedMs >= GRACE_PERIOD_MS) {
      // Grace period terlampaui → mahasiswa memang benar-benar di luar zona → TERJEDA
      const currentLiveSecs =
        pendingPauseLog.durasiSebelumJedaDetik ?? calculateLiveInZoneSeconds(existingAtt);
      const currentLiveMins = Math.floor(currentLiveSecs / 60);

      pendingPauseLog.confirmed = true;
      pendingPauseLog.waktuJeda = new Date().toISOString();
      pendingPauseLog.alasan = "Keluar Zona Geofence (Otomatis — Grace Period Terlampaui)";

      currentAttStatus = "TERJEDA";
      existingAtt.actualInZoneMinutes = currentLiveMins;

      await prisma.activityAttendance.update({
        where: { id: existingAtt.id },
        data: {
          status: "TERJEDA",
          actualInZoneMinutes: currentLiveMins,
          jedaLogs: currentLogs,
        },
      });
      existingAtt.status = "TERJEDA";
      existingAtt.jedaLogs = currentLogs as any;

      websocketService.broadcastStudentAttendance({
        id: existingAtt.id,
        studentId: existingAtt.studentId,
        scheduleId: existingAtt.scheduleId,
        status: "TERJEDA",
        currentStatus: "DI_LUAR_ZONA",
        attendedAt: existingAtt.attendedAt.toISOString(),
        actualInZoneMinutes: currentLiveMins,
      });
    }
    // Jika belum lewat grace period: ABAIKAN, status tetap BERLANGSUNG
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BERSIHKAN PENDING_PAUSE JIKA MAHASISWA KEMBALI KE ZONA SEBELUM GRACE PERIOD
// Ini adalah skenario normal: GPS glitch sesaat, lalu kembali akurat.
// Hapus pending seolah tidak pernah terjadi → TIDAK ada interupsi bagi user.
// ─────────────────────────────────────────────────────────────────────────────
if (isCurrInside && currentAttStatus === "BERLANGSUNG") {
  const pendingIdx = currentLogs.findIndex(
    (l: any) => l.type === "PENDING_PAUSE" && !l.confirmed
  );
  if (pendingIdx !== -1) {
    currentLogs.splice(pendingIdx, 1);
    await prisma.activityAttendance.update({
      where: { id: existingAtt.id },
      data: { jedaLogs: currentLogs },
    });
    existingAtt.jedaLogs = currentLogs as any;
  }
}
```

> **Catatan Penting:** Blok **Auto-Resume** yang ada di baris 745–785 **tidak perlu diubah**. Logika tersebut sudah bekerja dengan benar dan tetap berfungsi untuk skenario di mana mahasiswa benar-benar keluar zona dan kemudian kembali.

---

## 🔁 Alur Kerja Setelah Perbaikan

```
Ping masuk → Mahasiswa di luar zona?
    │
    ├─ TIDAK → Bersihkan PENDING_PAUSE (jika ada) → Status tetap BERLANGSUNG ✅
    │
    └─ YA → Sudah ada PENDING_PAUSE?
              │
              ├─ TIDAK → Simpan PENDING_PAUSE, status tetap BERLANGSUNG ⏳
              │          (Tunggu ping berikutnya)
              │
              └─ YA → Grace period 90 detik sudah terlampaui?
                        │
                        ├─ BELUM → Abaikan, status tetap BERLANGSUNG ⏳
                        │          (Mungkin hanya GPS glitch)
                        │
                        └─ YA → Ubah status ke TERJEDA 🔴
                                  (Mahasiswa memang benar-benar di luar zona)
```

---

## 🔎 Referensi Kode

| File | Baris | Keterangan |
|------|-------|------------|
| `services/kknAttendanceService.ts` | **L712–743** | 🔴 Ganti seluruh blok ini dengan kode di atas |
| `services/kknAttendanceService.ts` | L745–785 | ✅ Auto-resume — tidak perlu diubah |
| `services/kknAttendanceService.ts` | L130–213 | `calculateLiveInZoneMinutes()` — tidak perlu diubah |
| `services/kknAttendanceService.ts` | L679–695 | Smart Zone Multi-Posko — tidak perlu diubah |
| `routes/kknAttendanceRoutes.ts` | L346–353 | Route `/location-ping` — tidak perlu diubah |

---

## ✅ Yang Tidak Perlu Diubah

- Logika **Auto-Resume** (baris 745–785) — sudah benar
- Logika **geofence / polygon check** (baris 656–696) — sudah benar
- Logika **Smart Zone Multi-Posko** (baris 679–695) — sudah benar
- Nilai `bufferMeters` dari konfigurasi — sudah benar
- Route, middleware, dan WebSocket service — sudah benar

---

## 🚨 Prioritas: SANGAT TINGGI

Setiap mahasiswa yang menggunakan aplikasi sambil multitasking (membuka WhatsApp, menerima panggilan, dll.) terdampak. Ini bukan edge case — ini perilaku normal semua pengguna smartphone. Dampaknya:

1. **Data presensi tidak valid** — durasi terputus karena TERJEDA palsu
2. **Pengalaman pengguna buruk** — notifikasi "TERJEDA" muncul tanpa sebab
3. **Kepercayaan pada sistem berkurang** — mahasiswa merasa sistem tidak adil

Perubahan ini **tidak memerlukan schema migration** dan **tidak mengubah perilaku skenario normal** (mahasiswa yang benar-benar keluar zona tetap akan di-TERJEDA setelah 90 detik).
