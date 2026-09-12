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
    required this.wilayahTitle,
    required this.isFetchingAddress,
    this.address,
    this.position,
    this.onRefresh,
  });

  /// Judul Wilayah (misal: "Kel. Sukasari • RW 03")
  final String wilayahTitle;

  /// Status loading saat fetch alamat
  final bool isFetchingAddress;

  /// Alamat hasil konversi reverse geocoding
  final String? address;

  /// Posisi koordinat GPS saat ini
  final Position? position;

  /// Callback ketika tombol "Perbarui" ditekan
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    final String displayText;
    if (isFetchingAddress) {
      displayText = 'Mencari alamat...';
    } else if (address != null && address!.isNotEmpty) {
      displayText = address!;
    } else if (position != null) {
      displayText =
          '${position!.latitude.toStringAsFixed(4)}, ${position!.longitude.toStringAsFixed(4)}';
    } else {
      displayText = 'Menunggu GPS...';
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
          // Tier 1: Wilayah Penugasan/Domisili & Tombol Perbarui Alamat
          Row(
            children: [
              const Icon(
                Icons.location_on,
                size: 13,
                color: AppColors.primaryGreen,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  wilayahTitle.isNotEmpty ? wilayahTitle : 'Wilayah Belum Diatur',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryGreen,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
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
                            fontSize: 10,
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
          const SizedBox(height: 4),
          // Tier 2: Alamat Lengkap GPS (Multiline 2 Baris agar tidak terpotong)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 1),
                child: Icon(
                  Icons.my_location_rounded,
                  size: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  displayText,
                  style: const TextStyle(
                    fontSize: 10.5,
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
