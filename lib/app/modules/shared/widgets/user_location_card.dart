import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/values/app_colors.dart';

/// Kartu Informasi Lokasi Terstruktur 2-Tier
/// Sesuai standar desain dan fungsionalitas modul Mahasiswa:
/// - Tier 1: Ikon Lokasi, Nama Wilayah (Kelurahan & RW), Tombol Perbarui
/// - Tier 2: Ikon GPS, Alamat Terbaca (Reverse Geocoding) / Koordinat Fallback
class UserLocationCard extends StatelessWidget {
  const UserLocationCard({
    super.key,
    this.title = 'Titik Alamat Anda Sekarang',
    required this.wilayahTitle,
    required this.isFetchingAddress,
    this.address,
    this.position,
    this.onRefresh,
    this.isHomeAddress = false,
  });

  /// Judul Header Kartu (default: "Titik Alamat Anda Sekarang")
  final String? title;

  /// Judul Wilayah (misal: "Kel. Sukasari • RW 03")
  final String wilayahTitle;

  /// Status loading saat fetch alamat
  final bool isFetchingAddress;

  /// Alamat hasil konversi reverse geocoding atau alamat rumah tangga terdaftar
  final String? address;

  /// Posisi koordinat GPS saat ini
  final Position? position;

  /// Callback ketika tombol "Perbarui" ditekan
  final VoidCallback? onRefresh;

  /// Penanda apakah alamat ini merupakan alamat rumah tangga terdaftar di komunitas
  final bool isHomeAddress;

  @override
  Widget build(BuildContext context) {
    final String displayText;
    if (isFetchingAddress) {
      displayText = 'Mencari titik lokasi terkini...';
    } else if (address != null && address!.isNotEmpty) {
      displayText = address!;
    } else if (position != null) {
      displayText =
          'Koordinat GPS: ${position!.latitude.toStringAsFixed(4)}, ${position!.longitude.toStringAsFixed(4)}';
    } else {
      displayText = isHomeAddress
          ? 'Alamat rumah belum diatur'
          : 'Titik GPS belum terdeteksi (ketuk Perbarui)';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppColors.primaryGreen.withValues(alpha: 0.16),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Baris: Judul Kartu ("Titik Alamat Anda Sekarang") & Tombol "Perbarui"
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.my_location_rounded,
                    size: 13,
                    color: AppColors.primaryGreen,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    title ?? 'Titik Alamat Anda Sekarang',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ],
              ),
              if (!isFetchingAddress && onRefresh != null)
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: onRefresh,
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.refresh_rounded,
                          size: 13,
                          color: AppColors.primaryBlue,
                        ),
                        SizedBox(width: 3),
                        Text(
                          'Perbarui',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 5),
          // Tier 1: Wilayah Penugasan / Komunitas
          Row(
            children: [
              const Icon(
                Icons.location_on,
                size: 14,
                color: AppColors.primaryGreen,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  wilayahTitle.isNotEmpty ? wilayahTitle : 'Wilayah Belum Diatur',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Tier 2: Alamat Terkini GPS (Multiline 2 Baris agar tidak terpotong)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Icon(
                  isHomeAddress ? Icons.home_rounded : Icons.near_me_outlined,
                  size: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  displayText,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    height: 1.25,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
