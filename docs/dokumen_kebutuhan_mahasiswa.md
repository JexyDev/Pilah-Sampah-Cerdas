# **DOKUMEN KEBUTUHAN PENGEMBANGAN APLIKASI MOBILE MAHASISWA KKN**

## **1. Pendahuluan**

Pengembangan aplikasi mobile untuk Modul Mahasiswa KKN bertujuan untuk
mendukung aktivitas mahasiswa dalam melakukan pendampingan kepada
masyarakat, khususnya dalam kegiatan pemilahan dan pengelolaan sampah.

Pada sistem ini, mahasiswa KKN berperan sebagai pendamping warga yang
bertugas membantu proses registrasi warga yang mengalami keterbatasan
dalam penggunaan teknologi, memantau aktivitas pemilahan sampah warga
yang telah didampingi, serta mengirimkan data lokasi mahasiswa secara
berkala sebagai pengganti mekanisme absensi manual.

Berdasarkan requirement terbaru dari backend, terdapat perubahan pada
alur sistem. Fitur yang sebelumnya menggunakan mekanisme pemindaian QR
Code untuk melakukan klaim atau aktivasi Tempat Sampah dihapus dan tidak
lagi digunakan.

Fokus utama aplikasi mobile Mahasiswa KKN adalah:

1.  Authentication dan manajemen akun mahasiswa.

2.  Background Location untuk validasi kehadiran mahasiswa.

3.  Registrasi warga yang membutuhkan bantuan penggunaan aplikasi.

4.  Binding otomatis antara mahasiswa dengan warga yang didampinginya.

5.  Dashboard monitoring warga dampingan.

6.  Monitoring riwayat pemilahan dan pelanggaran warga.

7.  Penyajian informasi warga yang membutuhkan edukasi ulang.

# **2. Tujuan Pengembangan**

Pengembangan aplikasi ini memiliki beberapa tujuan utama, yaitu:

8.  Memungkinkan mahasiswa KKN melakukan login menggunakan kredensial
    yang telah tersedia.

9.  Menyimpan dan mengelola token JWT secara aman pada perangkat mobile.

10. Mengirimkan lokasi mahasiswa secara berkala kepada backend tanpa
    membutuhkan tombol absensi manual.

11. Membantu mahasiswa mendaftarkan warga yang tidak mampu atau
    kesulitan menggunakan aplikasi secara mandiri.

12. Menghubungkan warga yang didaftarkan dengan mahasiswa yang melakukan
    pendampingan secara otomatis melalui mekanisme binding pada backend.

13. Menyediakan dashboard monitoring warga dampingan.

14. Menampilkan riwayat aktivitas pemilahan sampah dan pelanggaran
    warga.

15. Membantu mahasiswa mengetahui warga yang membutuhkan edukasi ulang
    berdasarkan performa pemilahan sampah.

16. Mengurangi proses manual dalam pencatatan kehadiran dan monitoring
    warga.

17. Menyediakan sistem mobile yang terintegrasi secara langsung dengan
    API backend.

# **3. Peran Mahasiswa KKN dalam Sistem**

Pada sistem yang baru, mahasiswa KKN memiliki peran sebagai **pendamping
warga**.

Mahasiswa tidak lagi bertugas untuk melakukan klaim atau aktivasi tong
sampah menggunakan QR Code.

Peran utama mahasiswa adalah:

-   Melakukan login ke aplikasi.

-   Mengirimkan lokasi secara berkala melalui background location.

-   Membantu melakukan registrasi warga yang mengalami kesulitan dalam
    menggunakan teknologi.

-   Menjadi pihak yang secara otomatis terhubung dengan warga yang
    didaftarkan melalui mekanisme binding.

-   Memantau performa pemilahan sampah warga dampingan.

-   Melihat riwayat aktivitas dan pelanggaran warga.

-   Melakukan edukasi ulang kepada warga apabila ditemukan pola
    kesalahan pemilahan yang tinggi.

Secara umum, alur hubungan mahasiswa dan warga adalah sebagai berikut:

Mahasiswa KKN

│

│ Login

▼

Aplikasi Mobile

│

├──────────────────────┐

