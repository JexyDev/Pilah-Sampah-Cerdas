import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'package:printing/printing.dart';
import '../../../../app/data/providers/repository_providers.dart';

class KetersediaanQrState {
  final bool isLoading;
  final String? errorMessage;
  final List<dynamic> allItems;
  final List<dynamic> items;
  final Set<String> selectedItems;
  final String selectedCategory;
  final String selectedStatus;
  final String searchQuery;

  const KetersediaanQrState({
    this.isLoading = false,
    this.errorMessage,
    this.allItems = const [],
    this.items = const [],
    this.selectedItems = const {},
    this.selectedCategory = 'Semua',
    this.selectedStatus = 'Semua Status',
    this.searchQuery = '',
  });

  KetersediaanQrState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<dynamic>? allItems,
    List<dynamic>? items,
    Set<String>? selectedItems,
    String? selectedCategory,
    String? selectedStatus,
    String? searchQuery,
    bool clearError = false,
  }) {
    return KetersediaanQrState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      allItems: allItems ?? this.allItems,
      items: items ?? this.items,
      selectedItems: selectedItems ?? this.selectedItems,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class KetersediaanQrController extends StateNotifier<KetersediaanQrState> {
  final Ref ref;

  KetersediaanQrController(this.ref) : super(const KetersediaanQrState()) {
    fetchData();
  }

  Future<void> fetchData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final binRepo = ref.read(binRepositoryProvider);
      final data = await binRepo.getAllQrBins(); // Fetch ALL bins
      state = state.copyWith(allItems: data);
      _applyFilters();
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void toggleSelection(String qrCode) {
    final newSelection = Set<String>.from(state.selectedItems);
    if (newSelection.contains(qrCode)) {
      newSelection.remove(qrCode);
    } else {
      newSelection.add(qrCode);
    }
    state = state.copyWith(selectedItems: newSelection);
  }

  void clearSelection() {
    state = state.copyWith(selectedItems: {});
  }

  void _applyFilters() {
    List<dynamic> filtered = state.allItems;
    
    if (state.selectedCategory != 'Semua') {
      filtered = filtered.where((item) {
        final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();
        final selUpper = state.selectedCategory.toUpperCase();
        if (selUpper == 'ORGANIK' || selUpper == 'ORGANIC') {
          return rawCat.contains('ORGAN') && !rawCat.contains('ANORGANIK') && !rawCat.contains('NON');
        }
        if (selUpper.contains('ANORGANIK') || selUpper == 'NON_ORGANIC') {
          return rawCat.contains('ANORGANIK') || rawCat.contains('NON');
        }
        return rawCat.contains(selUpper);
      }).toList();
    }

    if (state.selectedStatus != 'Semua Status') {
      filtered = filtered.where((item) {
        final statusBin = item['status']?.toString().toUpperCase() ?? 'PRINTED';
        final isUsed = statusBin != 'PRINTED' && statusBin != 'TERSEDIA';
        if (state.selectedStatus == 'Tersedia') return !isUsed;
        if (state.selectedStatus == 'Digunakan') return isUsed;
        return true;
      }).toList();
    }

    if (state.searchQuery.isNotEmpty) {
      final query = state.searchQuery.toLowerCase();
      filtered = filtered.where((item) {
        final qrCode = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').toLowerCase();
        return qrCode.contains(query);
      }).toList();
    }

    state = state.copyWith(isLoading: false, items: filtered);
  }

  void setFilter(String category) {
    if (state.selectedCategory == category) return;
    state = state.copyWith(selectedCategory: category);
    _applyFilters();
  }

  void setStatusFilter(String status) {
    if (state.selectedStatus == status) return;
    state = state.copyWith(selectedStatus: status);
    _applyFilters();
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    _applyFilters();
  }

  Future<void> exportData({bool asImage = false}) async {
    if (state.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Tidak ada data QR Code untuk dicetak.');
      return;
    }

    final itemsToExport = state.selectedItems.isNotEmpty
        ? state.items.where((item) {
            final rawQr = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').trim();
            final qrCodeStr = rawQr.isNotEmpty ? rawQr : 'BSK-OGN-250826-0001';
            return state.selectedItems.contains(qrCodeStr);
          }).toList()
        : state.items;

    if (itemsToExport.isEmpty) {
      state = state.copyWith(errorMessage: 'Tidak ada QR Code yang dipilih.');
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final pdf = pw.Document();
      // Ukuran Resolusi Asli 1182 x 1772 px -> kita set sebagai point PDF
      const pageFormat = PdfPageFormat(1182, 1772, marginAll: 0);

      // Load Template Images
      final ByteData organicData = await rootBundle.load('assets/images/qr_template_organik.png');
      final organicImage = pw.MemoryImage(organicData.buffer.asUint8List());

      final ByteData anorganicData = await rootBundle.load('assets/images/qr_template_anorganik.png');
      final anorganicImage = pw.MemoryImage(anorganicData.buffer.asUint8List());

      // Generate 1 Poster Resmi per QR Code Item
      for (final item in itemsToExport) {
        final rawQr = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').trim();
        final qrCodeStr = rawQr.isNotEmpty ? rawQr : 'BSK-OGN-250826-0001';
        final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();

        final isAnorganik = rawCat.contains('ANORGANIK') || rawCat.contains('NON') || rawCat.contains('AGN') || qrCodeStr.toUpperCase().contains('-AGN-');

        final formattedSerialCode = (() {
          if (qrCodeStr.startsWith('BSK-') || qrCodeStr.startsWith('TC-')) return qrCodeStr;
          final tag = isAnorganik ? 'AGN' : 'OGN';
          final digits = qrCodeStr.replaceAll(RegExp(r'\D'), '');
          final seq = digits.isNotEmpty ? digits.substring(digits.length > 4 ? digits.length - 4 : 0).padLeft(4, '0') : '0001';
          return 'BSK-$tag-250826-$seq';
        })();

        final bgImage = isAnorganik ? anorganicImage : organicImage;

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
                              formattedSerialCode,
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
                              formattedSerialCode,
                              style: const pw.TextStyle(
                                fontSize: 36,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColors.white,
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

      final bytes = await pdf.save();
      final dir = await getTemporaryDirectory();
      
      final filesToShare = <XFile>[];
      
      if (asImage) {
        var index = 0;
        await for (final page in Printing.raster(bytes, dpi: 72)) {
          final pngBytes = await page.toPng();
          final file = File('${dir.path}/QR_Poster_$index.png');
          await file.writeAsBytes(pngBytes);
          filesToShare.add(XFile(file.path, mimeType: 'image/png'));
          index++;
        }
      } else {
        final file = File('${dir.path}/Ketersediaan_QR.pdf');
        await file.writeAsBytes(bytes);
        filesToShare.add(XFile(file.path, mimeType: 'application/pdf'));
      }

      state = state.copyWith(isLoading: false);
      
      if (filesToShare.isNotEmpty) {
        await Share.shareXFiles(filesToShare, text: 'Poster Resmi QR Code BERSEKA');
      }
      
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal mengekspor: $e');
    }
  }
}

final ketersediaanQrProvider = StateNotifierProvider<KetersediaanQrController, KetersediaanQrState>((ref) {
  return KetersediaanQrController(ref);
});
