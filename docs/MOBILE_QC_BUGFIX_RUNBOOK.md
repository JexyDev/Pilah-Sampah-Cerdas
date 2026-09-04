# 📱 Mobile App QC Bugfix Runbook & Implementation Guide

> **Document Version:** 1.0.0  
> **Target Audience:** Mobile Flutter Development Team & QA  
> **Source Audit:** [`Pilah_Sampah_Cerdas_QC_Bug_Audit.xlsx`](file:///c:/laragon/www/Pilah-Sampah-Cerdas/Pilah_Sampah_Cerdas_QC_Bug_Audit.xlsx)  
> **Status:** Backend APIs Ready & Deployed 🚀

This document outlines the exact Flutter code solutions, state management mappings, and UI adjustments required to address all 12 findings from the Mobile Quality Control (QC) audit.

---

## 📑 Summary Matrix of Required Fixes

| Finding ID | Role | Component | Severity / Priority | Target File / Area | Action Required |
|---|---|---|---|---|---|
| **BUG-001** | QC WARGA | Home -> Aksi Scan Sampah | P1 | `lib/app/modules/home/controllers/home_controller.dart` | Localize scan error handling (replace raw English `not found`). |
| **BUG-002** | QC WARGA | Scan -> Scan Sampah Screen | P1 | `lib/app/modules/scan/controllers/scan_controller.dart` | Map 404/validation errors to friendly Indonesian dialogs. |
| **BUG-006** | QC MAHASISWA | Home -> Edit Profile Mahasiswa | P1 | `lib/app/modules/profile/views/edit_profile_view.dart` | Wrap form in `SingleChildScrollView` to prevent RenderFlex overflow. |
| **BUG-007** | QC MAHASISWA | Home -> Point KKN | P1 | `lib/app/modules/mahasiswa/controllers/kkn_home_controller.dart` | Bind KKN contribution points from `/api/v1/kkn/dashboard`. |
| **BUG-004** | QC WARGA | Profile -> Data Rumah Tangga | P2 | `lib/app/modules/profile/views/data_keluarga_view.dart` | Ensure Kelurahan and RW fields read `user.kelurahan` & `user.rw`. |
| **BUG-010** | QC MAHASISWA | Profile -> Data Mahasiswa KKN | P2 | `lib/app/modules/mahasiswa/views/profile_kkn_view.dart` | Bind `programStudi` and `poskoKkn` / `wilayahKkn` from `/auth/me`. |
| **BUG-005** | QC WARGA | Profile -> Tentang Aplikasi | P2 | `lib/app/modules/settings/views/about_view.dart` | Replace Makerindo copyright with **UNIKOM**. |
| **BUG-012** | QC PETUGAS | Profile -> Tentang Aplikasi | P2 | `lib/app/modules/settings/views/about_view.dart` | Replace Makerindo copyright with **UNIKOM**. |
| **BUG-008** | QC MAHASISWA | Activity / Attendance Evidence | P2 | `lib/app/modules/mahasiswa/views/upload_bukti_view.dart` | Rename label from `"Resep dokter"` to `"Foto Bukti"`. |
| **BUG-003** | QC WARGA | Profile -> Photo Profil | P3 | `lib/app/modules/profile/widgets/avatar_picker_sheet.dart` | Add "Hapus Foto Profil" option calling `DELETE /api/v1/auth/avatar`. |
| **BUG-009** | QC MAHASISWA | Profile -> Photo Profil | P3 | `lib/app/modules/profile/widgets/avatar_picker_sheet.dart` | Add "Hapus Foto Profil" option. |
| **BUG-011** | QC PETUGAS | Profile -> Photo Profil | P3 | `lib/app/modules/profile/widgets/avatar_picker_sheet.dart` | Add "Hapus Foto Profil" option. |

---

## 🛠️ Detailed Implementation Guide

### 1. Fix Scan Error Handling & Localization (BUG-001 & BUG-002)

#### Problem:
When the camera scans an invalid QR code or the backend returns 404, the UI exposes raw exception text (`"not found"`).

#### Flutter Solution:
In your API repository or `ScanController`, implement centralized error parsing:

```dart
// lib/app/data/providers/api_error_handler.dart
String getReadableErrorMessage(dynamic error) {
  if (error is DioException) {
    final response = error.response;
    if (response != null) {
      final statusCode = response.statusCode;
      final data = response.data;
      
      if (data is Map && data.containsKey('message')) {
        return data['message'].toString();
      }

      if (statusCode == 404) {
        return "QR Code atau Tempat Sampah tidak terdaftar di sistem. Pastikan QR Code yang Anda scan benar.";
      } else if (statusCode == 400) {
        return "Data scan tidak valid atau posisi Anda terlalu jauh dari lokasi Tempat Sampah.";
      } else if (statusCode == 403) {
        return "Anda tidak memiliki hak akses untuk memindai Tempat Sampah ini.";
      } else if (statusCode == 500) {
        return "Terjadi gangguan pada server. Silakan coba beberapa saat lagi.";
      }
    }
    return "Koneksi internet bermasalah. Periksa jaringan Anda.";
  }
  return "Gagal memproses pemindaian. Silakan coba kembali.";
}
```

In `ScanController` / `HomeController`:
```dart
try {
  await scanRepository.processScan(qrCode);
  Get.toNamed(Routes.SCAN_SUCCESS);
} catch (e) {
  final message = getReadableErrorMessage(e);
  Get.dialog(
    CustomErrorDialog(
      title: "Pemindaian Gagal",
      message: message,
      onRetry: () => scanAgain(),
    ),
  );
}
```

---

### 2. Fix Mahasiswa Profile Edit Layout Overflow (BUG-006)

#### Problem:
When focusing an input on `EditProfileView`, the virtual keyboard triggers a yellow-black striped `RenderFlex overflowed by X pixels` overlay.

#### Flutter Solution:
Ensure the `Scaffold` enables `resizeToAvoidBottomInset: true` and wraps the body in a `SingleChildScrollView`:

```dart
// lib/app/modules/profile/views/edit_profile_view.dart
class EditProfileView extends GetView<EditProfileController> {
  const EditProfileView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: true, // IMPORTANT: Allows viewport to adjust for keyboard
      appBar: AppBar(
        title: const Text("Ubah Profil Mahasiswa"),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Form(
            key: controller.formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Avatar Preview
                Center(child: const ProfileAvatarWidget()),
                const SizedBox(height: 24),

                // Form Fields
                CustomTextField(
                  label: "Nama Lengkap",
                  controller: controller.nameController,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  label: "Nomor WhatsApp",
                  controller: controller.phoneController,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  label: "Alamat / Domisili",
                  controller: controller.addressController,
                  maxLines: 3,
                ),
                const SizedBox(height: 32),

                // Save Button
                Obx(() => CustomButton(
                  text: "Simpan Perubahan",
                  isLoading: controller.isLoading.value,
                  onPressed: controller.submitUpdate,
                )),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

### 3. Deploy & Bind Live Mahasiswa Point KKN (BUG-007)

#### Problem:
Mahasiswa Home screen displays placeholder / outdated data for Point KKN.

#### Backend Integration:
The backend endpoint `GET /api/v1/kkn/dashboard` and `GET /api/v1/auth/me` now return:
```json
{
  "success": true,
  "data": {
    "stats": {
      "contributionPoints": 250,
      "totalPoints": 250,
      "pointKkn": 250
    },
    "contributionPoints": 250,
    "pointKkn": 250,
    "programStudi": "Teknik Informatika",
    "poskoKkn": "Posko Sadang Serang"
  }
}
```

#### Flutter Binding:
```dart
// lib/app/modules/mahasiswa/controllers/kkn_home_controller.dart
final RxInt kknPoints = 0.obs;

Future<void> loadKknDashboard() async {
  try {
    isLoading.value = true;
    final data = await kknRepository.getDashboard();
    
    // Read with robust fallbacks
    kknPoints.value = (data['contributionPoints'] ?? 
                       data['stats']?['contributionPoints'] ?? 
                       data['pointKkn'] ?? 0) as int;
  } catch (e) {
    kknPoints.value = 0;
  } finally {
    isLoading.value = false;
  }
}
```

---

### 4. Data Completeness for Warga & Mahasiswa Profiles (BUG-004 & BUG-010)

#### Warga Profile Mapping (`BUG-004`):
```dart
// In ProfileView / DataRumahTanggaView
final kelurahan = user.kelurahan ?? user.kelurahanName ?? "Sadang Serang";
final rw = user.rw ?? user.rwName ?? "RW 03";

ProfileInfoRow(label: "Kelurahan", value: kelurahan);
ProfileInfoRow(label: "Rukun Warga (RW)", value: rw);
```

#### Mahasiswa Profile Mapping (`BUG-010`):
```dart
// In ProfileKknView
final prodi = user.programStudi ?? user.jurusan ?? "Teknik Informatika";
final posko = user.poskoKkn ?? user.poskoName ?? user.kelompokName ?? "Posko KKN Coblong";
final nim = user.nim ?? "-";

ProfileInfoRow(label: "NIM", value: nim);
ProfileInfoRow(label: "Program Studi", value: prodi);
ProfileInfoRow(label: "Wilayah / Posko", value: posko);
```

---

### 5. Update Branding & Copyright to UNIKOM (BUG-005 & BUG-012)

#### Target File:
`lib/app/modules/settings/views/about_view.dart` (or `TentangAplikasiPage`)

#### Changes:
Replace all instances of `PT Makerindo` with `Universitas Komputer Indonesia (UNIKOM)`:

```dart
// OLD:
// const copyright = "© 2026 PT Makerindo Prima Solusi. All rights reserved.";

// NEW:
const copyrightText = "© 2026 Universitas Komputer Indonesia (UNIKOM). All rights reserved.";
const appVersion = "Versi 1.0.0 (Build 2026.08)";
const institutionText = "Kuliah Kerja Nyata (KKN) Tematik — UNIKOM";

Widget build(BuildContext context) {
  return Column(
    children: [
      Image.asset('assets/images/logo_unikom.png', width: 80, height: 80),
      const SizedBox(height: 12),
      const Text("BERSEKA Mobile", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      const Text(institutionText, style: TextStyle(color: Colors.grey, fontSize: 13)),
      const SizedBox(height: 24),
      const Text(copyrightText, style: TextStyle(color: Colors.grey, fontSize: 12)),
    ],
  );
}
```

---

### 6. Replace "Resep Dokter" Evidence Upload Copy (BUG-008)

#### Target File:
`lib/app/modules/mahasiswa/views/upload_bukti_view.dart` or form upload dialogs.

#### Changes:
* Change title / label: `"Unggah Foto Bukti"` (was: `"Unggah resep dokter"`).
* Change description: `"Ambil foto atau pilih dari galeri sebagai bukti dokumentasi kegiatan KKN (Format JPG/PNG, Maks. 5MB)"`.

---

### 7. Profile Photo Deletion ("Hapus Foto Profil") (BUG-003, BUG-009, BUG-011)

#### Backend Endpoints Available:
* `DELETE /api/v1/auth/avatar`
* `DELETE /api/v1/auth/profile/photo`
* Or `PATCH /api/v1/auth/me` with payload `{"deleteFoto": true}`.

#### Flutter Avatar Action Sheet:
```dart
void showAvatarPickerSheet(BuildContext context, ProfileController controller) {
  final hasCustomAvatar = controller.user.value?.fotoProfil != null &&
                          controller.user.value!.fotoProfil!.isNotEmpty;

  Get.bottomSheet(
    Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Wrap(
        children: [
          ListTile(
            leading: const Icon(Icons.camera_alt, color: Colors.blue),
            title: const Text("Ambil Foto dari Kamera"),
            onTap: () {
              Get.back();
              controller.pickImage(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library, color: Colors.green),
            title: const Text("Pilih Foto dari Galeri"),
            onTap: () {
              Get.back();
              controller.pickImage(ImageSource.gallery);
            },
          ),
          if (hasCustomAvatar)
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text("Hapus Foto Profil", style: TextStyle(color: Colors.red)),
              onTap: () {
                Get.back();
                _confirmDeleteAvatar(context, controller);
              },
            ),
        ],
      ),
    ),
  );
}

void _confirmDeleteAvatar(BuildContext context, ProfileController controller) {
  Get.dialog(
    AlertDialog(
      title: const Text("Hapus Foto Profil"),
      content: const Text("Apakah Anda yakin ingin menghapus foto profil dan kembali ke avatar default?"),
      actions: [
        TextButton(onPressed: () => Get.back(), child: const Text("Batal")),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () async {
            Get.back();
            await controller.deleteAvatar();
          },
          child: const Text("Hapus", style: TextStyle(color: Colors.white)),
        ),
      ],
    ),
  );
}
```

In `ProfileController`:
```dart
Future<void> deleteAvatar() async {
  try {
    isLoading.value = true;
    final response = await authRepository.deleteAvatar();
    if (response['success'] == true) {
      user.update((val) {
        if (val != null) val.fotoProfil = null;
      });
      Get.snackbar("Sukses", "Foto profil berhasil dihapus", backgroundColor: Colors.green, colorText: Colors.white);
    }
  } catch (e) {
    Get.snackbar("Gagal", "Gagal menghapus foto profil", backgroundColor: Colors.red, colorText: Colors.white);
  } finally {
    isLoading.value = false;
  }
}
```

---

## 🎯 Verification & QA Sign-Off Matrix

When the mobile build is compiled, verify the following checklist:

- [ ] **Scan Invalid QR Test:** Trigger scan error -> Verified polite Indonesian message displays without `"not found"`.
- [ ] **Edit Profile Keyboard Test:** Open keyboard on small screen -> No yellow/black striped overflow error.
- [ ] **Point KKN Display Test:** Mahasiswa home displays correct live contribution points.
- [ ] **Data Completeness Test:** Warga shows Kelurahan & RW; Mahasiswa shows Program Studi & Posko KKN.
- [ ] **Branding Check:** "Tentang Aplikasi" reads **© 2026 UNIKOM**.
- [ ] **Upload Copy Check:** Evidence picker is titled **"Foto Bukti"**.
- [ ] **Photo Deletion Test:** Tap avatar -> "Hapus Foto Profil" -> resets avatar to default placeholder.
