# 📱 PANDUAN TEKNIS & SPESIFIKASI INTEGRASI SERVER-SIDE PAGINATION LOGBOOK MAHASISWA (MOBILE DEVELOPER)
## Modul KKN Tematik — Platform Cerdas Berseka
**Target Konsumen:** Tim Flutter Mobile Developer (Android & iOS)  
**Endpoint Target:** `GET /api/v1/logbook/mahasiswa`  
**Status Kompatibilitas:** ✅ **100% Backward-Compatible (Non-Breaking Change)**  
**Versi Dokumen:** 1.0.0 (Oktober 2026)  

---

## 1. Executive Summary & Status Kompatibilitas Saat Ini

Seiring dengan peningkatan volume logbook KKN di lapangan (melampaui 9.162+ data), backend Berseka telah mengimplementasikan **Server-Side Pagination & Agregasi Terindeks**.

### 🔒 Jaminan Kompatibilitas Versi Mobile Lama (Installed APK / App Store)
Aplikasi mobile mahasiswa yang saat ini sudah terpasang di HP pengguna **TIDAK AKAN MENGALAMI ERROR / CRASH** dan **TIDAK PERLU HOTFIX MENDESAK**.

Hal ini dijamin karena kontrak response backend tetap mempertahankan struktur:
```json
{
  "success": true,
  "total": 24,
  "data": [ /* Array/List objek logbook mahasiswa */ ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 24,
    "totalPages": 1
  }
}
```
Pemeriksaan kode di repository Flutter (`lib/app/data/repositories/api_kkn_repository.dart`):
```dart
final raw = response.data['data'];
if (raw is List) return List<Map<String, dynamic>>.from(raw);
```
Akan tetap mengevaluasi `raw is List` bernilai **`true`**, dan ketika parameter `page` serta `limit` tidak dikirimkan oleh mobile, backend secara cerdas mengembalikan seluruh riwayat logbook milik mahasiswa yang sedang login (rata-rata 20–40 entri per mahasiswa).

---

## 2. Kebutuhan & Rekomendasi Pengembangan Versi Mobile Berikutnya

Meskipun versi lama tetap berjalan, untuk pembaruan (*next release*) aplikasi mobile, **Tim Mobile Developer sangat disarankan mengimplementasikan Infinite Scroll / Paginasi Bertahap** pada layar Riwayat Logbook Mahasiswa (`DataLogbookHarianView` / `RiwayatKknController`).

### Keuntungan bagi Mahasiswa:
1. **Pemuatan Instan (<100 ms)**: Pengguna hanya perlu mengunduh 10–20 logbook pertama saat membuka halaman.
2. **Hemat Memori Smartphone**: Mengurangi alokasi RAM objek JSON dan gambar dokumentasi di perangkat Android kelas entri (*low-end devices*).
3. **Penghematan Kuota Data**: Tidak mengunduh data lama yang belum tentu dilihat mahasiswa.

---

## 3. Spesifikasi Teknis Endpoint API

### `GET /api/v1/logbook/mahasiswa`
* **Autentikasi**: Wajib Bearer Token JWT (`Authorization: Bearer <accessToken>`).
* **Header**: `Accept: application/json`.

#### Query Parameters:
| Parameter | Tipe | Wajib? | Default | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `page` | `int` | Opsional | `1` | Nomor halaman (1-based index). |
| `limit` | `int` | Opsional | `10` / `20` | Jumlah data per halaman. Disarankan `15` atau `20` untuk tampilan mobile. |
| `pekanKe` | `int` | Opsional | - | Filter nomor pekan KKN (1, 2, 3, atau 4). |
| `statusApproval` | `string` | Opsional | - | Filter status: `MENUNGGU_PERSETUJUAN_KETUA`, `MENUNGGU_VERIFIKASI_DPL`, `DISETUJUI_DPL`, `PERLU_REVISI_DPL`, `DITOLAK_KETUA`. |
| `tipeAktivitas` | `string` | Opsional | - | `INDIVIDU` atau `KELOMPOK`. |
| `kategori` | `string` | Opsional | - | `Pemilahan`, `Pengangkutan`, `Pengolahan`, `Pemanfaatan`, `Sosialisasi`, `Pendataan`. |
| `search` | `string` | Opsional | - | Kata kunci pencarian judul/tempat/deskripsi. |

#### Format Respons Berhasil (`HTTP 200 OK`):
```json
{
  "success": true,
  "total": 35,
  "data": [
    {
      "nomor": 1,
      "id": "e4b2d35c-7d91-4560-b98e-4a6c221100aa",
      "kelompokId": "f1c01e3b-9a88-4db7-a411-d1421e428bc1",
      "kelompokNama": "Kelompok 1 Dago",
      "kelurahan": "Dago",
      "penulisId": "c01824a7-8973-45ab-85fa-7fbe8b55611c",
      "penulisNama": "Ahmad Fauzi",
      "penulisNim": "10122001",
      "isKetua": false,
      "tanggalKegiatan": "2026-08-20",
      "waktuMulai": "08:00",
      "waktuSelesai": "11:30",
      "waktuLengkap": "08:00 - 11:30",
      "tempat": "Posko KKN RW 05",
      "deskripsi": "Sosialisasi pemilahan sampah organik rumah tangga dan demonstrasi pembuatan komposter.",
      "fotoBuktiUrl": "https://berseka.id/uploads/logbook-1.jpg",
      "attachmentUrls": [
        "https://berseka.id/uploads/logbook-1.jpg",
        "https://berseka.id/uploads/logbook-2.jpg"
      ],
      "platformOs": "ANDROID",
      "tipeAktivitas": "KELOMPOK",
      "pekanKe": 2,
      "statusApproval": "DISETUJUI_DPL",
      "catatanKetua": "Bagus, lanjutkan.",
      "catatanDpl": "Dokumentasi sangat lengkap dan representatif.",
      "disetujuiKetuaOleh": "Budi Santoso",
      "diverifikasiDplOleh": "Dr. Ir. Hendra Gunawan, M.T.",
      "createdAt": "2026-08-20T05:30:00.000Z",
      "updatedAt": "2026-08-20T08:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2
  }
}
```

