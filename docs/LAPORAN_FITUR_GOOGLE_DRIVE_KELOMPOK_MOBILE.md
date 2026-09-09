# 📋 Laporan Teknis: Fitur Google Drive Kelompok untuk Tim Mobile Developer

**Tanggal:** 4 September 2026  
**Target:** Tim Mobile Developer (Flutter) & Tim Backend  
**Topik:** Integrasi Fitur Link Google Drive Kelompok Mahasiswa KKN  
**Status Saat Ini:** 🟡 *In-Progress / Backend Schema & Endpoint Update Pending*

---

## 1. Ringkasan Eksekutif (Executive Summary)

Pada modul web dashboard admin/super user (**Manajemen Ekosistem KKN**), telah tersedia:
1. **Input Link Google Drive Kelompok (Opsional)** pada form pembuatan dan pengeditan kelompok KKN.
2. **Card Status "Google Drive Kelompok"** pada modal detail kelompok dengan keterangan *"Penyimpanan dokumen & portofolio"*.

Tujuan fitur ini adalah memfasilitasi mahasiswa KKN dan DPL dalam mengakses folder penyimpanan cloud terpusat (Google Drive) langsung dari aplikasi mobile untuk upload/monitoring dokumen, laporan harian, portofolio program kerja, serta berkas administrasi KKN.

Hasil audit teknis terhadap codebase:
- **Backend API & Database:** Tabel `kelompok_kkn` belum memiliki kolom `link_google_drive`, dan endpoint `GET /api/v1/kkn/kelompok/me` belum menyertakan URL tersebut dalam respons.
- **Mobile Flutter:** Model data `KelompokKknData` belum mem-parsing field drive, dan layar `KelompokKknView` belum memiliki widget card / tombol untuk membuka Google Drive kelompok.

Laporan ini memuat panduan lengkap spesifikasi kontrak API baru, perubahan data model, serta contoh implementasi UI di Flutter.

---

## 2. Spesifikasi Kontrak API Backend (API Contract)

### Endpoint
`GET /api/v1/kkn/kelompok/me`

### Headers
```http
Authorization: Bearer <JWT_TOKEN_MAHASISWA>
Accept: application/json
```

### Response Payload (200 OK)
Field baru yang ditambahkan adalah `linkGoogleDrive` (berupa URL string atau `null` jika belum diset oleh Admin).

```json
{
  "success": true,
  "data": {
    "groupId": "731c2eea-f699-4dcc-88e9-3aada9c115d2",
    "groupName": "Kelompok 1 Cipaganti",
    "linkGoogleDrive": "https://drive.google.com/drive/folders/1WvEYp67OK_xq7uVFiRnePihgBzmq2Byx",
    "dosenPembimbing": "Dr. Ir. Budi Santoso, M.T.",
    "dplNip": "197501012000031001",
    "dplPhone": "08123456789",
    "poskoLocation": "RW 01, Kel. Cipaganti",
    "poskoAlamat": "Balai RW 01 Cipaganti",
    "poskoStatus": "REGISTERED",
    "poskoFacilityId": "fac_12345",
    "isUserLeader": true,
    "poskoLatitude": -6.8906,
    "poskoLongitude": 107.6123,
    "radiusMeter": 500,
    "totalGroupPoints": 1250,
    "members": [
      {
        "userId": "user_001",
        "nim": "1301210001",
        "name": "Ahmad Fauzi",
        "jurusan": "Teknik Informatika",
        "fakultas": "Informatika",
        "individualPoints": 250,
        "isLeader": true
      }
    ]
  }
}
```

### Variasi Nilai `linkGoogleDrive`:
- **Sudah diset Admin:** String URL valid, contoh: `"https://drive.google.com/drive/folders/..."`
- **Belum diset Admin:** `null` atau `""` (string kosong).

---

## 3. Panduan Implementasi Sisi Mobile (Flutter)

### A. Update Data Model
**Lokasi File:** `lib/app/data/models/mahasiswa_kkn_models.dart`  
**Kelas:** `KelompokKknData`

