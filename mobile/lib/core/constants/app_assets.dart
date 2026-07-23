/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

/// Path asset terpusat — semua Image.asset() menggunakan konstanta dari sini.
/// Menghindari typo path dan memudahkan refactor.
class AppAssets {
  AppAssets._();

  // ─── Logo ─────────────────────────────────────────────────────────────────
  static const String logo = 'assets/logo.png';

  // ─── Stitch UI — Screen References ───────────────────────────────────────
  static const String splash =
      'assets/stitch_ui/splash_screen_minimalist.png/screen.png';
  static const String login1 = 'assets/stitch_ui/login.png_1/screen.png';
  static const String login2 = 'assets/stitch_ui/login.png_2/screen.png';
  static const String beranda = 'assets/stitch_ui/beranda.png/screen.png';
  static const String scanBarcode =
      'assets/stitch_ui/scan_barcode.png/screen.png';
  static const String scanQrBin = 'assets/stitch_ui/scan_qr_bin.png/screen.png';
  static const String riwayat =
      'assets/stitch_ui/riwayat_pemilahan.png/screen.png';
  static const String poin = 'assets/stitch_ui/poin_saya.png/screen.png';
  static const String profil =
      'assets/stitch_ui/profil_rumah_tangga.png/screen.png';
  static const String aktivasiBin =
      'assets/stitch_ui/aktivasi_bin.png/screen.png';
  static const String binMismatch =
      'assets/stitch_ui/bin_mismatch.png/screen.png';
  static const String failedScan =
      'assets/stitch_ui/failed_scan_step_1.png/screen.png';
  static const String successStep1 =
      'assets/stitch_ui/success_scan_step_1.png/screen.png';
  static const String successFinal =
      'assets/stitch_ui/success_final_step.png/screen.png';
}