│ │

▼ ▼

Background Location Registrasi Warga

│ │

▼ ▼

Location Ping API Binding Otomatis

│

▼

Warga Dampingan

│

▼

Dashboard Monitoring

│

▼

Riwayat Pemilahan

│

▼

Analisis Kinerja

│

┌───────────┴───────────┐

│ │

▼ ▼

Performa Baik Sering Salah Pilah

│ │

▼ ▼

Monitoring Edukasi Ulang

# **4. Ruang Lingkup Pengembangan Flutter**

Ruang lingkup pengembangan aplikasi Flutter untuk Modul Mahasiswa KKN
terdiri dari beberapa modul utama.

## **4.1. Modul Authentication**

Modul Authentication digunakan untuk mengelola proses login mahasiswa
dan autentikasi terhadap seluruh API backend.

Fitur yang dibutuhkan:

-   Login mahasiswa.

-   Penyimpanan JWT Token.

-   Penggunaan JWT Token pada setiap request API.

-   Auto Login apabila token masih valid.

-   Logout.

-   Penanganan token kadaluarsa.

-   Penanganan error autentikasi.

## **4.2. Modul Background Location**

Modul Background Location digunakan untuk mengirimkan lokasi mahasiswa
secara berkala ke backend.

Tidak terdapat tombol:

-   Absen Masuk.

-   Absen Pulang.

Sebagai gantinya, aplikasi akan mengambil lokasi mahasiswa secara
berkala dan mengirimkannya ke backend.

Backend bertanggung jawab untuk:

-   Menghitung apakah mahasiswa berada di dalam zona yang ditentukan.

-   Menghitung durasi jam kerja aktif presensi mahasiswa di zona penugasan.

-   Melakukan validasi kehadiran.

-   Menghitung jam kerja mahasiswa.

-   Menentukan validitas kehadiran mahasiswa.

Flutter hanya bertanggung jawab untuk:

-   Mengambil koordinat GPS.

-   Menjalankan proses background location.

-   Mengirim latitude dan longitude ke API.

-   Menangani kondisi GPS tidak tersedia.

-   Menangani permission lokasi.

-   Menangani koneksi internet.

-   Melakukan retry atau penyimpanan sementara apabila diperlukan.

## **4.3. Modul Registrasi Warga**

Modul ini digunakan untuk membantu warga yang mengalami kesulitan
menggunakan teknologi atau tidak memiliki kemampuan untuk melakukan
proses registrasi secara mandiri.

Mahasiswa dapat mengisi formulir data warga melalui aplikasi.

Setelah data berhasil dikirim ke backend, backend akan secara otomatis
melakukan binding antara:

Mahasiswa KKN

│

▼

Warga yang Didaftarkan

Binding tersebut menunjukkan bahwa warga tersebut merupakan warga
dampingan dari mahasiswa yang melakukan registrasi.

Mahasiswa tidak perlu mengirimkan ID mahasiswa secara manual apabila
backend sudah dapat mengambil identitas mahasiswa dari JWT Token.

## **4.4. Modul Dashboard Monitoring**

Modul ini digunakan untuk menampilkan daftar warga yang telah
didaftarkan atau didampingi oleh mahasiswa.

Dashboard dapat menampilkan:

-   Jumlah warga dampingan.

-   Jumlah aktivitas pemilahan.

-   Jumlah pemilahan benar.

-   Jumlah pemilahan salah.

-   Jumlah pelanggaran.

-   Persentase kepatuhan.

-   Riwayat aktivitas.

-   Grafik performa pemilahan.

-   Indikator warga yang membutuhkan edukasi ulang.

# **5. Authentication dan JWT**

## **5.1. Proses Login**

Mahasiswa melakukan login menggunakan kredensial yang telah tersedia.

Alur login:

Mahasiswa

│

▼

Login Screen

│

▼

Input Email/Username

Input Password

│

▼

POST Login API

│

▼

Backend

│

▼

Validasi Kredensial

│

├── Gagal → Error Login

│

└── Berhasil

│

▼

JWT Token

│

▼

Secure Storage

│

▼

Dashboard

## **5.2. Penyimpanan JWT**

