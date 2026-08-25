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
  final String searchQuery;

  const KetersediaanQrState({
    this.isLoading = false,
    this.errorMessage,
    this.allItems = const [],
    this.items = const [],
    this.selectedCategory = 'Semua',
    this.searchQuery = '',
  });

  KetersediaanQrState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<dynamic>? allItems,
    List<dynamic>? items,
    String? selectedCategory,
    String? searchQuery,
    bool clearError = false,
  }) {
    return KetersediaanQrState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      allItems: allItems ?? this.allItems,
      items: items ?? this.items,
      selectedCategory: selectedCategory ?? this.selectedCategory,
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
      final data = await binRepo.getUnusedBins(); // Fetch ALL printed bins
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
        final categoryName = item['category']?['name']?.toString() ?? '';
        return categoryName.toLowerCase() == state.selectedCategory.toLowerCase();
      }).toList();
    }

    if (state.searchQuery.isNotEmpty) {
      final query = state.searchQuery.toLowerCase();
      filtered = filtered.where((item) {
        final qrCode = item['qrCode']?.toString().toLowerCase() ?? '';
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

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    _applyFilters();
  }

  Future<void> exportToPdf() async {
    if (state.items.isEmpty) return;

    state = state.copyWith(isLoading: true);
    try {
      final pdf = pw.Document();
      // Ukuran 10cm x 15cm
      final pageFormat = PdfPageFormat(100 * PdfPageFormat.mm, 150 * PdfPageFormat.mm, marginAll: 5 * PdfPageFormat.mm);

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
                childAspectRatio: 1.0,
                crossAxisSpacing: 5 * PdfPageFormat.mm,
                mainAxisSpacing: 5 * PdfPageFormat.mm,
                children: chunk.map((item) {
                  final qrCodeStr = item['qrCode']?.toString() ?? 'UNKNOWN';
                  final typeLabel = item['category']?['name']?.toString() ?? 'Unknown';
                  return pw.Container(
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 1),
                    ),
                    padding: const pw.EdgeInsets.all(4),
                    child: pw.Column(
                      mainAxisAlignment: pw.MainAxisAlignment.center,
                      children: [
                        pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: qrCodeStr,
                          width: 40 * PdfPageFormat.mm,
                          height: 40 * PdfPageFormat.mm,
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          qrCodeStr,
                          style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.Text(
                          typeLabel,
                          style: const pw.TextStyle(fontSize: 6),
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
