import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../controllers/aktivasi_warga_controller.dart';

class AktivasiWargaView extends ConsumerStatefulWidget {
  const AktivasiWargaView({super.key});

  @override
  ConsumerState<AktivasiWargaView> createState() => _AktivasiWargaViewState();
}

class _AktivasiWargaViewState extends ConsumerState<AktivasiWargaView> {
  int _step = 1;
  String _binOrganikId = '';
  String _binAnorganikId = '';

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final warga = args?['warga'] as Map<String, dynamic>?;
    final wargaId = warga?['id']?.toString() ?? '';
    final wargaName = warga?['name']?.toString() ?? 'Warga';

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('Aktivasi Bin: $wargaName', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppDimensions.md),
            color: Colors.black,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: _step == 2 ? AppColors.primaryGreen : Colors.grey[800],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md),
            child: Text(
              _step == 1 ? 'Tahap 1: Scan QR Bin Organik' : 'Tahap 2: Scan QR Bin Anorganik',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: AppDimensions.md),
          Expanded(
            child: QrScannerWidget(
              key: ValueKey(_step),
              hint: 'Arahkan kamera ke QR Code',
              overlayColor: _step == 1 ? AppColors.primaryGreen : AppColors.primaryBlueDark,
              onQrDetected: (qrCode) async {
                if (_step == 1) {
                  setState(() {
                    _binOrganikId = qrCode;
                    _step = 2;
                  });
                  return true;
                } else {
                  setState(() {
                    _binAnorganikId = qrCode;
                  });
                  // Submit
                  final success = await ref.read(aktivasiWargaProvider.notifier).activateBin(wargaId, _binOrganikId, _binAnorganikId);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Aktivasi 2 Bin berhasil!')),
                    );
                    Navigator.pop(context);
                  } else if (mounted) {
                    // Retry step 2
                    setState(() {
                      _binAnorganikId = '';
                    });
                  }
                  return success;
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