JWT Token harus disimpan menggunakan penyimpanan yang aman.

Package Flutter yang dapat digunakan:

flutter_secure_storage

Token tidak disarankan disimpan secara langsung menggunakan penyimpanan
biasa seperti SharedPreferences apabila token tersebut digunakan sebagai
kredensial autentikasi utama.

Data yang dapat disimpan:

-   JWT Token.

-   User ID.

-   Nama pengguna.

-   Role pengguna.

Contoh data:

Token : JWT_TOKEN

User ID : 123

Nama : Nama Mahasiswa

Role : Mahasiswa

## **5.3. Authorization Header**

Semua request API yang membutuhkan autentikasi wajib menggunakan header:

Authorization: Bearer \<token\>

Contoh:

Authorization: Bearer eyJhbGciOiJIUzI1NiIs\...

Implementasi dapat dilakukan menggunakan Dio Interceptor sehingga JWT
otomatis ditambahkan pada setiap request.

## **5.4. Penanganan Token Expired**

Apabila backend memberikan response:

401 Unauthorized

maka aplikasi harus menganggap token sudah tidak valid atau kadaluarsa.

Flow:

API Request

│

▼

401 Unauthorized

│

▼

Token Tidak Valid

│

▼

Hapus Token

│

▼

Logout

│

▼

Login Screen

# **6. Background Location**

## **6.1. Tujuan**

Background Location digunakan sebagai mekanisme pengganti absensi
manual.

Mahasiswa tidak perlu menekan tombol:

Absen Masuk

Absen Pulang

Sistem akan mengirimkan koordinat lokasi mahasiswa secara berkala.

## **6.2. Alur Background Location**

Mahasiswa Login

│

▼

Aplikasi Meminta Permission Lokasi

│

▼

Permission Diberikan

│

▼

Background Location Service Aktif

│

▼

Ambil Koordinat GPS

│

▼

Kirim Location Ping

│

▼

POST /api/kkn/location-ping

│

▼

Backend

│

├── Validasi Zona

├── Perhitungan Durasi

└── Validasi Kehadiran

## **6.3. Endpoint Location Ping**

Endpoint:

POST /api/kkn/location-ping

Request Body:

{

\"latitude\": -6.892,

\"longitude\": 107.611

}

Header:

Authorization: Bearer \<JWT_TOKEN\>

Content-Type: application/json

## **6.4. Tanggung Jawab Flutter**

Flutter bertanggung jawab untuk:

1.  Meminta izin akses lokasi.

2.  Memastikan GPS aktif.

3.  Mengambil latitude.

4.  Mengambil longitude.

5.  Menjalankan proses background service.

6.  Mengirim lokasi secara berkala.

7.  Menambahkan JWT pada request.

8.  Menangani error jaringan.

9.  Menangani kondisi GPS tidak aktif.

10. Menangani kondisi permission ditolak.

## **6.5. Interval Location Ping**

Interval pengiriman lokasi dapat dilakukan setiap:

5--10 menit

Contoh:

08:00 → Kirim GPS

08:05 → Kirim GPS

08:10 → Kirim GPS

08:15 → Kirim GPS

Namun, interval final harus mengikuti keputusan backend.

Penggunaan Timer biasa seperti:

Timer.periodic()

tidak cukup untuk menjamin proses tetap berjalan ketika aplikasi berada
di background atau dihentikan oleh sistem operasi.

Untuk kebutuhan production, diperlukan mekanisme background execution
atau foreground service yang sesuai dengan aturan Android.

## **6.6. Permission Android**

Aplikasi membutuhkan permission lokasi, seperti:

ACCESS_FINE_LOCATION

ACCESS_COARSE_LOCATION

Apabila aplikasi wajib mengirim lokasi ketika berada di background, maka
diperlukan konfigurasi background location sesuai dengan versi Android
dan target SDK yang digunakan.

Selain itu, aplikasi harus menangani:

-   Location Permission.

-   Background Location Permission.

-   GPS Disabled.

-   Battery Optimization.

-   Background Restriction.

## **6.7. Penanganan Offline**

Jika GPS berhasil didapatkan tetapi koneksi internet tidak tersedia:

