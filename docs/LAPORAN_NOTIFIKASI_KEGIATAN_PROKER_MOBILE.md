# Dokumentasi & Spesifikasi Integrasi Notifikasi Mobile (Kegiatan & Proker)

> **Projek:** BERSEKA (Bersih, Sehat, Kampung Asri)  
> **Modul:** Push Notification & In-App Notification (Kegiatan KKN & Program Kerja)  
> **Target Pengguna:** Mahasiswa KKN (`MAHASISWA_KKN`), Dosen Pembimbing Lapangan (`DPL`)  
> **Penyusun:** Backend Engineering Team  
> **Status:** Ready for Mobile Implementation (Backend Live on development)

---

## 1. Ringkasan Fitur

Backend telah mengimplementasikan logika **Push Notification (Firebase Cloud Messaging / FCM)** dan **In-App Notification Database** untuk 3 alur utama:
1. **Kegiatan Di-approve (Disetujui)**:
   - DPL menyetujui logbook kegiatan harian mahasiswa (`action: "APPROVE"`).
   - Ketua Kelompok menyetujui logbook kegiatan anggota (`action: "APPROVE"`).
   - Mahasiswa pembuat kegiatan menerima push notifikasi real-time & badge unread bertambah.
2. **Kegiatan Diminta Perbaikan (Revisi / Ditolak)**:
   - DPL menandai logbook perlu perbaikan (`action: "REVISI"`).
   - Ketua Kelompok menolak logbook (`action: "REJECT"`).
   - Mahasiswa menerima notifikasi berisi pesan & catatan evaluasi DPL/Ketua.
3. **Program Kerja (Proker) Di-approve**:
   - DPL menyetujui usulan Program Kerja kelompok KKN (`statusUsulan: "DISETUJUI"`).
   - **Seluruh mahasiswa dalam kelompok KKN tersebut** langsung menerima push notification FCM secara broadcast.

---

## 2. Endpoint REST API Terkait Notifikasi

Base URL: `https://api.berseka.id/api/v1` (atau `http://localhost:5000/api/v1` untuk dev lokal).  
Header Wajib: `Authorization: Bearer <jwt_token>`

### A. Registrasi FCM Device Token
Setiap kali user login atau token FCM di-refresh oleh Firebase SDK di mobile app, kirimkan token ke backend agar push notification bisa dikirimkan ke perangkat yang benar.

- **URL:** `POST /api/v1/notifications/device-token`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "token": "eX_fcm_token_dari_firebase_messaging_instance..."
}
```
- **Response 200 OK:**
```json
{
  "status": "success",
  "message": "Device token berhasil disimpan"
}
```

---

### B. Unregister FCM Device Token (Saat Logout)
Wajib dipanggil saat user melakukan Logout agar tidak ada notifikasi yang bocor ke user berikutnya di perangkat yang sama.

- **URL:** `POST /api/v1/notifications/unregister-token`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "status": "success",
  "message": "Device token berhasil dihapus"
}
```

---

### C. Mengambil Daftar Riwayat Notifikasi In-App
Digunakan pada halaman Notifikasi aplikasi mobile.

