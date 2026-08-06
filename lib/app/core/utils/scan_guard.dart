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

    if (!hasOrganic || !hasNonOrganic) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text(
            'Bin Belum Lengkap',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          content: const Text(
            'Anda harus memiliki Bin Organik dan Anorganik yang diukur dan diaktivasi sebelum dapat melakukan setor sampah.',
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
              child: const Text('Ukur & Aktivasi Sekarang', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      Navigator.pushNamed(context, AppRoutes.scan);
    }
  }
}
