import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/providers/repository_providers.dart';

class MonitoringWargaView extends ConsumerStatefulWidget {
  const MonitoringWargaView({super.key});

  @override
  ConsumerState<MonitoringWargaView> createState() => _MonitoringWargaViewState();
}

class _MonitoringWargaViewState extends ConsumerState<MonitoringWargaView> {
  List<dynamic> _wargaList = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchMonitoringData();
  }

  Future<void> _fetchMonitoringData() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/kkn/warga');
      if (response.statusCode == 200) {
        setState(() {
          _wargaList = response.data['data'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Gagal memuat data monitoring warga';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Monitoring Warga Dampingan', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        backgroundColor: AppColors.primaryGreen,
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchMonitoringData,
        color: AppColors.primaryGreen,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(AppDimensions.md),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(_errorMessage!, style: const TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _isLoading = true;
                                _errorMessage = null;
                              });
                              _fetchMonitoringData();
                            },
                            child: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppDimensions.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Card Grafik Sumbu X Y
                        _buildChartCard(),
                        const SizedBox(height: AppDimensions.md),

                        // Daftar Warga
                        const Text(
                          'Daftar Warga Terdaftar',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: AppDimensions.sm),
                        if (_wargaList.isEmpty)
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
                            itemCount: _wargaList.length,
                            itemBuilder: (context, index) {
                              final warga = _wargaList[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: ListTile(
                                  title: Text(warga['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text('${warga['rtRw'] ?? ''} • ${warga['address'] ?? ''}', style: const TextStyle(fontSize: 11)),
                                  trailing: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: (warga['complianceScore'] ?? 0) >= 80
                                          ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                          : AppColors.dangerRed.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      '${warga['complianceScore'] ?? 0} pts',
                                      style: TextStyle(
                                        color: (warga['complianceScore'] ?? 0) >= 80 ? AppColors.primaryGreen : AppColors.dangerRed,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildChartCard() {
    // Ambil top 5 warga dampingan untuk visualisasi grafik X Y yang bersih
    final chartData = _wargaList.map((e) {
      final String name = e['name']?.toString() ?? '';
      final String firstName = name.split(' ').first;
      final double score = double.tryParse(e['complianceScore']?.toString() ?? '0') ?? 0.0;
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
            'Skor Kepatuhan Dampingan (X: Nama, Y: Skor)',
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
