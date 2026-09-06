import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../data/models/kelompok_qr_models.dart';
import '../../../data/providers/repository_providers.dart';

class KelompokStikerQrState {
  final bool isLoading;
  final String? errorMessage;
  final KelompokQrData? qrData;
  final String selectedFilter; // 'ALL', 'ORGANIK', 'ANORGANIK'

  KelompokStikerQrState({
    this.isLoading = false,
    this.errorMessage,
    this.qrData,
    this.selectedFilter = 'ALL',
  });

  KelompokStikerQrState copyWith({
    bool? isLoading,
    String? errorMessage,
    KelompokQrData? qrData,
    String? selectedFilter,
    bool clearError = false,
  }) {
    return KelompokStikerQrState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      qrData: qrData ?? this.qrData,
      selectedFilter: selectedFilter ?? this.selectedFilter,
    );
  }

  List<StikerQrItem> get filteredItems {
    if (qrData == null) return [];
    final items = qrData!.items;
    if (selectedFilter == 'ALL') return items;
    return items.where((item) => item.jenis.toUpperCase() == selectedFilter).toList();
  }
}

class KelompokStikerQrController extends StateNotifier<KelompokStikerQrState> {
  KelompokStikerQrController(this.ref) : super(KelompokStikerQrState()) {
    loadData();
  }

  final Ref ref;

  Future<void> loadData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final response = await repository.getKelompokQrCodes();
      
      state = state.copyWith(
        isLoading: false,
        qrData: response.data,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  void setFilter(String filter) {
    state = state.copyWith(selectedFilter: filter);
  }

  Future<void> exportData() async {
    final itemsToExport = state.qrData?.items ?? [];
    if (itemsToExport.isEmpty) {
      state = state.copyWith(errorMessage: 'Tidak ada data QR Code untuk dicetak.');
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final pdf = pw.Document();
      const pageFormat = PdfPageFormat(1182, 1772, marginAll: 0);

      final ByteData organicData = await rootBundle.load('assets/images/qr_template_organik.png');
      final organicImage = pw.MemoryImage(organicData.buffer.asUint8List());

      final ByteData anorganicData = await rootBundle.load('assets/images/qr_template_anorganik.png');
      final anorganicImage = pw.MemoryImage(anorganicData.buffer.asUint8List());

      for (final item in itemsToExport) {
        final isAnorganik = item.jenis.toUpperCase() == 'ANORGANIK';
        final bgImage = isAnorganik ? anorganicImage : organicImage;
        final qrCodeStr = item.qrCode;

        pdf.addPage(
          pw.Page(
            pageFormat: pageFormat,
            build: (pw.Context context) {
              return pw.Stack(
                children: [
                  pw.Positioned.fill(
                    child: pw.Image(bgImage, fit: pw.BoxFit.fill),
                  ),
                  pw.Positioned(
                    left: 177.5,
                    top: 1250.0,
                    child: pw.BarcodeWidget(
                      barcode: pw.Barcode.qrCode(),
                      data: qrCodeStr,
                      width: 375,
                      height: 375,
                      color: PdfColors.black,
                      backgroundColor: PdfColors.white,
                    ),
                  ),
                  if (isAnorganik)
                    pw.Positioned(
                      left: 632,
                      top: 1618,
                      child: pw.SizedBox(
                        width: 403,
                        height: 47,
                        child: pw.Center(
                          child: pw.FittedBox(
                            fit: pw.BoxFit.scaleDown,
                            child: pw.Text(
                              qrCodeStr,
                              style: const pw.TextStyle(
                                fontSize: 32,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColors.black,
                              ),
                            ),
                          ),
                        ),
                      ),
                    )
                  else
                    pw.Positioned(
                      left: 648,
                      top: 1585,
                      child: pw.SizedBox(
                        width: 446,
                        height: 53,
                        child: pw.Center(
                          child: pw.FittedBox(
                            fit: pw.BoxFit.scaleDown,
                            child: pw.Text(
                              qrCodeStr,
                              style: const pw.TextStyle(
                                fontSize: 36,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColors.black,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        );
      }

      final output = await getTemporaryDirectory();
      final kelompokName = state.qrData?.kelompok.nama.replaceAll(RegExp(r'[^\w\s]+'), '').replaceAll(' ', '_') ?? 'Kelompok';
      final file = File('${output.path}/Stiker_BERSEKA_10x15cm_$kelompokName.pdf');
      await file.writeAsBytes(await pdf.save());

      state = state.copyWith(isLoading: false);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'File Cetak Stiker QR Code (10x15cm) - ${state.qrData?.kelompok.nama}',
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal membuat file PDF: $e',
      );
    }
  }
}

final kelompokStikerQrProvider = StateNotifierProvider<KelompokStikerQrController, KelompokStikerQrState>((ref) {
  return KelompokStikerQrController(ref);
});
