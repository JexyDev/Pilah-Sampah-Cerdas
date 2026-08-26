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

  static pw.Widget _buildLogoPill(String title, PdfColor themeColor, PdfColor textColor) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 2),
      decoration: pw.BoxDecoration(
        color: themeColor,
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
      ),
      child: pw.Text(
        title,
        style: pw.TextStyle(
          fontSize: 3.5,
          fontWeight: pw.FontWeight.bold,
          color: textColor,
        ),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  static pw.Widget _buildBenefitItem(String icon, String label, PdfColor themeColor, PdfColor textColor) {
    return pw.Column(
      children: [
        pw.Container(
          width: 14,
          height: 14,
          decoration: pw.BoxDecoration(
            color: themeColor,
            shape: pw.BoxShape.circle,
          ),
          child: pw.Center(
            child: pw.Text(icon, style: const pw.TextStyle(fontSize: 7)),
          ),
        ),
        pw.SizedBox(height: 1),
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 4,
            fontWeight: pw.FontWeight.bold,
            color: PdfColors.black,
          ),
          textAlign: pw.TextAlign.center,
        ),
      ],
    );
  }

  Future<void> exportToPdf() async {
    if (state.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Tidak ada data QR Code untuk dicetak.');
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final pdf = pw.Document();
      // Ukuran Resmi Poster (10cm x 15cm / 100mm x 150mm 1:1)
      const pageFormat = PdfPageFormat(100 * PdfPageFormat.mm, 150 * PdfPageFormat.mm, marginAll: 0);

      // Generate 1 Poster Resmi per QR Code Item
      for (final item in state.items) {
        final rawQr = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').trim();
        final qrCodeStr = rawQr.isNotEmpty ? rawQr : 'BSK-OGN-250826-0001';
        final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();

        final isAnorganik = rawCat.contains('ANORGANIK') || rawCat.contains('NON') || rawCat.contains('AGN') || qrCodeStr.toUpperCase().contains('-AGN-');
        final catTitle = isAnorganik ? 'ANORGANIK' : 'ORGANIK';
        final catDesc = isAnorganik
            ? 'Untuk sampah anorganik seperti plastik, kaleng, kaca, logam, dan bahan sintetis lainnya.'
            : 'Untuk sampah organik dari sisa makanan, daun, ranting, dan bahan alami lainnya.';

        final formattedSerialCode = (() {
          if (qrCodeStr.startsWith('BSK-') || qrCodeStr.startsWith('TC-')) return qrCodeStr;
          final tag = isAnorganik ? 'AGN' : 'OGN';
          final digits = qrCodeStr.replaceAll(RegExp(r'\D'), '');
          final seq = digits.isNotEmpty ? digits.substring(digits.length > 4 ? digits.length - 4 : 0).padLeft(4, '0') : '0001';
          return 'BSK-$tag-250826-$seq';
        })();

        // Warna Tema Resmi Web (Yellow #FFC20E vs Green #006837)
        final themeColor = isAnorganik ? PdfColor.fromHex('#FFC20E') : PdfColor.fromHex('#006837');
        final headerTextColor = isAnorganik ? PdfColors.black : PdfColors.white;

        pdf.addPage(
          pw.Page(
            pageFormat: pageFormat,
            build: (pw.Context context) {
              return pw.Container(
                width: 100 * PdfPageFormat.mm,
                height: 150 * PdfPageFormat.mm,
                padding: const pw.EdgeInsets.all(3 * PdfPageFormat.mm),
                decoration: pw.BoxDecoration(
                  color: PdfColors.white,
                  border: pw.Border.all(color: themeColor, width: 4 * PdfPageFormat.mm),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
                ),
                child: pw.Column(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    // Header Section
                    pw.Column(
                      children: [
                        pw.Text(
                          'BERSEKA',
                          style: pw.TextStyle(
                            fontSize: 16,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.black,
                          ),
                        ),
                        pw.SizedBox(height: 1),
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.center,
                          children: [
                            pw.Container(width: 12, height: 1, color: PdfColor.fromHex('#cbd5e1')),
                            pw.Padding(
                              padding: const pw.EdgeInsets.symmetric(horizontal: 3),
                              child: pw.Text(
                                'BERSIH • SEHAT • KAMPUNG ASRI',
                                style: pw.TextStyle(
                                  fontSize: 5.5,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColors.black,
                                ),
                              ),
                            ),
                            pw.Container(width: 12, height: 1, color: PdfColor.fromHex('#cbd5e1')),
                          ],
                        ),
                      ],
                    ),

                    // 4 Institutional Partner Logos Row
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 2),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColor.fromHex('#cbd5e1'), width: 1),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(5)),
                      ),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                        children: [
                          _buildLogoPill('PROVINSI\nJAWA BARAT', themeColor, headerTextColor),
                          _buildLogoPill('PEMERINTAH\nKOTA BANDUNG', themeColor, headerTextColor),
                          _buildLogoPill('DINAS\nLINGKUNGAN HIDUP', themeColor, headerTextColor),
                          _buildLogoPill('UNIVERSITAS\nKOMPUTER INDONESIA', themeColor, headerTextColor),
                        ],
                      ),
                    ),

                    // Main Category Banner
                    pw.Container(
                      width: double.infinity,
                      padding: const pw.EdgeInsets.all(4),
                      decoration: pw.BoxDecoration(
                        color: themeColor,
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                      ),
                      child: pw.Row(
                        children: [
                          pw.Container(
                            width: 22,
                            height: 22,
                            decoration: const pw.BoxDecoration(
                              color: PdfColors.white,
                              shape: pw.BoxShape.circle,
                            ),
                            child: pw.Center(
                              child: pw.Text('🗑️', style: const pw.TextStyle(fontSize: 10)),
                            ),
                          ),
                          pw.SizedBox(width: 5),
                          pw.Expanded(
                            child: pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                pw.Text(
                                  'TEMPAT SAMPAH',
                                  style: pw.TextStyle(
                                    fontSize: 6.5,
                                    fontWeight: pw.FontWeight.bold,
                                    color: headerTextColor,
                                  ),
                                ),
                                pw.Text(
                                  catTitle,
                                  style: pw.TextStyle(
                                    fontSize: 12,
                                    fontWeight: pw.FontWeight.bold,
                                    color: headerTextColor,
                                  ),
                                ),
                                pw.Text(
                                  catDesc,
                                  style: pw.TextStyle(
                                    fontSize: 4.5,
                                    fontWeight: pw.FontWeight.bold,
                                    color: headerTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 4 Benefits Grid
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                      children: [
                        _buildBenefitItem('🍃', 'Menjaga\nlingkungan\ntetap bersih', themeColor, headerTextColor),
                        _buildBenefitItem('♻️', 'Mengurangi\nsampah\nke TPA', themeColor, headerTextColor),
                        _buildBenefitItem('🗑️', 'Kelola sampah\nlebih baik &\nbermanfaat', themeColor, headerTextColor),
                        _buildBenefitItem('👥', 'Bersama wujudkan\nkampung yang\nbersih & asri', themeColor, headerTextColor),
                      ],
                    ),

                    // Bottom QR Section
                    pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Container(
                          width: 32 * PdfPageFormat.mm,
                          height: 32 * PdfPageFormat.mm,
                          padding: const pw.EdgeInsets.all(2),
                          decoration: pw.BoxDecoration(
                            border: pw.Border.all(color: PdfColors.black, width: 1.2),
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                            color: PdfColors.white,
                          ),
                          child: pw.BarcodeWidget(
                            barcode: pw.Barcode.qrCode(),
                            data: qrCodeStr,
                            width: 28 * PdfPageFormat.mm,
                            height: 28 * PdfPageFormat.mm,
                          ),
                        ),
                        pw.SizedBox(width: 5),
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text(
                                '📱 SCAN UNTUK CATAT & LAPOR',
                                style: pw.TextStyle(
                                  fontSize: 7,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColors.black,
                                ),
                              ),
                              pw.SizedBox(height: 1),
                              pw.Text(
                                'Setiap scan membantu kami mencatat dan mengelola sampah dengan lebih baik.',
                                style: pw.TextStyle(
                                  fontSize: 4.5,
                                  color: PdfColor.fromHex('#334155'),
                                ),
                              ),
                              pw.SizedBox(height: 3),
                              pw.Container(
                                width: double.infinity,
                                padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 4),
                                decoration: pw.BoxDecoration(
                                  color: themeColor,
                                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                                ),
                                child: pw.Text(
                                  formattedSerialCode,
                                  style: pw.TextStyle(
                                    fontSize: 6.5,
                                    fontWeight: pw.FontWeight.bold,
                                    color: headerTextColor,
                                  ),
                                  textAlign: pw.TextAlign.center,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Footer Bar
                    pw.Container(
                      padding: const pw.EdgeInsets.only(top: 2),
                      decoration: pw.BoxDecoration(
                        border: pw.Border(top: pw.BorderSide(color: PdfColor.fromHex('#cbd5e1'), width: 1)),
                      ),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            '🛡️ MARI JAGA KEBERSIHAN UNTUK MASA DEPAN YANG LEBIH HIJAU',
                            style: pw.TextStyle(
                              fontSize: 4.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.black,
                            ),
                          ),
                          pw.Text('🍃', style: const pw.TextStyle(fontSize: 5)),
                        ],
                      ),
                    ),
                  ],
                ),
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
        name: 'Poster_Resmi_QR_BERSEKA.pdf',
      );

      // Fallback share file
      final xFile = XFile(file.path, mimeType: 'application/pdf');
      await Share.shareXFiles([xFile], text: 'Poster Resmi QR Code BERSEKA (10 x 15 cm)');
      
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal mengekspor PDF: $e');
    }
  }
}

final ketersediaanQrProvider = StateNotifierProvider<KetersediaanQrController, KetersediaanQrState>((ref) {
  return KetersediaanQrController(ref);
});
