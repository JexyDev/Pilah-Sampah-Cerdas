import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';

/// Modal Bottom Sheet SOP & Panduan Penggunaan Petugas Pemilahan Hilir.
/// Didesain dengan tampilan modern, jelas, dan user-friendly.
class SopKerjaPetugasWidget extends StatelessWidget {
  const SopKerjaPetugasWidget({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const SopKerjaPetugasWidget(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle Indicator
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.warningOrange.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.assignment_turned_in_rounded,
                    color: AppColors.warningOrange,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SOP & Panduan Petugas',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        'Petunjuk kerja penimbangan pemilahan hilir',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 24),

          // Scrollable Step Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  _buildStepCard(
                    stepNumber: '1',
                    title: 'Input Timbangan Pemilahan (Kg)',
                    icon: Icons.scale_rounded,
                    color: AppColors.primaryGreen,
                    description:
                        'Tekan menu "Input Timbangan", scan QR Code pada tempat sampah/pilih ID Tempat Sampah, lalu ketik angka bobot (Kg) hasil timbangan fisik secara jujur & presisi.',
                    tips: 'Tips: Pastikan jarum timbangan berada di posisi nol sebelum menimbang.',
                  ),
                  const SizedBox(height: 14),
                  _buildStepCard(
                    stepNumber: '2',
                    title: 'Catat Pelanggaran (Opsional)',
                    icon: Icons.report_problem_rounded,
                    color: AppColors.dangerRed,
                    description:
                        'Jika menemukan sampah berbahaya (B3/Belum Terpilah) di dalam tempat sampah pemilahan, tekan opsi "Catat Pelanggaran" dan sertakan foto bukti.',
                    tips: 'Tips: Laporan ini membantu edukasi warga oleh Ketua RW.',
                  ),
                  const SizedBox(height: 14),
                  _buildStepCard(
                    stepNumber: '3',
                    title: 'Cek Riwayat & Performa KPI',
                    icon: Icons.stars_rounded,
                    color: AppColors.warningOrange,
                    description:
                        'Buka menu "Riwayat Bulan Ini" untuk memastikan setoran timbangan terdata. Nilai KPI Anda akan otomatis meningkat setiap kali setoran terakumulasi.',
                    tips: 'Tips: Pertahankan KPI di atas 90 untuk menjaga predikat Kinerja Baik.',
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // Bottom Action Button Responsif dengan SafeArea
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Saya Mengerti & Siap Bertugas',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard({
    required String stepNumber,
    required String title,
    required IconData icon,
    required Color color,
    required String description,
    required String tips,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundCanvas,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    stepNumber,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Icon(icon, color: color, size: 22),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline_rounded, color: color, size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    tips,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

