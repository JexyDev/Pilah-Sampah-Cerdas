import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/gps_calibration/state/gps_calibration_state.dart';
import '../../../../core/gps_calibration/state/gps_calibration_notifier.dart';
import '../../../../core/gps_calibration/analyzers/stability_scorer.dart';
import '../../../../core/values/app_colors.dart';
import 'gps_guide_cards.dart';

/// Panel kalibrasi GPS inline di halaman presensi.
///
/// Ditampilkan ketika mahasiswa mengetuk tombol ikon GPS diagnostik.
/// Tidak memblokir alur "Mulai Kegiatan".
class GpsCalibrationPanel extends ConsumerWidget {
  const GpsCalibrationPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final calibState = ref.watch(gpsCalibrationProvider);
    final notifier = ref.read(gpsCalibrationProvider.notifier);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: _borderColor(calibState.status),
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(calibState, notifier),
            const SizedBox(height: 12),
            _buildBody(context, calibState, notifier),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────────────

  Widget _buildHeader(
    GpsCalibrationState state,
    GpsCalibrationNotifier notifier,
  ) {
    return Row(
      children: [
        Icon(
          _headerIcon(state.status),
          color: _statusColor(state.status),
          size: 20,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            _headerTitle(state),
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: Color(0xFF1A1A2E),
            ),
          ),
        ),
        if (state.status == GpsCalibrationStatus.idle ||
            state.status == GpsCalibrationStatus.ready ||
            state.status == GpsCalibrationStatus.guide ||
            state.status == GpsCalibrationStatus.error)
          _StartButton(onTap: () => notifier.startCalibration()),
      ],
    );
  }

  // ─────────────────────────────────────────────────────
  // Body
  // ─────────────────────────────────────────────────────

  Widget _buildBody(
    BuildContext context,
    GpsCalibrationState state,
    GpsCalibrationNotifier notifier,
  ) {
    switch (state.status) {
      case GpsCalibrationStatus.idle:
        return _IdleBody();

      case GpsCalibrationStatus.checkingService:
      case GpsCalibrationStatus.checkingPermission:
      case GpsCalibrationStatus.checkingPrecision:
        return _CheckingBody(state: state);

      case GpsCalibrationStatus.sampling:
        return _SamplingBody(state: state);

      case GpsCalibrationStatus.analyzing:
        return _AnalyzingBody();

      case GpsCalibrationStatus.ready:
        return _ReadyBody(state: state);

      case GpsCalibrationStatus.guide:
        return _GuideBody(state: state, notifier: notifier);

      case GpsCalibrationStatus.error:
        return _ErrorBody(message: state.errorMessage);
    }
  }

  // ─────────────────────────────────────────────────────
  // Helper
  // ─────────────────────────────────────────────────────

  Color _borderColor(GpsCalibrationStatus status) {
    switch (status) {
      case GpsCalibrationStatus.ready:
        return AppColors.primaryGreen.withValues(alpha: 0.5);
      case GpsCalibrationStatus.guide:
      case GpsCalibrationStatus.error:
        return Colors.orange.withValues(alpha: 0.5);
      default:
        return Colors.grey.withValues(alpha: 0.2);
    }
  }

  Color _statusColor(GpsCalibrationStatus status) {
    switch (status) {
      case GpsCalibrationStatus.ready:
        return AppColors.primaryGreen;
      case GpsCalibrationStatus.guide:
      case GpsCalibrationStatus.error:
        return Colors.orange;
      default:
        return Colors.blueGrey;
    }
  }

  IconData _headerIcon(GpsCalibrationStatus status) {
    switch (status) {
      case GpsCalibrationStatus.ready:
        return Icons.gps_fixed;
      case GpsCalibrationStatus.guide:
      case GpsCalibrationStatus.error:
        return Icons.gps_not_fixed;
      case GpsCalibrationStatus.sampling:
      case GpsCalibrationStatus.analyzing:
        return Icons.satellite_alt;
      default:
        return Icons.gps_fixed;
    }
  }

  String _headerTitle(GpsCalibrationState state) {
    switch (state.status) {
      case GpsCalibrationStatus.idle:
        return 'Diagnostik Sinyal GPS';
      case GpsCalibrationStatus.checkingService:
        return 'Memeriksa layanan GPS...';
      case GpsCalibrationStatus.checkingPermission:
        return 'Memeriksa izin lokasi...';
      case GpsCalibrationStatus.checkingPrecision:
        return 'Memeriksa presisi lokasi...';
      case GpsCalibrationStatus.sampling:
        return 'Mengambil sampel ${state.currentSample}/${state.totalSamples}...';
      case GpsCalibrationStatus.analyzing:
        return 'Menganalisis kualitas sinyal...';
      case GpsCalibrationStatus.ready:
        final label = StabilityScorer.scoreLabel(state.stabilityScore ?? 0);
        return 'Sinyal GPS $label';
      case GpsCalibrationStatus.guide:
        return 'Sinyal GPS Perlu Perhatian';
      case GpsCalibrationStatus.error:
        return 'Terjadi Kesalahan';
    }
  }
}