Tambahkan field `linkGoogleDrive`:
```dart
class KelompokKknData extends Equatable {
  const KelompokKknData({
    required this.groupId,
    required this.groupName,
    required this.dosenPembimbing,
    this.dplNip = '-',
    this.dplPhone = '-',
    required this.poskoLocation,
    required this.totalGroupPoints,
    required this.members,
    this.linkGoogleDrive, // <-- TAMBAHKAN INI
  });

  final String groupId;
  final String groupName;
  final String dosenPembimbing;
  final String dplNip;
  final String dplPhone;
  final String poskoLocation;
  final int totalGroupPoints;
  final List<KelompokMemberData> members;
  final String? linkGoogleDrive; // <-- TAMBAHKAN INI

  // Update factory fromJson dengan fallback key
  factory KelompokKknData.fromJson(Map<String, dynamic> json) {
    ...
    final driveUrl = json['linkGoogleDrive']?.toString() ??
        json['urlGoogleDrive']?.toString() ??
        json['link_google_drive']?.toString();

    return KelompokKknData(
      groupId: json['groupId']?.toString() ?? json['id']?.toString() ?? '',
      groupName: json['groupName']?.toString() ?? json['namaKelompok']?.toString() ?? json['nama']?.toString() ?? '-',
      dosenPembimbing: dpl,
      dplNip: nip,
      dplPhone: phone,
      poskoLocation: json['poskoLocation']?.toString() ?? json['lokasiPosko']?.toString() ?? json['kelurahan']?.toString() ?? '-',
      totalGroupPoints: (json['totalGroupPoints'] as num?)?.toInt() ?? (json['totalPoints'] as num?)?.toInt() ?? 0,
      members: membersList,
      linkGoogleDrive: (driveUrl != null && driveUrl.trim().isNotEmpty) ? driveUrl.trim() : null, // <-- TAMBAHKAN INI
    );
  }

  @override
  List<Object?> get props => [
        groupId,
        groupName,
        totalGroupPoints,
        members,
        dosenPembimbing,
        dplNip,
        dplPhone,
        linkGoogleDrive, // <-- TAMBAHKAN KE PROPS
      ];
}
```

---

### B. Pembuatan Widget UI Google Drive
**Lokasi File:** `lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart`

Letakkan widget Card Google Drive di bawah Card Akumulasi Poin atau sebelum Card Posko:

```dart
Widget _buildGoogleDriveCard(BuildContext context, String? driveUrl) {
  final bool hasUrl = driveUrl != null && driveUrl.trim().isNotEmpty;

  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: hasUrl
            ? AppColors.primaryGreen.withValues(alpha: 0.25)
            : Colors.grey.shade200,
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 10,
          offset: const Offset(0, 3),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: hasUrl
                    ? const Color(0xFF4285F4).withValues(alpha: 0.12)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.folder_shared_rounded,
                color: hasUrl ? const Color(0xFF1A73E8) : Colors.grey.shade500,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'GOOGLE DRIVE KELOMPOK',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasUrl
                        ? 'Folder Portofolio & Laporan KKN'
                        : 'Belum ada link drive',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: hasUrl ? AppColors.textPrimary : Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Penyimpanan terpusat dokumen, foto kegiatan, & portofolio tim.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.black45,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: hasUrl
                ? () async {
                    final uri = Uri.parse(driveUrl);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tidak dapat membuka tautan Google Drive.')),
                      );
                    }
                  }
                : null,
            icon: const Icon(Icons.open_in_new_rounded, size: 16),
            label: Text(
              hasUrl ? 'Buka Google Drive' : 'Link Belum Disiapkan Admin',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A73E8),
              foregroundColor: Colors.white,
              disabledBackgroundColor: Colors.grey.shade200,
              disabledForegroundColor: Colors.grey.shade400,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}
```

---

## 4. Rincian Pekerjaan Backend (Untuk Koordinasi Sinkronisasi)

Tim backend sedang/akan melakukan perubahan berikut untuk mengaktifkan data ini:
1. **Prisma Schema:** Menambahkan `linkGoogleDrive String? @map("link_google_drive")` ke model `KelompokKkn`.
2. **Database Migration:** Mengeksekusi DDL `ALTER TABLE kelompok_kkn ADD COLUMN link_google_drive TEXT;`.
3. **Controller & Service:** Menerima input `linkGoogleDrive` di `POST /api/v1/kelompok` dan `PUT /api/v1/kelompok/:id`.
4. **Service KKN Mahasiswa:** Memasukkan field `linkGoogleDrive: group.linkGoogleDrive || null` pada return `kknService.getMyGroup`.

---

## 5. Checklist Validasi & Pengujian

- [ ] Model `KelompokKknData` berhasil mem-parse URL jika backend mengembalikan link.
- [ ] Model `KelompokKknData` tidak crash/error jika backend mengembalikan `null` atau `""`.
- [ ] Card di layar Kelompok KKN menampilkan status disabled / keterangan jika link belum tersedia.
- [ ] Tombol CTA membuka browser / Google Drive app saat link valid diklik (`LaunchMode.externalApplication`).
- [ ] Fitur pull-to-refresh di layar Kelompok KKN tetap bekerja memperbarui state drive link.
