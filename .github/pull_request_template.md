## 📝 Deskripsi Perubahan (Mobile)
Jelaskan perubahan pada aplikasi Flutter BERSEKA ini:
* **Fitur / Bug yang diselesaikan:**
* **Pendekatan teknis:**
* **Issue / Tiket terkait:**

---

## 📌 Jenis Perubahan
- [ ] `feat`: Fitur mobile baru
- [ ] `fix`: Perbaikan bug UI / Logic / State
- [ ] `docs`: Pembaruan dokumentasi / AGENTS.md
- [ ] `refactor`: Restrukturisasi kode tanpa ubah fungsi
- [ ] `perf`: Optimasi rendering, memori, atau networking
- [ ] `test`: Penambahan unit test / widget test
- [ ] `chore`: Update pub packages, Gradle, atau CI/CD pipeline

---

## 🚀 Alur Rilis & Target Testing
- [ ] **Staging Test:** APK diuji dengan API `https://staging.berseka.id` (Artifact: `berseka-staging-arm64-v8a.apk`)
- [ ] **Production Release:** Target API `https://berseka.id` (Artifact: `berseka-release-arm64-v8a.apk`)

---

## ✅ Checklist Standar ISO & Quality Control Mobile
Wajib dipenuhi sebelum mengajukan review:
- [ ] **Static Analysis Clean:** `flutter analyze --no-fatal-warnings` lolos tanpa error (0 issues).
- [ ] **Unit Tests:** `flutter test` lulus semua.
- [ ] **Konfigurasi API Dinamis:** Menggunakan `AppConfig.apiBaseUrl` (tidak hardcode URL API).
- [ ] **Standar Terminologi:** Bebas dari kata 'tong' / 'tong sampah', wajib gunakan 'Tempat Sampah'.
- [ ] **Standar Identitas:** Tidak menggunakan NIK. Menggunakan No. Telepon (+62).
- [ ] **Anti-Dummy Policy:** Tidak ada hardcoded mock data di view tanpa label indikator yang jelas.
- [ ] **Penyimpanan Aman:** Token JWT disimpan aman via `SafeStorage`.
- [ ] **Keamanan:** Tidak ada keystore password atau private key yang ter-commit.

---

## 📱 Cuplikan Layar / Demo (Wajib untuk perubahan UI)
Tempel screenshot tampilan UI atau GIF rekaman layar di sini.
