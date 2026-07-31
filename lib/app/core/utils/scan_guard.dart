import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../modules/scan/controllers/scan_controller.dart';
import '../../data/models/bin_entity.dart';
import '../../routes/app_routes.dart';
import '../values/app_colors.dart';

class ScanGuard {
  static void handleScanNavigation(BuildContext context, WidgetRef ref) {
    final bins = ref.read(binsProvider).value ?? [];
    final hasOrganic = bins.any((b) => b.binType == WasteType.organic && b.isActive);
    final hasNonOrganic = bins.any((b) => b.binType == WasteType.nonOrganic && b.isActive);
    
    final isAnyBinFull = bins.any((b) => b.isActive && b.currentVolumeL >= b.maxCapacityL);

    if (isAnyBinFull) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_rounded, color: AppColors.dangerRed),
              SizedBox(width: 8),
              Text(
                'Tong Penuh',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          content: const Text(
            'Salah satu tempat sampah Anda sudah penuh (100%). Anda tidak dapat melakukan setor sampah sebelum mengajukan pengosongan tong.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textHint)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushNamed(context, AppRoutes.resetBin);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Ajukan Pengosongan', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else if (!hasOrganic || !hasNonOrganic) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.warningOrange),
              SizedBox(width: 8),
              Text(
                'Tong Sampah Belum Diaktivasi',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
              ),
            ],
          ),
          content: const Text(
            'Anda belum mengaktivasi tong sampah milik Anda! Silakan ukur & aktivasi tong sampah terlebih dahulu sebelum dapat menyetor sampah.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textHint)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushNamed(context, AppRoutes.ukurKapasitas);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Aktivasi & Ukur Sekarang', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      Navigator.pushNamed(context, AppRoutes.scan);
    }
  }
}