GPS Berhasil

│

▼

Internet Tidak Tersedia

│

▼

Request API Gagal

Aplikasi dapat menggunakan mekanisme:

GPS

↓

Local Queue

↓

Internet Kembali

↓

Sync Data

↓

Backend

Penyimpanan lokal dapat menggunakan:

-   Hive.

-   SQLite.

-   Database lokal lainnya.

Namun, mekanisme offline queue perlu dikonfirmasi terlebih dahulu kepada
backend, terutama terkait timestamp dan validitas data lokasi yang
dikirim terlambat.

# **7. Registrasi Warga**

## **7.1. Tujuan**

Fitur Registrasi Warga digunakan untuk membantu warga yang tidak dapat
melakukan registrasi atau menggunakan aplikasi secara mandiri.

Mahasiswa melakukan pendataan melalui aplikasi mobile.

Alur:

Mahasiswa Login

│

▼

Menu Registrasi Warga

│

▼

Input Data Warga

│

▼

Validasi Form

│

▼

Submit API

│

▼

Backend

│

▼

Binding Otomatis

│

▼

Warga Menjadi Warga Dampingan

## **7.2. Data Registrasi**

Field registrasi harus mengikuti API Contract dari backend.

Contoh field yang mungkin diperlukan:

Nama Lengkap

NIK

Nomor HP

Alamat

RT

RW

Desa/Kelurahan

Kecamatan

Namun, field final harus mengikuti request body yang ditentukan oleh
backend.

## **7.3. Binding Mahasiswa dan Warga**

Mahasiswa melakukan request menggunakan JWT miliknya.

Contoh:

Authorization: Bearer JWT_MAHASISWA

Backend kemudian membaca identitas mahasiswa dari token tersebut.

Contoh:

JWT

│

▼

Mahasiswa ID = 12

│

▼

Registrasi Warga

│

▼

Warga ID = 100

│

▼

Binding

│

▼

Mahasiswa ID 12 → Warga ID 100

Dengan mekanisme ini, Flutter tidak perlu mengirimkan mahasiswa_id
secara manual apabila backend sudah dapat mengambil identitas tersebut
dari JWT.

Hal ini lebih aman karena mahasiswa tidak dapat sembarangan mengirimkan
ID mahasiswa lain.

# **8. Validasi Form Registrasi**

Form registrasi harus melakukan validasi sebelum request API dikirim.

Validasi minimal:

### **Nama**

-   Tidak boleh kosong.

-   Format harus valid.

### **NIK**

-   Tidak boleh kosong.

-   Format harus sesuai dengan ketentuan backend.

### **Nomor HP**

-   Tidak boleh kosong.

-   Format nomor harus valid.

### **Alamat**

-   Tidak boleh kosong.

Alur validasi:

Input Form

│

▼

Validasi

│

├── Tidak Valid → Tampilkan Error

│

└── Valid

│

▼

API Request

# **9. Dashboard Monitoring Warga Dampingan**

Endpoint:

GET /api/kkn/warga-dampingan

Header:

Authorization: Bearer \<JWT_TOKEN\>

Endpoint tersebut digunakan untuk mendapatkan daftar warga yang telah
didaftarkan atau didampingi oleh mahasiswa.

Data dapat digunakan untuk menampilkan:

-   Nama warga.

-   Data identitas warga.

-   Jumlah aktivitas pemilahan.

-   Jumlah pemilahan benar.

-   Jumlah pemilahan salah.

-   Jumlah pelanggaran.

-   Riwayat pemilahan.

-   Status edukasi.

Struktur response final harus mengikuti API Contract dari backend.

# **10. Desain Dashboard**

Dashboard utama dapat terdiri dari beberapa bagian.

## **10.1. Summary Card**

Contoh:

┌─────────────────────────────┐

│ Warga Dampingan │

│ 25 │

└─────────────────────────────┘

┌─────────────────────────────┐

│ Tingkat Pemilahan Benar │

│ 82% │

└─────────────────────────────┘

┌─────────────────────────────┐

│ Total Pelanggaran │

│ 18 │

└─────────────────────────────┘

## **10.2. Daftar Warga Dampingan**

