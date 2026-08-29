/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: GENERATOR FORMULIR PENDATAAN MAHASISWA KKN BERSEKA
 * ============================================================================
 * Deskripsi:
 * Script ini secara otomatis membuat Google Form pendataan mahasiswa KKN
 * dengan validasi ketat (Anti-Ketukar antara NIM, No HP, dan Nama) serta
 * menghubungkannya langsung ke Google Spreadsheet baru.
 *
 * CARA MENGGUNAKAN:
 * 1. Buka https://script.google.com di browser Anda.
 * 2. Klik tombol "+ Project Baru" (New Project).
 * 3. Hapus semua kode default `function myFunction() {}`.
 * 4. Paste (tempel) seluruh isi script ini ke editor Apps Script.
 * 5. Pilih fungsi `buatFormMahasiswaBerseka` di dropdown atas.
 * 6. Klik tombol "Run" (Jalankan) [▶️].
 * 7. Berikan izin otorisasi Google (Review permissions -> Allow).
 * 8. Lihat log output (Execution Log) untuk mendapatkan Link Form & Spreadsheet!
 * ============================================================================
 */

function buatFormMahasiswaBerseka() {
  Logger.log("🚀 Memulai pembuatan Google Form Pendataan Mahasiswa BERSEKA...");

  // 1. Inisialisasi Form Baru
  const form = FormApp.create("Formulir Pendataan & Validasi Mahasiswa KKN - BERSEKA");
  
  form.setDescription(
    "🌿 FORMULIR RESMI PENDATAAN & VERIFIKASI MAHASISWA KKN BERSEKA 🌿\n\n" +
    "Mohon isi data diri Anda dengan TELITI dan BENAR. Data ini digunakan untuk:\n" +
    "1. Pembuatan akun login aplikasi Mobile BERSEKA\n" +
    "2. Sistem absensi geofencing lokasi KKN\n" +
    "3. Penugasan wilayah dampingan (Kelurahan & RW)\n\n" +
    "⚠️ PERHATIAN PENTING (Mencegah Data Tertukar):\n" +
    "• Pastikan NIM HANYA berisi angka NIM Anda (Bukan No HP!).\n" +
    "• Pastikan No WhatsApp aktif yang digunakan pada HP Anda (Format: 08xxx).\n" +
    "• Gunakan Nama Lengkap resmi sesuai KTM / KTP."
  );

  // Pengaturan Form
  form.setAllowResponseEdits(true); // Mahasiswa bisa edit respon jika salah ketik
  form.setProgressBar(true);
  form.setConfirmationMessage(
    "✅ Terima kasih! Data Anda telah berhasil direkam ke dalam Database KKN BERSEKA.\n\n" +
    "Akun Anda akan segera disinkronisasikan ke dalam sistem dan aplikasi BERSEKA. " +
    "Pastikan nomor WhatsApp yang didaftarkan tetap aktif untuk menerima notifikasi."
  );

  // ==========================================================================
  // BAGIAN 1: IDENTITAS UTAMA (DILENGKAPI VALIDASI KETAT)
  // ==========================================================================
  form.addSectionHeaderItem()
    .setTitle("📋 BAGIAN 1: Identitas Pribadi & Kontak")
    .setHelpText("Pastikan tidak ada data yang tertukar antara Nama, NIM, dan No HP.");

  // 1. Nama Lengkap (Minimal 3 karakter huruf/spasi)
  const namaValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern("^[a-zA-Z\\s\\.,']{3,100}$")
    .setHelpText("❌ Masukkan nama lengkap yang benar (minimal 3 huruf, tanpa angka).")
    .build();
  
  const itemNama = form.addTextItem();
  itemNama.setTitle("Nama Lengkap Mahasiswa")
    .setHelpText("Sesuai nama resmi di KTM / KTP (Gunakan huruf kapital/rapi). Contoh: Amelya Rizqi Rachmadani")
    .setRequired(true)
    .setValidation(namaValidation);

  // 2. NIM (Nomor Induk Mahasiswa) - ANTI TERTUKAR DENGAN NO HP
  // Pola regex: hanya 6 sampai 12 digit angka (NIM biasanya 7-9 digit)
  const nimValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern("^[0-9]{6,12}$")
    .setHelpText("❌ ERROR: NIM harus berupa 6-12 digit angka murni (Contoh: 21224027). JANGAN memasukkan nomor HP atau nama di kolom NIM ini!")
    .build();

  const itemNim = form.addTextItem();
  itemNim.setTitle("NIM (Nomor Induk Mahasiswa)")
    .setHelpText("Hanya angka NIM Anda (Contoh: 21224027). DILARANG memasukkan No HP di sini!")
    .setRequired(true)
    .setValidation(nimValidation);

  // 3. Nomor WhatsApp / No HP - ANTI TERTUKAR DENGAN NIM
  // Pola regex: awalan 08 atau 628 atau +628, panjang total 10-15 digit
  const waValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern("^(\\+62|62|08)[0-9]{8,13}$")
    .setHelpText("❌ ERROR: Format Nomor WhatsApp salah! Gunakan awalan 08 atau 628 (Contoh: 081234567890, 10-14 digit). JANGAN memasukkan NIM di kolom nomor HP ini!")
    .build();

  const itemWa = form.addTextItem();
  itemWa.setTitle("Nomor WhatsApp Aktif")
    .setHelpText("Wajib nomor WhatsApp aktif yang digunakan di smartphone untuk login aplikasi BERSEKA (Contoh: 082115280051).")
    .setRequired(true)
    .setValidation(waValidation);

  // 4. Email Mahasiswa
  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText("❌ Format alamat email tidak valid (Contoh: mahasiswa@email.com).")
    .build();

  const itemEmail = form.addTextItem();
  itemEmail.setTitle("Alamat Email Aktif")
    .setHelpText("Email mahasiswa / Gmail pribadi yang masih aktif.")
    .setRequired(true)
    .setValidation(emailValidation);

  // 5. Jenis Kelamin
  const itemGender = form.addMultipleChoiceItem();
  itemGender.setTitle("Jenis Kelamin")
    .setChoiceValues(["Laki-laki", "Perempuan"])
    .setRequired(true);

  // ==========================================================================
  // BAGIAN 2: DATA KAMPUS & PROGRAM STUDI
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle("🎓 BAGIAN 2: Data Perguruan Tinggi & Program Studi")
    .setHelpText("Informasi asal kampus dan program studi mahasiswa.");

  // 6. Asal Universitas
  const itemKampus = form.addMultipleChoiceItem();
  itemKampus.setTitle("Asal Universitas / Perguruan Tinggi")
    .setChoices([
      itemKampus.createChoice("Universitas Komputer Indonesia (UNIKOM)", true),
      itemKampus.createChoice("Lainnya")
    ])
    .showOtherOption(true)
    .setRequired(true);

  // 7. Jenjang Pendidikan
  const itemJenjang = form.addMultipleChoiceItem();
  itemJenjang.setTitle("Jenjang Pendidikan")
    .setChoiceValues(["S1 (Sarjana)", "D3 (Diploma)", "Lainnya"])
    .setRequired(true);

  // 8. Program Studi
  const itemProdi = form.addListItem();
  itemProdi.setTitle("Program Studi / Jurusan")
    .setChoiceValues([
      "Manajemen S1",
      "Teknik Informatika S1",
      "Sistem Informasi S1",
      "Ilmu Komunikasi S1",
      "Desain Komunikasi Visual (DKV) S1",
      "Teknik Komputer S1",
      "Teknik Elektro S1",
      "Teknik Sipil S1",
      "Teknik Industri S1",
      "Akuntansi S1",
      "Ilmu Pemerintahan S1",
      "Hubungan Internasional S1",
      "Hukum S1",
      "Sastra Inggris S1",
      "Sastra Jepang S1",
      "Manajemen Informatika D3",
      "Komputerisasi Akuntansi D3",
      "Lainnya"
    ])
    .setRequired(true);

  // ==========================================================================
  // BAGIAN 3: DATA PENUGASAN KKN & KELOMPOK BERSEKA
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle("📍 BAGIAN 3: Penugasan Kelompok & Wilayah KKN BERSEKA")
    .setHelpText("Pastikan kelompok dan kelurahan penugasan sesuai dengan pembagian KKN.");

  // 9. Kelurahan Penugasan
  const itemKelurahan = form.addListItem();
  itemKelurahan.setTitle("Kelurahan Lokasi Penugasan KKN")
    .setChoiceValues([
      "Dago",
      "Cipaganti",
      "Lebak Gede",
      "Lebak Siliwangi",
      "Sadang Serang",
      "Sekeloa",
      "Coblong (Lainnya)"
    ])
    .setRequired(true);

  // 10. Nama Kelompok KKN
  const itemKelompok = form.addTextItem();
  itemKelompok.setTitle("Nama / Nomor Kelompok KKN")
    .setHelpText("Contoh: Kelompok 1 Dago, Kelompok 2 Sadang Serang, Kelompok 3 Lebak Gede")
    .setRequired(true);

  // 11. Wilayah RW Dampingan
  const itemRw = form.addTextItem();
  itemRw.setTitle("Lokasi RW Penugasan / Dampingan")
    .setHelpText("Sebutkan nomor RW penugasan kelompok Anda (Contoh: RW 01, RW 02, RW 07, RW 08)")
    .setRequired(true);

  // 12. Peran di Kelompok
  const itemPeran = form.addMultipleChoiceItem();
  itemPeran.setTitle("Peran / Jabatan dalam Kelompok KKN")
    .setChoiceValues([
      "Ketua Kelompok (Kordes / Korcam)",
      "Wakil Ketua",
      "Sekretaris",
      "Bendahara",
      "Divisi Acara / Humas",
      "Divisi Lapangan / Teknis",
      "Anggota"
    ])
    .setRequired(true);

  // 13. Nama DPL (Dosen Pembimbing Lapangan)
  const itemDpl = form.addTextItem();
  itemDpl.setTitle("Nama Dosen Pembimbing Lapangan (DPL)")
    .setHelpText("Tuliskan nama lengkap beserta gelar DPL Anda jika mengetahui (Contoh: Prof. Umi Narimawati, S.E., M.Si. / Dr. ...). Boleh dikosongkan jika belum tahu.")
    .setRequired(false);

  // ==========================================================================
  // BAGIAN 4: VERIFIKASI & PERNYATAAN KEBENARAN DATA
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle("🔒 BAGIAN 4: Konfirmasi & Pernyataan Kebenaran Data")
    .setHelpText("Pemeriksaan akhir sebelum data disubmit ke sistem.");

  const itemPernyataan = form.addCheckboxItem();
  itemPernyataan.setTitle("Pernyataan Kebenaran Data Mahasiswa")
    .setChoices([
      itemPernyataan.createChoice("Saya menyatakan bahwa data yang saya masukkan (khususnya NIM, Nama Lengkap, dan Nomor WhatsApp) adalah BENAR, AKTIF, dan TIDAK TERTUKAR.")
    ])
    .setRequired(true);

  // ==========================================================================
  // PEMBUATAN SPREADSHEET RESPON SECARA OTOMATIS
  // ==========================================================================
  const ssName = "Database Respon Mahasiswa KKN BERSEKA (Hasil Form)";
  const spreadsheet = SpreadsheetApp.create(ssName);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  // URL yang dihasilkan
  const formEditUrl = form.getEditUrl();
  const formPublishedUrl = form.getPublishedUrl();
  const sheetUrl = spreadsheet.getUrl();

  Logger.log("\n============================================================");
  Logger.log("🎉 BERHASIL! Google Form & Spreadsheet telah dibuat!");
  Logger.log("============================================================");
  Logger.log("🔗 LINK PUBLIK FORM (Kirim ke Mahasiswa KKN):");
  Logger.log(formPublishedUrl);
  Logger.log("\n🛠️ LINK EDIT FORM (Untuk Pengelola/Admin):");
  Logger.log(formEditUrl);
  Logger.log("\n📊 LINK SPREADSHEET DATABASE RESPON:");
  Logger.log(sheetUrl);
  Logger.log("============================================================\n");

  return {
    formTitle: form.getTitle(),
    formPublishedUrl: formPublishedUrl,
    formEditUrl: formEditUrl,
    spreadsheetUrl: sheetUrl
  };
}
