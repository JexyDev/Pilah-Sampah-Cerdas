import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

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
                  final typeLabel = rawCat.contains('ANORGANIK') || rawCat.contains('NON')
                      ? 'Anorganik'
                      : (rawCat.contains('RESIDU') || rawCat.contains('RSD') ? 'Residu' : 'Organik');
                  return pw.Container(
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 1),
                    ),
                    padding: const pw.EdgeInsets.all(8),
                    child: pw.Column(
                      mainAxisAlignment: pw.MainAxisAlignment.center,
                      children: [
                        pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: qrCodeStr,
                          width: 30 * PdfPageFormat.mm,
                          height: 30 * PdfPageFormat.mm,
                        ),
                        pw.SizedBox(height: 8),
                        pw.Text(
                          qrCodeStr,
                          style: const pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                          textAlign: pw.TextAlign.center,
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          typeLabel,
                          style: const pw.TextStyle(fontSize: 6),
                          textAlign: pw.TextAlign.center,
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
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/Ketersediaan_QR.pdf');
      await file.writeAsBytes(bytes);

      state = state.copyWith(isLoading: false);
      
      // Share PDF
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