- **URL:** `GET /api/v1/notifications`
- **Query Params (Opsional):** `role=MAHASISWA_KKN`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "success": true,
  "status": "success",
  "data": [
    {
      "id": "c62a8236-4d2c-4934-bc2d-5b3a886f3b01",
      "type": "KEGIATAN_DISETUJUI",
      "title": "Kegiatan Disetujui DPL! 🎉",
      "desc": "Logbook kegiatan Anda (Sosialisasi Pemilahan Sampah Organik di RW 03...) telah diverifikasi dan disetujui resmi oleh DPL.",
      "isRead": false,
      "time": "5 menit lalu",
      "createdAt": "2026-09-08T08:30:00.000Z",
      "icon": "task_alt",
      "iconBg": "bg-emerald-100",
      "iconColor": "text-emerald-600"
    },
    {
      "id": "e71b9347-5e3d-4a45-cd3e-6c4b997f4c02",
      "type": "KEGIATAN_REVISI",
      "title": "Kegiatan Perlu Perbaikan DPL ⚠️",
      "desc": "Logbook kegiatan Anda memerlukan perbaikan: Mohon lengkapi foto bersama warga dan deskripsi output sampah.",
      "isRead": false,
      "time": "1 jam lalu",
      "createdAt": "2026-09-08T07:15:00.000Z",
      "icon": "edit_note",
      "iconBg": "bg-amber-100",
      "iconColor": "text-amber-600"
    },
    {
      "id": "f82c0458-6f4e-5b56-de4f-7d5c008f5d03",
      "type": "PROKER_DISETUJUI",
      "title": "Program Kerja Disetujui! 🎯",
      "desc": "Program kerja \"Pembuatan Komposter Loseda Skala RW\" untuk kelompok Kelompok 12 Coblong telah resmi disetujui oleh DPL (Dr. Ir. Budi Santoso, M.T.).",
      "isRead": true,
      "time": "1 hari lalu",
      "createdAt": "2026-09-07T14:00:00.000Z",
      "icon": "assignment_turned_in",
      "iconBg": "bg-indigo-100",
      "iconColor": "text-indigo-600"
    }
  ],
  "unreadCount": 2
}
```

---

### D. Menandai Notifikasi Dibaca (Mark as Read)

#### 1. Tandai 1 Notifikasi:
- **URL:** `PUT /api/v1/notifications/:id/read`
- **Response 200 OK:**
```json
{
  "success": true,
  "status": "success",
  "message": "Notifikasi berhasil ditandai dibaca"
}
```

#### 2. Tandai Semua Notifikasi Dibaca:
- **URL:** `PUT /api/v1/notifications/read-all`
- **Response 200 OK:**
```json
{
  "success": true,
  "status": "success",
  "message": "Semua notifikasi berhasil ditandai dibaca"
}
```

---

## 3. Spesifikasi Payload Push Notification FCM

Setiap push notification yang dikirimkan oleh backend memiliki dua bagian utama:
1. `notification`: Untuk system tray bawaan OS Android / iOS.
2. `data`: Dictionary key-value string untuk logika aplikasi di Flutter.

---

### Skenario 1: Kegiatan Di-approve (Disetujui DPL)

#### FCM Payload:
```json
{
  "notification": {
    "title": "Kegiatan Disetujui DPL! 🎉",
    "body": "Logbook kegiatan Anda (Sosialisasi Pemilahan Sampah...) telah diverifikasi dan disetujui resmi oleh DPL."
  },
  "data": {
    "notificationId": "c62a8236-4d2c-4934-bc2d-5b3a886f3b01",
    "triggerType": "LOGBOOK_APPROVED",
    "type": "KEGIATAN_DISETUJUI",
    "event": "REFRESH_KEGIATAN_MAHASISWA",
    "entityId": "logbook_uuid_123",
    "logbookId": "logbook_uuid_123",
    "status": "DISETUJUI_DPL",
    "pekanKe": "2",
    "sentAt": "2026-09-08T08:30:00.000Z",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

---

### Skenario 2: Kegiatan Diminta Perbaikan (Perlu Revisi DPL)

#### FCM Payload:
```json
{
  "notification": {
    "title": "Kegiatan Perlu Perbaikan DPL ⚠️",
    "body": "Logbook kegiatan Anda memerlukan perbaikan: Mohon lengkapi foto bersama warga dan deskripsi output sampah."
  },
  "data": {
    "notificationId": "e71b9347-5e3d-4a45-cd3e-6c4b997f4c02",
    "triggerType": "LOGBOOK_REVISI",
    "type": "KEGIATAN_REVISI",
    "event": "REFRESH_KEGIATAN_MAHASISWA",
    "entityId": "logbook_uuid_123",
    "logbookId": "logbook_uuid_123",
    "status": "PERLU_REVISI_DPL",
    "catatan": "Mohon lengkapi foto bersama warga dan deskripsi output sampah.",
    "pekanKe": "2",
    "sentAt": "2026-09-08T07:15:00.000Z",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

---

### Skenario 3: Program Kerja (Proker) Di-approve

Dikirimkan secara broadcast ke **semua anggota kelompok KKN**.

#### FCM Payload:
```json
{
  "notification": {
    "title": "Program Kerja Disetujui! 🎯",
    "body": "Program kerja \"Pembuatan Komposter Loseda Skala RW\" untuk kelompok Kelompok 12 Coblong telah resmi disetujui oleh DPL."
  },
  "data": {
    "notificationId": "f82c0458-6f4e-5b56-de4f-7d5c008f5d03",
    "triggerType": "PROKER_APPROVED",
    "type": "PROKER_DISETUJUI",
    "event": "REFRESH_PROKER_MAHASISWA",
    "entityId": "proker_uuid_456",
    "prokerId": "proker_uuid_456",
    "kelompokId": "kelompok_uuid_789",
    "status": "DISETUJUI",
    "statusPelaksanaan": "BELUM_MULAI",
    "catatan": "Rencana kerja sangat baik, silakan dikoordinasikan dengan pengurus RW setempat.",
    "sentAt": "2026-09-07T14:00:00.000Z",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

---

## 4. Panduan Implementasi di Aplikasi Mobile Flutter

Di file `mobile/lib/main.dart`, listener foreground dan background dapat memanfaatkan field payload `event` dan `type` untuk auto-refresh dan navigasi langsung (deep linking):

### A. Auto-Refresh State / Provider (Foreground)
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final event = message.data['event']?.toString() ?? '';

  if (event == 'REFRESH_KEGIATAN_MAHASISWA') {
    // Invalidate provider riwayat dan detail logbook agar data ter-update seketika tanpa restart
    ref.invalidate(riwayatKknControllerProvider);
    ref.invalidate(mahasiswaControllerProvider);
    ref.invalidate(notificationsProvider);
    ref.invalidate(mahasiswaNotificationsProvider);
  } else if (event == 'REFRESH_PROKER_MAHASISWA') {
    // Invalidate provider program kerja kelompok KKN
    ref.invalidate(programKerjaControllerProvider);
    ref.invalidate(kelompokControllerProvider);
    ref.invalidate(notificationsProvider);
    ref.invalidate(mahasiswaNotificationsProvider);
  }
});
```

### B. Navigasi Saat Notifikasi Di-tap (Background & Terminated)
Saat pengguna men-tap notifikasi di system tray OS:
```dart
void _handleNotificationRoute(RemoteMessage message) {
  final type = (message.data['type'] ?? '').toString().toUpperCase();
  final logbookId = message.data['logbookId']?.toString();
  final prokerId = message.data['prokerId']?.toString();

  if (type == 'KEGIATAN_DISETUJUI' || type == 'KEGIATAN_REVISI') {
    if (logbookId != null && logbookId.isNotEmpty) {
      // Navigasi langsung ke detail logbook aktivitas
      navigatorKey.currentState?.pushNamed(
        AppRoutes.mahasiswaLogbookDetail,
        arguments: {'id': logbookId},
      );
      return;
    }
  } else if (type == 'PROKER_DISETUJUI' || type == 'PROKER_DITOLAK') {
    if (prokerId != null && prokerId.isNotEmpty) {
      // Navigasi langsung ke detail program kerja
      navigatorKey.currentState?.pushNamed(
        AppRoutes.mahasiswaProkerDetail,
        arguments: {'id': prokerId},
      );
      return;
    }
  }

  // Fallback: buka halaman daftar notifikasi
  navigatorKey.currentState?.pushNamed(AppRoutes.mahasiswaNotifikasi);
}
```

---

## 5. Ringkasan Status Uji Backend
- **Unit Testing**: Uji `notificationIntegrationService.test.ts` (FCM push dispatch, `sendToUser`, `sendToUsers`) berhasil 100% lulus.
- **TypeScript Static Analysis**: `npx tsc --noEmit` sukses tanpa error tipe data.
- **Compatibility**: 100% kompatibel dengan arsitektur existing Riverpod & Dio di aplikasi mobile Flutter BERSEKA.
