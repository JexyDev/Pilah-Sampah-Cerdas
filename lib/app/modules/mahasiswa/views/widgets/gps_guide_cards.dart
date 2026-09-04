import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/values/app_colors.dart';

/// Widget kartu-kartu panduan troubleshooting GPS.
/// Ditampilkan di dalam [GpsCalibrationPanel] saat status `guide`.
///
/// Bersifat dinamis — kartu ditentukan oleh [guideActions] dari use case,
/// bukan hardcode. Mudah ditambah aksi baru di masa depan.
class GpsGuideCards extends StatelessWidget {
  final List<String> guideActions;
  final VoidCallback onRetry;

  const GpsGuideCards({
    super.key,
    required this.guideActions,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final cards = guideActions
        .map((action) => _buildCard(context, action))
        .whereType<Widget>()
        .toList();

    if (cards.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Langkah yang disarankan:',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(height: 8),
        ...cards,
      ],
    );
  }

  Widget? _buildCard(BuildContext context, String action) {
    switch (action) {
      case 'enable_gps_service':
        return _GuideCard(
          icon: Icons.location_off,
          title: 'Aktifkan GPS',
          subtitle: 'GPS perangkat tidak aktif. Aktifkan dari panel notifikasi atau Pengaturan.',
          actionLabel: 'Buka Pengaturan Lokasi',
          onAction: () => Geolocator.openLocationSettings(),
          color: Colors.red,
        );

      case 'open_app_settings':
        return _GuideCard(
          icon: Icons.settings,
          title: 'Buka Pengaturan Aplikasi',
          subtitle: 'Izin lokasi diblokir permanen. Buka pengaturan dan aktifkan kembali izin lokasi untuk aplikasi ini.',
          actionLabel: 'Buka Pengaturan',
          onAction: () => Geolocator.openAppSettings(),
          color: Colors.red,
        );

      case 'enable_precise_location':
        return _GuideCard(
          icon: Icons.gps_fixed,
          title: 'Aktifkan Lokasi Presisi',
          subtitle: 'Izin lokasi yang diberikan hanya perkiraan (approximate). Aktifkan "Precise Location" di pengaturan izin aplikasi.',
          actionLabel: 'Buka Pengaturan',
          onAction: () => Geolocator.openAppSettings(),
          color: Colors.orange,
        );

      case 'open_area':
        return const _GuideCard(
          icon: Icons.open_in_full,
          title: 'Pindah ke Area Terbuka',
          subtitle: 'GPS lebih akurat di ruang terbuka tanpa halangan bangunan, pepohonan lebat, atau terowongan. Coba berpindah ke lokasi yang lebih terbuka.',
          color: Colors.blueGrey,
        );

      case 'disable_battery_saver':
        return const _GuideCard(
          icon: Icons.battery_saver,
          title: 'Matikan Battery Saver',
          subtitle: 'Mode hemat baterai dapat membatasi akurasi GPS. Matikan Battery Saver sementara saat melakukan presensi.',
          color: Colors.amber,
        );

      case 'wait_and_retest':
        return _GuideCard(
          icon: Icons.refresh,
          title: 'Coba Lagi',
          subtitle: 'GPS membutuhkan waktu beberapa detik untuk mengunci sinyal (cold start). Tunggu sebentar lalu coba kalibrasi ulang.',
          actionLabel: 'Kalibrasi Ulang',
          onAction: onRetry,
          color: AppColors.primaryGreen,
        );

      case 'request_permission':
        return _GuideCard(
          icon: Icons.lock_open,
          title: 'Izin Lokasi Diperlukan',
          subtitle: 'Aplikasi memerlukan izin lokasi untuk menjalankan diagnostik GPS.',
          actionLabel: 'Buka Pengaturan',
          onAction: () => Geolocator.openAppSettings(),
          color: Colors.orange,
        );

      default:
        return null;
    }
  }
}

// ─────────────────────────────────────────────────────
// Kartu panduan individual
// ─────────────────────────────────────────────────────

class _GuideCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Color color;

  const _GuideCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
    this.color = Colors.blueGrey,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
                if (actionLabel != null && onAction != null) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: onAction,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        actionLabel!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
