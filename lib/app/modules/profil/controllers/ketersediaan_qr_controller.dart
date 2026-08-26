import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:printing/printing.dart';
import '../../../../app/data/providers/repository_providers.dart';

class KetersediaanQrState {
  final bool isLoading;
  final String? errorMessage;
  final List<dynamic> allItems;
  final List<dynamic> items;
  final String selectedCategory;
  final String selectedStatus;
  final String searchQuery;

  const KetersediaanQrState({
    this.isLoading = false,
    this.errorMessage,
    this.allItems = const [],
    this.items = const [],
    this.selectedCategory = 'Semua',
    this.selectedStatus = 'Semua Status',
    this.searchQuery = '',
  });

  KetersediaanQrState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<dynamic>? allItems,
    List<dynamic>? items,
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

  void _applyFilters() {
    List<dynamic> filtered = state.allItems;
    
    if (state.selectedCategory != 'Semua') {
      filtered = filtered.where((item) {
        final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();
        final selUpper = state.selectedCategory.toUpperCase();
        if (selUpper.contains('ORGANIK') || selUpper == 'ORGANIC') {
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

  Future<void> exportToPdf() async {
    if (state.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Tidak ada data QR Code untuk dicetak.');
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final pdf = pw.Document();
      // Ukuran 10cm x 15cm
      const pageFormat = PdfPageFormat(100 * PdfPageFormat.mm, 150 * PdfPageFormat.mm, marginAll: 5 * PdfPageFormat.mm);

      // Chunk items (6 item per halaman - grid 2x3)
      const itemsPerPage = 6;
      for (var i = 0; i < state.items.length; i += itemsPerPage) {
        final chunk = state.items.sublist(
          i,
          i + itemsPerPage > state.items.length ? state.items.length : i + itemsPerPage,
        );

        pdf.addPage(
          pw.Page(
            pageFormat: pageFormat,
            build: (pw.Context context) {
              return pw.GridView(
                crossAxisCount: 2,
                childAspectRatio: 0.75, // Beri ruang lebih vertikal agar tidak overflow
                crossAxisSpacing: 5 * PdfPageFormat.mm,
                mainAxisSpacing: 5 * PdfPageFormat.mm,
                children: chunk.map((item) {
                  final rawQr = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').trim();
                  final qrCodeStr = rawQr.isNotEmpty ? rawQr : 'BSK-OGN-250826-0001';
                  final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();
                  
                  final isOrganik = rawCat.contains('ORGAN') && !rawCat.contains('ANORGANIK') && !rawCat.contains('NON');
                  final isAnorganik = rawCat.contains('ANORGANIK') || rawCat.contains('NON');
                  final isResidu = rawCat.contains('RESIDU') || rawCat.contains('RSD');
                  
                  final typeLabel = isAnorganik ? 'Anorganik' : (isResidu ? 'Residu' : 'Organik');
                  
                  // Color Themes (matching Web MasterQrManager)
                  final colorTheme = isOrganik 
                      ? PdfColor.fromHex('#10b981') 
                      : (isAnorganik ? PdfColor.fromHex('#3b82f6') : PdfColor.fromHex('#ef4444'));
                  final labelBg = isOrganik 
                      ? PdfColor.fromHex('#ecfdf5') 
                      : (isAnorganik ? PdfColor.fromHex('#eff6ff') : PdfColor.fromHex('#fef2f2'));
                      
                  final rwStr = item['rw']?.toString() ?? '';
                  final kelStr = item['kelurahan']?.toString() ?? '';
                  final detailStr = (rwStr.isNotEmpty && kelStr.isNotEmpty)
                      ? '$rwStr - Kel. $kelStr'
                      : 'BERSEKA Batch QR';

                  return pw.Container(
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: colorTheme, width: 2),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(10)),
                    ),
                    child: pw.Column(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: pw.CrossAxisAlignment.center,
                      children: [
                        // Header Banner (BERSEKA PSC)
                        pw.Container(
                          width: double.infinity,
                          color: colorTheme,
                          padding: const pw.EdgeInsets.symmetric(vertical: 3),
                          child: pw.Text(
                            'BERSEKA PSC',
                            style: const pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 7,
                              fontWeight: pw.FontWeight.bold,
                            ),
                            textAlign: pw.TextAlign.center,
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        // Barcode QR Code Image
                        pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: qrCodeStr,
                          width: 25 * PdfPageFormat.mm,
                          height: 25 * PdfPageFormat.mm,
                        ),
                        pw.SizedBox(height: 4),
                        // QR Code Text
                        pw.Text(
                          qrCodeStr,
                          style: pw.TextStyle(
                            fontSize: 7, 
                            fontWeight: pw.FontWeight.bold,
                            color: colorTheme,
                          ),
                          textAlign: pw.TextAlign.center,
                        ),
                        // Category Badge / Pill
                        pw.Container(
                          decoration: pw.BoxDecoration(
                            color: labelBg,
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                          ),
                          padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          margin: const pw.EdgeInsets.symmetric(vertical: 2),
                          child: pw.Text(
                            typeLabel.toUpperCase(),
                            style: pw.TextStyle(
                              fontSize: 5.5,
                              fontWeight: pw.FontWeight.bold,
                              color: colorTheme,
                            ),
                          ),
                        ),
                        // Detail Wilayah Footer
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(bottom: 4, left: 2, right: 2),
                          child: pw.Text(
                            detailStr,
                            style: const pw.TextStyle(
                              fontSize: 5,
                              color: PdfColors.grey700,
                            ),
                            textAlign: pw.TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),
        );
      }

      final bytes = await pdf.save();
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/Ketersediaan_QR.pdf');
      await file.writeAsBytes(bytes);

      state = state.copyWith(isLoading: false);
      
      // Layout & preview PDF via native printing dialog
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => bytes,
        name: 'Ketersediaan_QR.pdf',
      );

      // Fallback share file
      final xFile = XFile(file.path, mimeType: 'application/pdf');
      await Share.shareXFiles([xFile], text: 'Dokumen Ketersediaan QR');
      
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal mengekspor PDF: $e');
    }
  }
}

final ketersediaanQrProvider = StateNotifierProvider<KetersediaanQrController, KetersediaanQrState>((ref) {
  return KetersediaanQrController(ref);
});
