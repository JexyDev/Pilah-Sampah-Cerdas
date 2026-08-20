# 📋 Dokumentasi Field Registrasi & Relasi Tabel Database TrashCare

Dokumen ini menunjukkan **secara detail** semua field yang dikumpulkan saat pendaftaran pengguna, tipe data, validasi, dan relasi tabel di database PostgreSQL untuk memastikan **integritas data dan konsistensi skema**.

---

## 🔑 1. Tabel User (Pengguna) - Field Registrasi Utama

| No | Field | Nama DB | Tipe Data | Wajib? | Unique? | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **id** | `id` | UUID | ✅ | ✅ | Primary Key, auto-generated |
| 2 | **name** | `nama` | String | ✅ | ❌ | Nama lengkap pengguna |
| 3 | **phone** | `no_telepon` | String | ✅ | ✅ | Nomor HP unik (identitas login) |
| 4 | **password** | `kata_sandi` | String (Hashed) | ✅ | ❌ | Password terenkripsi bcrypt |
| 5 | **roleId** | `id_peran` | Integer | ✅ | ❌ | Foreign Key → `peran.id` |
| 6 | **rwId** | `id_rw` | Integer | ⚠️ | ❌ | Foreign Key → `rw.id` (Optional) |
| 7 | **rtId** | `id_rt` | Integer | ⚠️ | ❌ | Foreign Key → `rt.id` (Optional) |
| 8 | **address** | `alamat` | String | ⚠️ | ❌ | Alamat tempat tinggal |
| 9 | **fotoProfil** | `foto_profil` | String (URL/Path) | ⚠️ | ❌ | URL/Path foto avatar |
| 10 | **status** | `status` | String | ✅ | ❌ | Default: `"Aktif"` |
| 11 | **fcmToken** | `token_fcm` | String | ⚠️ | ❌ | Firebase Cloud Messaging token |
| 12 | **wargaSubtype** | `subtipe_warga` | String | ⚠️ | ❌ | Sub-kategori warga (misal: Pemilik Sampah) |
| 13 | **mustChangePassword** | `harus_ganti_password` | Boolean | ✅ | ❌ | Default: `false` |
| 14 | **createdAt** | `dibuat_pada` | DateTime | ✅ | ❌ | Auto-generated on insert |
| 15 | **updatedAt** | `diperbarui_pada` | DateTime | ✅ | ❌ | Auto-updated on edit |

**Field Unik (Unique Constraint)**:
- ✅ `phone` (nomor telepon tidak boleh duplikat)
- ✅ `id` (UUID primary key)

---

## 🌍 2. Hierarki Wilayah & Relasi Foreign Key

### **Struktur Hierarki Geografis**

```
Provinsi (Province)
  ├─ Kabupaten (Regency)
  │   ├─ Kecamatan (District)
  │   │   ├─ Kelurahan (Sub-district)
  │   │   │   ├─ Rw (Rukun Warga)
  │   │   │   │   ├─ Rt (Rukun Tetangga)
  │   │   │   │   └─ Users
  │   │   │   └─ Users
```

### **Tabel Referensi (Foreign Keys)**

| Tabel Referensi | Field DB | Deskripsi | Relasi ke |
| :--- | :--- | :--- | :--- |
| **Role** (`peran`) | `id_peran` | Identitas peran pengguna | `peran.id` |
| **Provinsi** (`provinsi`) | N/A | Data provinsi (reference only) | Parent of Kabupaten |
| **Kabupaten** (`kabupaten`) | `id_provinsi` | Kabupaten/Kota | `provinsi.id` |
| **Kecamatan** (`kecamatan`) | `id_kabupaten` | Kecamatan/District | `kabupaten.id` |
| **Kelurahan** (`kelurahan`) | `id_kecamatan` | Kelurahan/Sub-district | `kecamatan.id` |
| **Rw** (`rw`) | `id_kelurahan` | Rukun Warga | `kelurahan.id` |
| **Rt** (`rt`) | `id_rw` | Rukun Tetangga | `rw.id` |

---

## 👥 3. Role & Subtipe Pengguna

### **Daftar Role yang Valid**