// ════════════════════════════════════════════════════════
// Sub-widget body per status
// ════════════════════════════════════════════════════════

class _IdleBody extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text(
      'Ketuk tombol "Mulai" untuk mengecek kualitas sinyal GPS di lokasi Anda sebelum presensi.',
      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
    );
  }
}

class _CheckingBody extends StatelessWidget {
  final GpsCalibrationState state;
  const _CheckingBody({required this.state});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            _label(state.status),
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
        ),
      ],
    );
  }

  String _label(GpsCalibrationStatus s) {
    switch (s) {
      case GpsCalibrationStatus.checkingService:
        return 'Memeriksa apakah GPS aktif...';
      case GpsCalibrationStatus.checkingPermission:
        return 'Memeriksa izin lokasi...';
      case GpsCalibrationStatus.checkingPrecision:
        return 'Memeriksa izin Precise Location...';
      default:
        return 'Memproses...';
    }
  }
}

class _SamplingBody extends StatelessWidget {
  final GpsCalibrationState state;
  const _SamplingBody({required this.state});

  @override
  Widget build(BuildContext context) {
    final progress = state.totalSamples > 0
        ? state.currentSample / state.totalSamples
        : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Mengumpulkan ${state.totalSamples} sampel GPS untuk analisis stabilitas...',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: Colors.grey.shade200,
            valueColor:
                const AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '${state.currentSample} dari ${state.totalSamples} sampel',
          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
        ),
      ],
    );
  }
}

class _AnalyzingBody extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            'Menghitung skor stabilitas sinyal...',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
        ),
      ],
    );
  }
}

class _ReadyBody extends StatelessWidget {
  final GpsCalibrationState state;
  const _ReadyBody({required this.state});

  @override
  Widget build(BuildContext context) {
    final score = state.stabilityScore ?? 0;
    final accuracy = state.avgAccuracyMeters;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _ScoreBadge(score: score),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (accuracy != null)
                  _InfoChip(
                    icon: Icons.radar,
                    label: 'Akurasi: ±${accuracy.toStringAsFixed(0)} m',
                  ),
                const SizedBox(height: 4),
                if (state.jumpCount > 0)
                  _InfoChip(
                    icon: Icons.warning_amber_rounded,
                    label: '${state.jumpCount} GPS jump terdeteksi',
                    color: Colors.orange,
                  )
                else
                  const _InfoChip(
                    icon: Icons.check_circle_outline,
                    label: 'Tidak ada GPS jump',
                    color: AppColors.primaryGreen,
                  ),
              ],
            ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Sinyal GPS Anda cukup baik untuk presensi di lokasi ini.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }
}

class _GuideBody extends StatelessWidget {
  final GpsCalibrationState state;
  final GpsCalibrationNotifier notifier;
  const _GuideBody({required this.state, required this.notifier});

  @override
  Widget build(BuildContext context) {
    final score = state.stabilityScore;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (score != null) ...[
          Row(
            children: [
              _ScoreBadge(score: score, isGood: false),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  state.errorMessage ?? 'Sinyal GPS di lokasi ini kurang stabil.',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ] else if (state.errorMessage != null) ...[
          Text(
            state.errorMessage!,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 12),
        ],
        GpsGuideCards(
          guideActions: state.guideActions,
          onRetry: () => notifier.retry(),
        ),
      ],
    );
  }
}

class _ErrorBody extends StatelessWidget {
  final String? message;
  const _ErrorBody({this.message});

  @override
  Widget build(BuildContext context) {
    return Text(
      message ?? 'Terjadi kesalahan tak terduga.',
      style: const TextStyle(fontSize: 12, color: Colors.red),
    );
  }
}

// ════════════════════════════════════════════════════════
// Komponen kecil reusable
// ════════════════════════════════════════════════════════

class _StartButton extends StatelessWidget {
  final VoidCallback onTap;
  const _StartButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'Mulai',
          style: TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  final double score;
  final bool isGood;
  const _ScoreBadge({required this.score, this.isGood = true});

  @override
  Widget build(BuildContext context) {
    final color = isGood ? AppColors.primaryGreen : Colors.orange;
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color, width: 2),
      ),
      child: Center(
        child: Text(
          score.toStringAsFixed(0),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    this.color = const Color(0xFF607D8B),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, color: color)),
      ],
    );
  }
}