---

## 4. Rekomendasi Kode Implementasi di Flutter (GetX / Dio)

### A. Model DTO Paginasi Baru (`lib/app/data/models/logbook_pagination_model.dart`)
```dart
class LogbookPaginationMetadata {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  LogbookPaginationMetadata({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory LogbookPaginationMetadata.fromJson(Map<String, dynamic> json) {
    return LogbookPaginationMetadata(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
    );
  }
}

class PaginatedLogbookResponse {
  final bool success;
  final int total;
  final List<Map<String, dynamic>> items;
  final LogbookPaginationMetadata? pagination;

  PaginatedLogbookResponse({
    required this.success,
    required this.total,
    required this.items,
    this.pagination,
  });

  factory PaginatedLogbookResponse.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];
    final itemsList = rawData is List
        ? List<Map<String, dynamic>>.from(rawData)
        : <Map<String, dynamic>>[];

    return PaginatedLogbookResponse(
      success: json['success'] ?? false,
      total: json['total'] ?? itemsList.length,
      items: itemsList,
      pagination: json['pagination'] != null
          ? LogbookPaginationMetadata.fromJson(json['pagination'])
          : null,
    );
  }
}
```

---

### B. Pembaruan Repository (`lib/app/data/repositories/api_kkn_repository.dart`)
Tambahkan method pendukung paginasi tanpa merusak method lama:
```dart
  /// Mengambil daftar logbook terpaginasi (Mendukung Infinite Scroll)
  Future<PaginatedLogbookResponse> getPaginatedLogbooks({
    int page = 1,
    int limit = 15,
    String? statusApproval,
    String? search,
  }) async {
    try {
      final response = await apiClient.dio.get(
        ApiEndpoints.logbookMahasiswa,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (statusApproval != null && statusApproval.isNotEmpty)
            'statusApproval': statusApproval,
          if (search != null && search.trim().isNotEmpty)
            'search': search.trim(),
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        return PaginatedLogbookResponse.fromJson(response.data);
      }
      return PaginatedLogbookResponse(success: false, total: 0, items: []);
    } on DioException catch (e) {
      debugPrint('[KKN] getPaginatedLogbooks error: $e');
      throw Exception(_extractError(e.response?.data, 'Gagal memuat logbook'));
    }
  }
```

---

### C. Pola Controller Infinite Scroll (`riwayat_kkn_controller.dart`)
```dart
class RiwayatLogbookController extends GetxController {
  final KknRepository _repo = Get.find<KknRepository>();

  final RxList<Map<String, dynamic>> logbooks = <Map<String, dynamic>>[].obs;
  final RxBool isLoading = false.obs;
  final RxBool isLoadingMore = false.obs;
  final RxBool hasMore = true.obs;

  int _currentPage = 1;
  final int _pageSize = 15;
  final ScrollController scrollController = ScrollController();

  @override
  void onInit() {
    super.onInit();
    fetchInitialLogbooks();
    scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (scrollController.position.pixels >=
            scrollController.position.maxScrollExtent - 200 &&
        !isLoading.value &&
        !isLoadingMore.value &&
        hasMore.value) {
      loadMoreLogbooks();
    }
  }

  Future<void> fetchInitialLogbooks() async {
    isLoading.value = true;
    _currentPage = 1;
    hasMore.value = true;
    try {
      final res = await _repo.getPaginatedLogbooks(
        page: _currentPage,
        limit: _pageSize,
      );
      logbooks.assignAll(res.items);
      if (res.items.length < _pageSize ||
          (_currentPage >= (res.pagination?.totalPages ?? 1))) {
        hasMore.value = false;
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> loadMoreLogbooks() async {
    isLoadingMore.value = true;
    try {
      final nextPage = _currentPage + 1;
      final res = await _repo.getPaginatedLogbooks(
        page: nextPage,
        limit: _pageSize,
      );
      if (res.items.isNotEmpty) {
        _currentPage = nextPage;
        logbooks.addAll(res.items);
      }
      if (res.items.length < _pageSize ||
          (_currentPage >= (res.pagination?.totalPages ?? 1))) {
        hasMore.value = false;
      }
    } catch (e) {
      debugPrint('[Logbook] Error load more: $e');
    } finally {
      isLoadingMore.value = false;
    }
  }

  @override
  void onClose() {
    scrollController.dispose();
    super.onClose();
  }
}
```

---

## 5. Ringkasan Tindakan untuk Tim Mobile

1. **Status Darurat:** 🟢 **Tidak Ada (Zero Emergency)**. Mahasiswa di lapangan dapat terus menggunakan aplikasi mobile versi aktif tanpa hambatan.
2. **Sprint Selanjutnya:**
   - Tambahkan `getPaginatedLogbooks` pada `KknRepository`.
   - Pasang `ScrollController` listener untuk mengaktifkan *Infinite Scroll* pada daftar riwayat aktivitas.
   - Selesai! Tidak ada breaking change pada payload body submit logbook atau upload bukti foto.