Contoh:

Budi

Pemilahan Benar: 80%

Pelanggaran: 4

Status: Perlu Edukasi Ulang

\[ Lihat Detail \]

## **10.3. Grafik**

Grafik dapat digunakan untuk memberikan gambaran performa warga secara
visual.

Jenis grafik yang dapat digunakan:

-   Bar Chart.

-   Line Chart.

-   Pie Chart.

-   Donut Chart.

Package Flutter yang dapat digunakan:

fl_chart

Contoh data:

Pemilahan Benar : 80%

Pemilahan Salah : 20%

Atau:

Minggu 1 : 70%

Minggu 2 : 75%

Minggu 3 : 80%

Minggu 4 : 90%

# **11. Detail Warga Dampingan**

Ketika mahasiswa memilih salah satu warga, aplikasi dapat menampilkan
halaman detail.

Informasi:

Nama Warga

Alamat

Tanggal Registrasi

Total Aktivitas

Pemilahan Benar

Pemilahan Salah

Total Pelanggaran

Kemudian ditampilkan grafik performa warga.

Contoh:

Pemilahan Benar

████████████████ 80%

Pemilahan Salah

████ 20%

Kemudian ditampilkan riwayat:

Tanggal Aktivitas Status

01/07/2026 Pemilahan Benar

03/07/2026 Pemilahan Benar

05/07/2026 Pemilahan Salah

07/07/2026 Pemilahan Benar

# **12. Indikator Edukasi Ulang**

Aplikasi perlu memberikan informasi kepada mahasiswa apabila terdapat
warga yang membutuhkan edukasi ulang.

Contoh tampilan:

⚠ Warga Membutuhkan Edukasi Ulang

Budi

Kesalahan Pemilahan: 40%

Siti

Kesalahan Pemilahan: 35%

Jika backend menyediakan field:

needs_reeducation

maka Flutter cukup menampilkan status berdasarkan data backend.

Jika backend tidak menyediakan status tersebut, aturan perhitungan harus
ditentukan terlebih dahulu.

Contoh aturan:

Persentase Kesalahan \> 30%

maka:

Status = Perlu Edukasi Ulang

Namun, threshold tidak boleh ditentukan sepihak oleh Flutter tanpa
kesepakatan dengan backend.

# **13. Arsitektur Flutter yang Direkomendasikan**

Struktur project yang direkomendasikan:

lib/

│

├── core/

│ ├── network/

│ │ ├── dio_client.dart

│ │ └── auth_interceptor.dart

│ │

│ ├── storage/

│ │ └── secure_storage_service.dart

│ │

│ └── services/

│ └── location_service.dart

│

├── features/

│ │

│ ├── auth/

│ │ ├── controllers/

│ │ │ └── login_controller.dart

│ │ ├── models/

│ │ │ └── login_response.dart

│ │ ├── repositories/

│ │ │ └── auth_repository.dart

│ │ └── views/

│ │ └── login_screen.dart

│ │

│ ├── location/

│ │ ├── controllers/

│ │ │ └── location_controller.dart

│ │ └── services/

│ │ └── background_location_service.dart

│ │

│ ├── warga/

│ │ ├── controllers/

│ │ │ └── warga_controller.dart

│ │ ├── models/

│ │ │ └── warga_model.dart

│ │ ├── repositories/

│ │ │ └── warga_repository.dart

│ │ └── views/

│ │ ├── registrasi_warga_screen.dart

│ │ └── warga_dampingan_screen.dart

│ │

│ └── monitoring/

│ ├── controllers/

│ │ └── monitoring_controller.dart

│ ├── models/

│ │ └── monitoring_model.dart

│ └── views/

│ ├── dashboard_screen.dart

│ └── detail_warga_screen.dart

│

└── routes/

└── app_routes.dart

# **14. State Management**

Apabila aplikasi menggunakan GetX, maka controller dapat dibagi sebagai
berikut.

## **LoginController**

Bertanggung jawab untuk:

login()

logout()

autoLogin()

isLoading

errorMessage

## **LocationController**

Bertanggung jawab untuk:

startTracking()

stopTracking()

requestPermission()

