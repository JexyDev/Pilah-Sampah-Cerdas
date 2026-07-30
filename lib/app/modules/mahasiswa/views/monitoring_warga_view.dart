import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/aktivasi_warga_controller.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';

class MonitoringWargaView extends ConsumerStatefulWidget {
  const MonitoringWargaView({super.key});

  @override
  ConsumerState<MonitoringWargaView> createState() => _MonitoringWargaViewState();
}

class _MonitoringWargaViewState extends ConsumerState<MonitoringWargaView> {
  // Filters
  final _searchController = TextEditingController();
  final List<String> _kelurahanList = ['Semua', 'Kel. Sukamaju', 'Kel. Sukamantri', 'Kel. Sukasari'];
  final List<String> _rtRwList = ['Semua', 'RT 01 / RW 05', 'RT 02 / RW 05'];
  
  String _selectedKelurahan = 'Semua';
  String _selectedRtRw = 'Semua';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {});
    });
  }

  List<WargaDampingan> _getFilteredWarga(List<WargaDampingan> allWarga, bool isAktivasiBinMode) {
    return allWarga.where((w) {
      if (_searchController.text.isNotEmpty) {
        if (!w.wargaName.toLowerCase().contains(_searchController.text.toLowerCase()) &&
            !w.binId.toLowerCase().contains(_searchController.text.toLowerCase())) {
          return false;
        }
      }
      if (_selectedKelurahan != 'Semua') {
        if (!w.address.contains(_selectedKelurahan)) return false;
      }
      if (_selectedRtRw != 'Semua') {
        if (!w.address.contains(_selectedRtRw)) return false;
      }
      return true;
    }).toList();
  }

  List<WargaDampingan> _getFilteredWargaAktivasi(List<dynamic> allWarga) {
    // The API already filters by Kelurahan and RT/RW, so we only need to local filter by search if we want (or we can rely on API search)
    // Convert Map to WargaDampingan so the UI can render it safely
    try {
      return allWarga.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mahasiswaControllerProvider);
    final isAktivasiBinMode = ModalRoute.of(context)?.settings.arguments == 'aktivasi_bin';
    
    // For aktivasi mode, we need to watch the aktivasi controller too
    final aktivasiState = isAktivasiBinMode ? ref.watch(aktivasiWargaProvider) : null;

    final filteredWarga = isAktivasiBinMode 
        ? _getFilteredWargaAktivasi(aktivasiState?.wargaList ?? [])
        : _getFilteredWarga(state.wargaList, isAktivasiBinMode);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: Text(isAktivasiBinMode ? 'Pilih Warga' : 'Monitoring Warga Dampingan', style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 18)),
        backgroundColor: AppColors.primaryGreen,
        leading: isAktivasiBinMode ? const BackButton(color: Colors.white) : null,
        automaticallyImplyLeading: isAktivasiBinMode,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (isAktivasiBinMode) {
            await ref.read(aktivasiWargaProvider.notifier).fetchWarga();
          } else {
            await ref.read(mahasiswaControllerProvider.notifier).refresh();
          }
        },
        color: AppColors.primaryGreen,
        child: _buildBody(state, aktivasiState, filteredWarga, isAktivasiBinMode),
      ),
    );
  }

  Widget _buildBody(MahasiswaState state, AktivasiWargaState? aktivasiState, List<WargaDampingan> filteredWarga, bool isAktivasiBinMode) {
    final isLoading = isAktivasiBinMode ? (aktivasiState?.isLoading ?? false) : state.isLoading;
    final errorMsg = isAktivasiBinMode ? aktivasiState?.errorMessage : state.errorMessage;
    final isEmpty = filteredWarga.isEmpty;

    if (isLoading && isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
    }

    if (errorMsg != null && isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppDimensions.md),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(errorMsg, style: const TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  if (isAktivasiBinMode) {
                    ref.read(aktivasiWargaProvider.notifier).fetchWarga();
                  } else {
                    ref.read(mahasiswaControllerProvider.notifier).refresh();
                  }
                },
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppDimensions.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
                        // Filter section
                        Container(
                          margin: const EdgeInsets.only(bottom: AppDimensions.md),
                          padding: const EdgeInsets.all(AppDimensions.sm),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Column(
                            children: [
                              TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  hintText: 'Cari nama atau ID bin...',
                                  prefixIcon: const Icon(Icons.search),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: DropdownButtonFormField<String>(
                                      value: _selectedKelurahan,
                                      decoration: const InputDecoration(labelText: 'Kelurahan', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                                      items: _kelurahanList.map((k) => DropdownMenuItem(value: k, child: Text(k, style: const TextStyle(fontSize: 13)))).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() {
                                            _selectedKelurahan = val;
                                          });
                                          if (isAktivasiBinMode) {
                                            ref.read(aktivasiWargaProvider.notifier).setFilter(
                                              kelurahan: val == 'Semua' ? '' : val,
                                              rtRw: _selectedRtRw == 'Semua' ? '' : _selectedRtRw,
                                              search: _searchController.text,
                                            );
                                          }
                                        }
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: DropdownButtonFormField<String>(
                                      value: _selectedRtRw,
                                      decoration: const InputDecoration(labelText: 'RT/RW', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                                      items: _rtRwList.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() => _selectedRtRw = val);
                                          if (isAktivasiBinMode) {
                                            ref.read(aktivasiWargaProvider.notifier).setFilter(
                                              kelurahan: _selectedKelurahan == 'Semua' ? '' : _selectedKelurahan,
                                              rtRw: val == 'Semua' ? '' : val,
                                              search: _searchController.text,
                                            );
                                          }
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Card Grafik Sumbu X Y
                        if (!isAktivasiBinMode) ...[
                          _buildChartCard(state.wargaList),
                          const SizedBox(height: AppDimensions.md),
                        ],
                          // Daftar Warga
                          Text(
                            isAktivasiBinMode ? 'Pilih Warga untuk Aktivasi' : 'Daftar Warga Terdaftar',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: AppDimensions.sm),
                          if (filteredWarga.isEmpty)
                            const Card(
                              child: Padding(
                                padding: EdgeInsets.all(24.0),
                                child: Text('Belum ada warga dampingan yang diaktivasi.', textAlign: TextAlign.center),
                              ),
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: filteredWarga.length,
                              itemBuilder: (context, index) {
                                final warga = filteredWarga[index];
                                final isErrorProne = warga.needsReeducation;
                                
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  clipBehavior: Clip.antiAlias,
                                  child: InkWell(
                                    onTap: isAktivasiBinMode 
                                        ? null 
                                        : () {
                                            Navigator.pushNamed(
                                              context,
                                              AppRoutes.detailWarga,
                                              arguments: warga,
                                            );
                                          },
                                    child: Padding(
                                      padding: const EdgeInsets.all(12.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(warga.wargaName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                                    const SizedBox(height: 4),
                                                    Text(warga.address, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                                  ],
                                                ),
                                              ),
                                              // Status Badge
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: !warga.isActivated
                                                      ? AppColors.warningOrange.withValues(alpha: 0.1)
                                                      : isErrorProne
                                                          ? AppColors.dangerRed.withValues(alpha: 0.1)
                                                          : AppColors.primaryGreen.withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  !warga.isActivated 
                                                      ? 'Belum Aktivasi' 
                                                      : isErrorProne 
                                                          ? 'Butuh Edukasi' 
                                                          : 'Pemilahan Baik',
                                                  style: TextStyle(
                                                    color: !warga.isActivated
                                                        ? AppColors.warningOrange
                                                        : isErrorProne 
                                                            ? AppColors.dangerRed 
                                                            : AppColors.primaryGreen,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (isAktivasiBinMode) ...[
                                            const SizedBox(height: 12),
                                            if (!warga.isActivated)
                                              SizedBox(
                                                width: double.infinity,
                                                child: ElevatedButton.icon(
                                                  onPressed: () {
                                                    Navigator.pushNamed(
                                                      context,
                                                      AppRoutes.aktivasiWarga,
                                                      arguments: {'warga': {
                                                        'id': warga.binId,
                                                        'name': warga.wargaName,
                                                      }},
                                                    );
                                                  },
                                                  icon: const Icon(Icons.qr_code_scanner, size: 18),
                                                  label: const Text('Aktivasi Bin'),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: AppColors.primaryBlue,
                                                    foregroundColor: Colors.white,
                                                  ),
                                                ),
                                              )
                                            else
                                              SizedBox(
                                                width: double.infinity,
                                                child: ElevatedButton.icon(
                                                  onPressed: null,
                                                  icon: const Icon(Icons.check_circle, size: 18),
                                                  label: const Text('Sudah Aktivasi Bin'),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.grey[200],
                                                    foregroundColor: AppColors.textHint,
                                                    disabledBackgroundColor: Colors.grey[100],
                                                    disabledForegroundColor: AppColors.textHint,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                      ],
                    ),
                  );
  }

  Widget _buildChartCard(List<WargaDampingan> wargaList) {
    // Ambil top 5 warga dampingan untuk visualisasi grafik X Y yang bersih
    final chartData = wargaList.map((e) {
      final String firstName = e.wargaName.split(' ').first;
      final double score = e.correctPercentage;
      return _ChartDataPoint(firstName, score);
    }).toList().take(5).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Skor Kepatuhan Dampingan (X: Nama, Y: Skor %)',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          if (chartData.isEmpty)
            const SizedBox(
              height: 180,
              child: Center(child: Text('Data tidak cukup untuk menampilkan grafik.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary))),
            )
          else
            SizedBox(
              height: 180,
              child: CustomPaint(
                painter: _CustomXYChartPainter(chartData),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChartDataPoint {
  final String label;
  final double value;
  _ChartDataPoint(this.label, this.value);
}

class _CustomXYChartPainter extends CustomPainter {
  final List<_ChartDataPoint> data;
  _CustomXYChartPainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    final paintAxis = Paint()
      ..color = AppColors.border
      ..strokeWidth = 1.5;

    final paintGrid = Paint()
      ..color = AppColors.border.withValues(alpha: 0.3)
      ..strokeWidth = 1.0;

    final paintLine = Paint()
      ..color = AppColors.primaryBlue
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke;

    final paintDot = Paint()
      ..color = AppColors.primaryBlue
      ..style = PaintingStyle.fill;

    // Define chart margin
    const double paddingLeft = 32.0;
    const double paddingBottom = 24.0;
    const double paddingTop = 8.0;
    const double paddingRight = 16.0;

    final chartWidth = size.width - paddingLeft - paddingRight;
    final chartHeight = size.height - paddingTop - paddingBottom;

    // Draw Y Axis Gridlines (0, 25, 50, 75, 100)
    for (int i = 0; i <= 4; i++) {
      final yValue = i * 25.0;
      final yPos = size.height - paddingBottom - (yValue / 100.0 * chartHeight);
      
      // Draw gridline
      canvas.drawLine(Offset(paddingLeft, yPos), Offset(size.width - paddingRight, yPos), paintGrid);

      // Draw Y labels
      final tp = TextPainter(
        text: TextSpan(text: yValue.toInt().toString(), style: const TextStyle(fontSize: 8, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(paddingLeft - tp.width - 6, yPos - (tp.height / 2)));
    }

    // Draw X and Y Axes
    canvas.drawLine(Offset(paddingLeft, paddingTop), Offset(paddingLeft, size.height - paddingBottom), paintAxis);
    canvas.drawLine(Offset(paddingLeft, size.height - paddingBottom), Offset(size.width - paddingRight, size.height - paddingBottom), paintAxis);

    if (data.isEmpty) return;

    // Calculate step width for X axis
    final double stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    // Build line path
    final path = Path();
    final points = <Offset>[];

    for (int i = 0; i < data.length; i++) {
      final x = paddingLeft + (i * stepX);
      final y = size.height - paddingBottom - (data[i].value / 100.0 * chartHeight);
      final pt = Offset(x, y);
      points.add(pt);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }

      // Draw X label
      final tp = TextPainter(
        text: TextSpan(text: data[i].label, style: const TextStyle(fontSize: 8, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(x - (tp.width / 2), size.height - paddingBottom + 6));
    }

    // Draw the gradient fill under the line
    if (points.isNotEmpty) {
      final fillPath = Path()
        ..moveTo(points.first.dx, size.height - paddingBottom)
        ..lineTo(points.first.dx, points.first.dy);
      
      for (int i = 1; i < points.length; i++) {
        fillPath.lineTo(points[i].dx, points[i].dy);
      }
      
      fillPath.lineTo(points.last.dx, size.height - paddingBottom);
      fillPath.close();

      final fillPaint = Paint()
        ..shader = LinearGradient(
          colors: [AppColors.primaryBlue.withValues(alpha: 0.3), AppColors.primaryBlue.withValues(alpha: 0.0)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(Rect.fromLTWH(paddingLeft, paddingTop, chartWidth, chartHeight));
      
      canvas.drawPath(fillPath, fillPaint);
    }

    // Draw lines and dots
    canvas.drawPath(path, paintLine);

    for (final pt in points) {
      canvas.drawCircle(pt, 4.0, paintDot);
      canvas.drawCircle(pt, 2.0, Paint()..color = Colors.white..style = PaintingStyle.fill);
    }
  }

  @override
  bool shouldRepaint(covariant _CustomXYChartPainter oldDelegate) => oldDelegate.data != data;
}
