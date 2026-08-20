import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/values/app_colors.dart';

/// Helper untuk menampilkan Rating Dialog (1-5 Bintang) hanya SATU KALI per fitur pertama kali berhasil.
Future<void> showFeatureRatingOnceIfNeeded({
  required BuildContext context,
  required String featureKey,
  required String featureTitle,
  required String featureSubtitle,
  String? roleTag,
}) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final hasRated = prefs.getBool('has_rated_$featureKey') ?? false;
    if (hasRated) return;

    // Tandai sudah pernah menampilkan agar tidak pernah muncul lagi
    await prefs.setBool('has_rated_$featureKey', true);

    if (!context.mounted) return;

    await showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogCtx) => FeatureRatingDialog(
        featureKey: featureKey,
        featureTitle: featureTitle,
        featureSubtitle: featureSubtitle,
        roleTag: roleTag,
      ),
    );
  } catch (e) {
    debugPrint('[FeatureRatingDialog] Error checking rating status: $e');
  }
}

class FeatureRatingDialog extends StatefulWidget {
  const FeatureRatingDialog({
    super.key,
    required this.featureKey,
    required this.featureTitle,
    required this.featureSubtitle,
    this.roleTag,
  });

  final String featureKey;
  final String featureTitle;
  final String featureSubtitle;
  final String? roleTag;

  @override
  State<FeatureRatingDialog> createState() => _FeatureRatingDialogState();
}

class _FeatureRatingDialogState extends State<FeatureRatingDialog> {
  int _selectedRating = 5;
  final TextEditingController _feedbackController = TextEditingController();
  bool _isSubmitted = false;

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  String _getRatingLabel(int rating) {
    switch (rating) {
      case 1:
        return 'Sangat Kurang 😞';
      case 2:
        return 'Kurang Puas 😐';
      case 3:
        return 'Cukup Baik 🙂';
      case 4:
        return 'Memuaskan! 😊';
      case 5:
      default:
        return 'Luar Biasa Sempurna! 🤩';
    }
  }

  Color _getRatingColor(int rating) {
    switch (rating) {
      case 1:
        return AppColors.dangerRed;
      case 2:
        return Colors.orange;
      case 3:
        return AppColors.warningYellow;
      case 4:
        return const Color(0xFF10B981);
      case 5:
      default:
        return const Color(0xFF009966);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ─── Top Icon & Role Badge ──────────────────────────────
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFDE68A),
                      width: 2,
                    ),
                  ),
                  child: const Icon(
                    Icons.star_rounded,
                    size: 40,
                    color: Color(0xFFF59E0B),
                  ),
                ),
                if (widget.roleTag != null)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        widget.roleTag!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Judul & Subjudul ──────────────────────────────────
            Text(
              widget.featureTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.featureSubtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 20),

            // ─── 1-5 Star Picker ───────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.backgroundCanvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final starValue = index + 1;
                      final isSelected = starValue <= _selectedRating;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedRating = starValue;
                          });
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: AnimatedScale(
                            scale: isSelected ? 1.15 : 1.0,
                            duration: const Duration(milliseconds: 150),
                            child: Icon(
                              Icons.star_rounded,
                              size: 38,
                              color: isSelected
                                  ? const Color(0xFFF59E0B)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 8),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      _getRatingLabel(_selectedRating),
                      key: ValueKey<int>(_selectedRating),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _getRatingColor(_selectedRating),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC), // Subtle light background
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: TextField(
                controller: _feedbackController,
                maxLines: 3,
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Bagikan pengalaman atau saran perbaikan (opsional)',
                  hintStyle: TextStyle(fontSize: 12, color: AppColors.textHint),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(14),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ─── Tombol Aksi ───────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.border),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Nanti Saja', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitted
                        ? null
                        : () async {
                            setState(() => _isSubmitted = true);
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Terima kasih atas penilaian $_selectedRating bintang Anda! ⭐',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                backgroundColor: AppColors.primaryGreen,
                                duration: const Duration(seconds: 3),
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Kirim Nilai', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