| Role ID | Role Name | Deskripsi |
| :--- | :--- | :--- |
| 1 | `SUPER_USER` | Administrator tertinggi (Pilot) |
| 2 | `ADMIN_DLH` | Admin Dinas Lingkungan Hidup |
| 3 | `CAMAT` | Camat (Kepala Kecamatan) |
| 4 | `LURAH` | Lurah (Kepala Kelurahan) |
| 5 | `RW` | Ketua Rukun Warga |
| 6 | `RT` | Ketua Rukun Tetangga |
| 7 | `WARGA` | Warga Sipil (Pelapor Sampah) |
| 8 | `PETUGAS_RESIDU` | Petugas Pengangkutan Sampah |
| 9 | `MAHASISWA_KKN` | Mahasiswa Program KKN |
| 10 | `PEMIMPIN` | Pemimpin KKN |
| 11 | `PANITIA_TASKFORCE` | Panitia Tim Khusus |
| 12 | `DPL` | Dosen Pendamping Lapangan |

### **Validasi Mandatory Field per Role**

| Role | `rwId` Wajib? | `rtId` Wajib? | `address` Wajib? | `wargaSubtype` |
| :--- | :--- | :--- | :--- | :--- |
| SUPER_USER | ❌ | ❌ | ❌ | N/A |
| ADMIN_DLH | ⚠️ | ❌ | ⚠️ | N/A |
| CAMAT | ✅ | ❌ | ✅ | N/A |
| LURAH | ✅ | ❌ | ✅ | N/A |
| RW | ✅ | ❌ | ✅ | N/A |
| RT | ✅ | ✅ | ✅ | N/A |
| WARGA | ✅ | ⚠️ | ✅ | Optional |
| PETUGAS_RESIDU | ✅ | ❌ | ✅ | N/A |
| MAHASISWA_KKN | ✅ | ⚠️ | ✅ | N/A |

---

## 📱 4. Field Validasi Input (Frontend & Backend)

### **Validasi Phone Number**

```json
{
  "field": "phone",
  "format": "62XXXXXXXXXX atau 08XXXXXXXXXX",
  "regex": "^(62|0)8[0-9]{8,11}$",
  "length": 10-13 digits,
  "unique": true,
  "example": "08111111111 atau 6281111111111"
}
```

### **Validasi Password**

```json
{
  "field": "password",
  "minLength": 8,
  "requirements": [
    "Minimal 8 karakter",
    "Minimal 1 huruf besar (A-Z)",
    "Minimal 1 huruf kecil (a-z)",
    "Minimal 1 angka (0-9)"
  ],
  "example": "password123"
}
```

---

## 🔗 5. Entity Relationship Diagram (ERD) Summary

```
User (pengguna)
├─ role_id → Role (peran)
├─ rw_id → Rw (rw)
├─ rt_id → Rt (rt)
├─ One-to-One: PetugasResidu (petugasProfile)
├─ One-to-Many: AiRequestLog (aiRequestLogs)
├─ One-to-Many: Notification (notifications)
├─ One-to-Many: Household (households)
└─ One-to-Many: StudentKkn (studentProfile)

Rw (rw)
├─ id_kelurahan → Kelurahan (kelurahan)
├─ One-to-Many: Rt (rts)
├─ One-to-Many: User (users)
├─ One-to-Many: Bin (bins)
└─ One-to-Many: Facility (facilities)

Rt (rt)
├─ id_rw → Rw (rw)
└─ One-to-Many: User (users)

Role (peran)
├─ One-to-Many: User (users)
└─ One-to-Many: Permission (permissions)
```

---

## ✅ 6. Checklist Verifikasi Integritas Data

Sebelum pengguna didaftarkan, sistem harus memvalidasi:

| Validasi | Kondisi | Error Message |
| :--- | :--- | :--- |
| **Phone Unique** | Tidak boleh ada nomor yang sama | `"Nomor telepon sudah terdaftar"` |
| **Phone Format** | Harus `08xxxxxxxxx` atau `62xxxxxxxxx` | `"Format nomor HP tidak valid"` |
| **Password Strength** | Min 8 char, 1 uppercase, 1 lowercase, 1 digit | `"Password terlalu lemah"` |
| **Role Valid** | roleId harus ada di tabel Role | `"Role tidak valid"` |
| **Rw Exists (if required)** | rwId harus ada di tabel Rw untuk role tertentu | `"Wilayah RW tidak ditemukan"` |
| **Rt Exists (if required)** | rtId harus ada di tabel Rt untuk role tertentu | `"Wilayah RT tidak ditemukan"` |

---

**Dokumen ini berlaku untuk versi TrashCare Production dan harus diperbarui jika ada perubahan schema database.**
