import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../data/models/kelompok_qr_models.dart';
import '../../../data/providers/repository_providers.dart';
import 'kelompok_kkn_controller.dart';

class KelompokStikerQrState {
  final bool isLoading;
  final String? errorMessage;
  final KelompokQrData? qrData;
  final String selectedFilter; // 'ALL', 'ORGANIK', 'ANORGANIK'
  final String selectedStatus; // 'ALL', 'AVAILABLE', 'BOUND'
  final String selectedRw; // 'ALL', '01', '02', dst

  KelompokStikerQrState({
    this.isLoading = false,
    this.errorMessage,
    this.qrData,
    this.selectedFilter = 'ALL',
    this.selectedStatus = 'ALL',
    this.selectedRw = 'ALL',
  });

  KelompokStikerQrState copyWith({
    bool? isLoading,
    String? errorMessage,
    KelompokQrData? qrData,
    String? selectedFilter,
    String? selectedStatus,
    String? selectedRw,
    bool clearError = false,
  }) {
    return KelompokStikerQrState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      qrData: qrData ?? this.qrData,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      selectedRw: selectedRw ?? this.selectedRw,
    );
  }

  List<StikerQrItem> get filteredItems {
    if (qrData == null) return [];
    var items = qrData!.items;

    // 1. Filter Kategori Sampah
    if (selectedFilter == 'ORGANIK') {
      items = items
          .where((item) => item.jenis.toUpperCase() == 'ORGANIK')
          .toList();
    } else if (selectedFilter == 'ANORGANIK') {
      items = items
          .where((item) => item.jenis.toUpperCase() == 'ANORGANIK')
          .toList();
    }

    // 2. Filter Status Penggunaan
    if (selectedStatus == 'AVAILABLE') {
      items = items.where((item) => item.isAvailable).toList();
    } else if (selectedStatus == 'BOUND') {
      items = items.where((item) => !item.isAvailable).toList();
    }

    // 3. Filter Wilayah RW (untuk Kelompok Multi-RW)
    if (selectedRw != 'ALL') {
      final cleanTargetRw = selectedRw
          .replaceAll(RegExp(r'[^\d]'), '')
          .replaceFirst(RegExp(r'^0+'), '');
      items = items.where((item) {
        if (item.isAvailable) {
          // Stiker tersedia adalah pool bersama kelompok, valid untuk seluruh RW kelompok
          return true;
        }
        final itemRw = item.wargaRw
            ?.replaceAll(RegExp(r'[^\d]'), '')
            .replaceFirst(RegExp(r'^0+'), '');
        if (itemRw != null && itemRw.isNotEmpty) {
          return itemRw == cleanTargetRw;
        }
        final addr = (item.terikatWarga?.alamat ?? '').toLowerCase();
        return addr.contains('rw $cleanTargetRw') ||
            addr.contains('rw 0$cleanTargetRw');
      }).toList();
    }

    // Untuk tampilan 'ALL' kategori & 'ALL' status: Susun berpasangan
    // (1 Organik [Hijau] & 1 Anorganik [Kuning]) agar serasi
    if (selectedFilter == 'ALL' && selectedStatus == 'ALL') {
      final organiks = items
          .where((item) => item.jenis.toUpperCase() == 'ORGANIK')
          .toList();
      final anorganiks = items
          .where((item) => item.jenis.toUpperCase() == 'ANORGANIK')
          .toList();

      final List<StikerQrItem> paired = [];
      final maxLen = organiks.length > anorganiks.length
          ? organiks.length
          : anorganiks.length;

      for (int i = 0; i < maxLen; i++) {
        if (i < organiks.length) paired.add(organiks[i]);
        if (i < anorganiks.length) paired.add(anorganiks[i]);
      }
      return paired;
    }

    return items;
  }
}

class KelompokStikerQrController extends StateNotifier<KelompokStikerQrState> {
  KelompokStikerQrController(this.ref) : super(KelompokStikerQrState()) {
    loadData();
  }

  final Ref ref;

  Future<void> loadData({String? explicitKelompokId}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      String? targetKelompokId = explicitKelompokId;
      if (targetKelompokId == null || targetKelompokId.isEmpty) {
        var kelompok = ref.read(kelompokKknProvider).kelompok;
        if (kelompok == null) {
          // Tunggu / fetch data kelompok jika belum ada di state
          await ref.read(kelompokKknProvider.notifier).fetchKelompok();
          kelompok = ref.read(kelompokKknProvider).kelompok;
        }
        targetKelompokId = kelompok?.groupId;
      }

      final repository = ref.read(kknRepositoryProvider);
      final response = await repository.getKelompokQrCodes(
        kelompokId: (targetKelompokId != null && targetKelompokId.isNotEmpty)
            ? targetKelompokId
            : null,
      );

      state = state.copyWith(isLoading: false, qrData: response.data);
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

  void setStatusFilter(String status) {
    state = state.copyWith(selectedStatus: status);
  }

  void setRwFilter(String rw) {
    state = state.copyWith(selectedRw: rw);
  }

  Future<void> exportData() async {
    final itemsToExport = state.qrData?.items ?? [];
    if (itemsToExport.isEmpty) {
      state = state.copyWith(
        errorMessage: 'Tidak ada data QR Code untuk dicetak.',
      );
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final pdf = pw.Document();
      const pageFormat = PdfPageFormat(1182, 1772, marginAll: 0);

      final ByteData organicData = await rootBundle.load(
        'assets/images/qr_template_organik.png',
      );
      final organicImage = pw.MemoryImage(organicData.buffer.asUint8List());

      final ByteData anorganicData = await rootBundle.load(
        'assets/images/qr_template_anorganik.png',
      );
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
      final kelompokName =
          state.qrData?.kelompok.nama
              .replaceAll(RegExp(r'[^\w\s]+'), '')
              .replaceAll(' ', '_') ??
          'Kelompok';
      final file = File(
        '${output.path}/Stiker_BERSEKA_10x15cm_$kelompokName.pdf',
      );
      await file.writeAsBytes(await pdf.save());

      state = state.copyWith(isLoading: false);

      await Share.shareXFiles(
        [XFile(file.path)],
        text:
            'File Cetak Stiker QR Code (10x15cm) - ${state.qrData?.kelompok.nama}',
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal membuat file PDF: $e',
      );
    }
  }
}

final kelompokStikerQrProvider =
    StateNotifierProvider<KelompokStikerQrController, KelompokStikerQrState>((
      ref,
    ) {
      return KelompokStikerQrController(ref);
    });