checkPermission()

lastLocation

isTracking

## **WargaController**

Bertanggung jawab untuk:

registerWarga()

getWargaDampingan()

## **MonitoringController**

Bertanggung jawab untuk:

getDashboard()

getWargaDetail()

isLoading

# **15. Dependency Flutter**

Package yang kemungkinan dibutuhkan:

dependencies:

flutter:

sdk: flutter

dio:

get:

flutter_secure_storage:

geolocator:

flutter_background_service:

fl_chart:

connectivity_plus:

Untuk kebutuhan offline queue dapat ditambahkan:

hive:

hive_flutter:

atau:

sqflite:

Pemilihan package final harus disesuaikan dengan kebutuhan dan
kompatibilitas versi Flutter serta Android yang digunakan.

# **16. Pembagian API Layer**

API dapat dipisahkan berdasarkan fitur.

AuthApi

LocationApi

WargaApi

MonitoringApi

Contoh:

AuthApi

└── login()

LocationApi

└── sendLocationPing()

WargaApi

├── registerWarga()

└── getWargaDampingan()

MonitoringApi

├── getDashboard()

└── getWargaDetail()

Dengan pemisahan ini, kode aplikasi lebih mudah dikelola dan
dikembangkan.

# **17. Fitur yang Dihapus**

Berdasarkan requirement terbaru, fitur berikut tidak lagi digunakan:

1.  Scan QR Code Tempat Sampah.

2.  Claim Tempat Sampah.

3.  Perubahan status tong menjadi ASSIGNED_TO_PIC.

4.  Status PENDING_APPROVAL untuk proses claim.

5.  Aktivasi Tempat Sampah melalui QR Code.

6.  Flow approval Tempat Sampah.

7.  UI Scanner QR Code.

8.  API Claim Tempat Sampah.

9.  Logika PIC terhadap kepemilikan Tempat Sampah.

Fitur tersebut harus dihapus atau tidak digunakan lagi dalam flow
aplikasi mahasiswa KKN.

# **18. Kebutuhan API yang Masih Perlu Dikonfirmasi**

Berdasarkan requirement yang tersedia, beberapa informasi API masih
perlu dikonfirmasi kepada tim backend.

  ----------------------------------------------------------------------------
  **Fitur**         **Method**   **Endpoint**                **Status**
  ----------------- ------------ --------------------------- -----------------
  Login             POST         Endpoint Login              Perlu API
                                                             Contract

  Location Ping     POST         /api/kkn/location-ping      Tersedia

  Registrasi Warga  POST         Belum ditentukan            Perlu
                                                             dikonfirmasi

  Warga Dampingan   GET          /api/kkn/warga-dampingan    Tersedia

  Detail Warga      GET          Belum ditentukan            Perlu
                                                             dikonfirmasi

  Riwayat Warga     GET          Belum ditentukan            Perlu
                                                             dikonfirmasi
  ----------------------------------------------------------------------------

Data yang perlu diminta dari backend:

10. Endpoint login.

11. Request body login.

12. Response login.

13. Struktur JWT.

14. Masa berlaku JWT.

15. Endpoint registrasi warga.

16. Request body registrasi warga.

17. Response registrasi warga.

18. Endpoint warga dampingan.

19. Struktur response warga dampingan.

20. Struktur riwayat pemilahan.

21. Struktur riwayat pelanggaran.

22. Endpoint detail warga.

23. Aturan penentuan edukasi ulang.

24. Response API location ping.

25. Interval location ping yang ditentukan backend.

26. Aturan pengiriman lokasi ketika offline.

27. Apakah timestamp lokasi dikirim oleh mobile atau dibuat oleh server.

# **19. Urutan Tahapan Pengembangan**

Pengembangan aplikasi disarankan dilakukan secara bertahap.

## **Tahap 1 --- Authentication**

Login

↓

JWT

↓

Secure Storage

↓

Dio Interceptor

↓

Auto Login

↓

Logout

## **Tahap 2 --- API Client**

Dio

↓

Base URL

↓

JWT Interceptor

↓

Error Handler

## **Tahap 3 --- Registrasi Warga**

Form

↓

Validation

↓

