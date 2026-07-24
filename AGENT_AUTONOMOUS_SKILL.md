========================================================
DOKUMEN — SKILL AGENTIK: AUTONOMOUS DEVELOPMENT MODE
========================================================
Simpan sebagai AGENT_AUTONOMOUS_SKILL.md di root project. Ini melengkapi (bukan menggantikan) AGENT_SKILL.md yang sudah ada — berlaku KHUSUS saat kamu diminta bekerja mandiri sampai project selesai.

AGENT SKILL: Autonomous Full-Cycle Development — TrashCare

MODE KERJA
Kamu bekerja MANDIRI dan BERKELANJUTAN sampai SELURUH fitur dari seluruh role selesai dibangun, diuji, dan terbukti bebas error — tanpa perlu diperintah ulang tiap langkah. Kamu TIDAK berhenti di tengah jalan hanya karena "sudah mengerjakan beberapa item" — kamu lanjut terus sampai benar-benar tuntas atau sampai ketemu kondisi wajib-berhenti di bawah.

KAPAN WAJIB BERHENTI DAN BERTANYA (SATU-SATUNYA ALASAN BERHENTI)
HANYA jika instruksi ambigu/tidak jelas dan TIDAK ADA cukup konteks di dokumen project (AGENT_SKILL.md, tracker sebelumnya, TRD) untuk mengambil keputusan aman.
Saat berhenti: tulis PERSIS apa yang ambigu, opsi yang mungkin, dan rekomendasimu — lalu BERHENTI TOTAL menunggu jawaban. Jangan lanjut mengerjakan bagian lain sambil menunggu (supaya tidak ada pekerjaan paralel yang berisiko salah arah dari asumsi yang sama).
Di LUAR kondisi ini, KAMU TIDAK BOLEH BERHENTI. Tidak ada alasan lain untuk berhenti (bukan karena "sudah banyak yang dikerjakan", bukan karena "capek", bukan karena kehabisan ide — kalau kehabisan ide, itu tandanya ambigu, ikuti aturan di atas).

BUG DI FITUR YANG SUDAH ADA
Kalau menemukan bug di fitur LAIN yang sudah pernah dibangun (bukan yang sedang dikerjakan) dan root cause-nya JELAS -> PERBAIKI LANGSUNG, catat di laporan (jangan tanya dulu, jangan tunda).
Kalau root cause TIDAK jelas/butuh investigasi besar yang mengubah arsitektur -> catat sebagai temuan, lanjutkan kerjaan utama dulu, kembali ke bug ini nanti sesuai prioritas.

PELAPORAN
Laporkan progres di akhir tiap TAHAP BESAR (bukan tiap file/fungsi kecil) — definisi "tahap besar": satu role/modul penuh selesai (misal seluruh Portal RW selesai dan lulus QC sendiri), BUKAN tiap 1-2 fitur kecil.
Laporan WAJIB berisi: apa yang selesai, apa yang di-fix sekalian (bug lama), apa yang masih tersisa, dan status QC (lulus test sendiri atau belum).
JANGAN diam total dari awal sampai akhir tanpa kabar sama sekali — checkpoint di akhir tiap tahap besar adalah wajib minimum.

STANDAR "SELESAI" (DEFINITION OF DONE — WAJIB SEMUA TERPENUHI)
Satu fitur/modul HANYA dianggap selesai jika:
1. Fetch API asli berjalan (bukan simulasi/dummy statis).
2. RBAC & data-scoping benar (role yang tidak berwenang ditolak, data tidak bocor lintas wilayah).
3. Loading/error/empty state ada dan berfungsi.
4. Sudah di-test SENDIRI oleh kamu (bukan asumsi kode "pasti benar") — jalankan skenario nyata, verifikasi hasilnya muncul benar di tempat yang seharusnya.
5. Tidak ada regresi ke fitur lain yang sudah berjalan sebelumnya (test ulang fitur terkait setelah perubahan).
6. Tercatat [x] di tracker dengan catatan bukti (bukan cuma centang kosong).

Kalau salah satu dari 6 poin ini belum terpenuhi, fitur itu BUKAN "selesai" — jangan laporkan sebagai selesai.

LARANGAN KERAS (DARI AGENT_SKILL.md, DITEGASKAN ULANG)
Jangan pernah bilang "semua sudah beres/tidak ada error" tanpa bukti test nyata — ini pelanggaran paling serius dalam mode otonom, karena tidak ada manusia yang mengawasi tiap langkahmu secara real-time.
Jangan mengubah scope/fitur di luar yang sudah didefinisikan di dokumen project tanpa berhenti-dan-tanya dulu (lihat aturan berhenti di atas).
Jangan skip testing demi kecepatan — mode otonom BUKAN alasan untuk terburu-buru, justru harus LEBIH teliti karena tidak ada review manusia di setiap langkah.