API Request

↓

Binding Otomatis

↓

Success Response

## **Tahap 4 --- Dashboard Monitoring**

GET Warga Dampingan

↓

Model

↓

Controller

↓

List Warga

↓

Statistik

↓

Chart

↓

Detail Warga

## **Tahap 5 --- Background Location**

Location Permission

↓

GPS

↓

Background Service

↓

JWT

↓

Location Ping

↓

Internet Handling

↓

Retry / Queue

↓

Testing

Background Location disarankan dikerjakan setelah API authentication
stabil karena fitur tersebut bergantung pada JWT untuk melakukan request
ke backend.

# **20. Kesimpulan**

Berdasarkan requirement terbaru, aplikasi mobile Modul Mahasiswa KKN
mengalami perubahan fokus dari sistem klaim atau aktivasi Tempat Sampah
menjadi sistem pendampingan warga.

Mahasiswa KKN memiliki tiga fungsi utama dalam aplikasi, yaitu:

28. **Mengirimkan lokasi secara otomatis melalui Background Location**
    sebagai pengganti mekanisme absensi manual.

29. **Membantu melakukan registrasi warga** yang mengalami kesulitan
    dalam menggunakan aplikasi, di mana backend secara otomatis
    melakukan binding antara mahasiswa dengan warga yang didaftarkan.

30. **Melakukan monitoring warga dampingan** melalui dashboard yang
    menampilkan performa pemilahan sampah, riwayat aktivitas, dan
    pelanggaran warga.

Arsitektur utama sistem dapat digambarkan sebagai berikut:

MAHASISWA KKN

│

▼

LOGIN

│

▼

JWT TOKEN

│

┌────────────┴────────────┐

│ │

▼ ▼

BACKGROUND LOCATION REGISTRASI WARGA

│ │

▼ ▼

LOCATION PING BINDING OTOMATIS

│ │

│ ▼

│ WARGA DAMPINGAN

│ │

└────────────┬────────────┘

▼

DASHBOARD MONITORING

│

▼

RIWAYAT PEMILAHAN

│

▼

ANALISIS KINERJA

│

┌────────┴────────┐

│ │

▼ ▼

PERFORMA BAIK PERLU EDUKASI

│ │

▼ ▼

MONITORING EDUKASI ULANG

Dengan demikian, **aktivasi dalam konteks requirement terbaru bukan lagi
aktivasi atau klaim Tempat Sampah**. Mahasiswa KKN berfungsi sebagai
**pendamping warga**, sedangkan hubungan antara mahasiswa dan warga
dibentuk melalui proses **registrasi warga dan binding otomatis oleh
backend**.

Dari sisi Flutter, pengembangan paling penting yang perlu diprioritaskan
adalah **integrasi JWT, background location, registrasi warga, dan
dashboard monitoring**. Sementara itu, fitur **QR Scanner, Claim Tong
Sampah, ASSIGNED_TO_PIC, dan PENDING_APPROVAL harus dihapus dari alur
aplikasi mahasiswa KKN**.

Spesifikasi Teknis Backend KKN (Untuk Mobile Developer)

Dokumen ini berisi daftar tabel (model) dan *endpoint* API yang spesifik
ditujukan untuk pengembangan fitur Mahasiswa KKN di sisi Mobile.

1\. Struktur Data (Model Database) Terkait Mahasiswa

A. Model Profil Mahasiswa (StudentKkn)

Digunakan untuk data profil dan validasi masa tugas KKN.

-   id (String) - Primary Key

-   userId (String) - Referensi ke tabel User (Kredensial login)

-   nim (String) - Nomor Induk Mahasiswa

-   jurusan (String) - Jurusan Mahasiswa

-   fakultas (String) - Fakultas Mahasiswa

-   noWa (String) - Nomor WhatsApp Aktif

-   startDate (DateTime) - Tanggal mulai penugasan KKN

-   endDate (DateTime) - Tanggal selesai penugasan KKN

-   assignedPolygonId (Int, nullable) - ID Poligon wilayah tugas

-   whitelistStatus (String) - Status verifikasi akun (PENDING,
    APPROVED, REJECTED)

B. Model Pelacakan Lokasi (StudentLocation)

Untuk menampung hasil ping dari Background Service Mobile.

-   id (String) - Primary Key

-   studentId (String) - ID Mahasiswa

-   latitude (Decimal) - Titik Latitude GPS

-   longitude (Decimal) - Titik Longitude GPS

-   recordedAt (DateTime) - Waktu titik ini ditangkap

C. Relasi Warga Dampingan (Tabel Bin / Tempat Sampah)

Untuk memetakan warga mana yang dibantu registrasi oleh mahasiswa mana.

-   registeredByStudentId (String, nullable) - Jika form
    registrasi/aktivasi tong di-submit melalui akun mahasiswa, ID
    mahasiswa akan tercatat di field ini.

2\. Daftar Endpoint API (Mobile Integration)

Semua endpoint KKN memerlukan header otentikasi JWT:\
\
Authorization: Bearer \<TOKEN_MAHASISWA\>

2.1. Ping Lokasi Background (Absensi Geofence)

-   **Endpoint:**POST /api/kkn/location-ping

-   **Fungsi:** Dikirim oleh mobile secara background (interval 5-15
    menit) untuk mencatat pergerakan mahasiswa. Backend akan menghitung
    durasi di zona tugas.

-   **Request Body (JSON):**

-   {\
    \"latitude\": -6.8921,\
    \"longitude\": 107.6111\
    }

-   **Response (200 OK):**

-   {\
    \"success\": true,\
    \"message\": \"Lokasi berhasil dilacak\"\
    }

2.2. Dashboard Monitoring Warga Dampingan

-   **Endpoint:**GET /api/kkn/warga-dampingan

-   **Fungsi:** Mengambil data seluruh warga (dan riwayat buang
    sampahnya) yang pernah dibantu aktivasinya oleh mahasiswa yang
    sedang login.

-   **Response (200 OK):**

-   \[\
    {\
    \"binId\": \"uuid-tong-sampah\",\
    \"wargaName\": \"Bapak Budi\",\
    \"address\": \"Jl. Cisitu Indah No. 12\",\
    \"recentLogs\": \[\
    {\
    \"weightKg\": 2.5,\
    \"category\": \"ORGANIK\",\
    \"aiConfidence\": 95.0,\
    \"discrepancyStatus\": \"NONE\",\
    \"createdAt\": \"2026-07-28T10:00:00Z\"\
    }\
    \]\
    }\
    \]

2.3. Data Statistik KKN (Home Dashboard)

-   **Endpoint:**GET /api/kkn/dashboard

-   **Fungsi:** Menampilkan summary kinerja Mahasiswa (Poin KKN, Sisa
    Kuota Tugas, dll).

-   **Response (200 OK):**

-   {\
    \"studentKkn\": {\
    \"nim\": \"1301123456\",\
    \"jurusan\": \"Informatika\"\
    },\
    \"totalRegisteredBins\": 15,\
    \"assignmentLimit\": 100,\
    \"remainingQuota\": 85,\
    \"progressPercentage\": 15.0,\
    \"contributionPoints\": 250\
    }

3\. Instruksi Fitur (Dihapus vs Baru)

⚠️ **FITUR YANG DIHAPUS DARI MOBILE:**

-   Hapus *flow* Mahasiswa Scan QR Code Tong Kosong.

-   Hapus UI Status Tong \"ASSIGNED_TO_PIC\" (Pegang Tong).

-   Hapus Button/Approval \"PENDING_APPROVAL\".

✅ **FITUR YANG WAJIB DIBANGUN MOBILE:**

-   **Background Location Service:** Aktif meminta akses Lokasi walau
    aplikasi di *background/minimize*, dan menembak
    /api/kkn/location-ping.

-   **Form Registrasi Warga:** Jika warga belum mendaftar, Mahasiswa
    mendaftarkan via akunnya (otomatis ter-bind ke
    registeredByStudentId).

-   **UI Dashboard Chart:** Visualisasikan array recentLogs dari
    endpoint /api/kkn/warga-dampingan menjadi grafik (Line Chart/Bar
    Chart) untuk kemudahan monitoring perilaku warga.
