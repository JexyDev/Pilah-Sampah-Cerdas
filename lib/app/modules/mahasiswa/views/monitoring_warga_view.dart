import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/aktivasi_warga_controller.dart';
import '../../auth/controllers/auth_controller.dart';
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
  String _selectedKelurahan = 'Semua';
  String _selectedRtRw = 'Semua';
  bool _hasFetchedAktivasi = false;

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

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Pastikan fetch dipanggil sekali setelah context & auth state tersedia
    final isAktivasiBinMode =
        ModalRoute.of(context)?.settings.arguments == 'aktivasi_bin';
    if (isAktivasiBinMode && !_hasFetchedAktivasi) {
      _hasFetchedAktivasi = true;
      final user = ref.read(authProvider).user;
      final kelurahan = user?.kelurahan ?? '';
      final rtRw = user?.rtRw ?? '';
      // Gunakan addPostFrameCallback agar ref.read aman dipanggil setelah build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(aktivasiWargaProvider.notifier).fetchWargaWithRegion(
                kelurahan: kelurahan,
                rtRw: rtRw,
              );
        }
      });
    }
  }

  List<WargaDampingan> _getFilteredWarga(List<WargaDampingan> allWarga, bool isAktivasiBinMode, String userKel, String userRt) {
    return allWarga.where((w) {
      if (w.role.isNotEmpty && w.role != 'WARGA') return false; // Hanya tampilkan role warga

      // Mode Aktivasi Bin: Tampilkan warga yang berada di wilayah penugasan KKN mahasiswa
      if (isAktivasiBinMode) {
        final matchesKel = w.kelurahan.isEmpty || w.kelurahan == userKel || w.address.contains(userKel);
        final matchesRt = w.rtRw.isEmpty || w.rtRw == userRt || w.address.contains(userRt);
        if (!matchesKel && !matchesRt) return false;
      } else {
        if (_selectedKelurahan != 'Semua') {
          final matches = w.kelurahan == _selectedKelurahan || w.address.contains(_selectedKelurahan);
          if (!matches) return false;
        }
        if (_selectedRtRw != 'Semua') {
          final matches = w.rtRw == _selectedRtRw || w.address.contains(_selectedRtRw);
          if (!matches) return false;
        }
      }

      if (_searchController.text.isNotEmpty) {
        if (!w.wargaName.toLowerCase().contains(_searchController.text.toLowerCase()) &&
            !w.binId.toLowerCase().contains(_searchController.text.toLowerCase())) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<WargaDampingan> _getFilteredWargaAktivasi(List<dynamic> allWarga, String userKel, String userRt) {
    try {
      return allWarga.map((e) {
        if (e is WargaDampingan) {
          final targetKel = e.kelurahan.isNotEmpty ? e.kelurahan : userKel;
          final targetRt = e.rtRw.isNotEmpty ? e.rtRw : userRt;
          return WargaDampingan(
            binId: e.binId,
            wargaName: e.wargaName,
            address: e.address.contains('RT') ? e.address : 'Jl. ${e.wargaName} No. ${e.binId.length > 3 ? e.binId.substring(e.binId.length - 2) : "4"}, RT $targetRt, Kel. $targetKel',
            kelurahan: targetKel,
            rtRw: targetRt,
            mahasiswaId: e.mahasiswaId,
            recentLogs: e.recentLogs,
            isActivated: e.isActivated,
            role: e.role,
            totalPoints: e.totalPoints,
            apiCorrectPercentage: e.apiCorrectPercentage,
          );
        }
        final w = WargaDampingan.fromJson(e as Map<String, dynamic>);
        final targetKel = w.kelurahan.isNotEmpty ? w.kelurahan : userKel;
        final targetRt = w.rtRw.isNotEmpty ? w.rtRw : userRt;
        return WargaDampingan(
          binId: w.binId,
          wargaName: w.wargaName,
          address: w.address.contains('RT') ? w.address : 'Jl. ${w.wargaName} No. ${w.binId.length > 3 ? w.binId.substring(w.binId.length - 2) : "4"}, RT $targetRt, Kel. $targetKel',
          kelurahan: targetKel,
          rtRw: targetRt,
          mahasiswaId: w.mahasiswaId,
          recentLogs: w.recentLogs,
          isActivated: w.isActivated,
          role: w.role,
          totalPoints: w.totalPoints,
          apiCorrectPercentage: w.apiCorrectPercentage,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mahasiswaControllerProvider);
    final user = ref.watch(authProvider).user;
    final userKel = user?.kelurahan ?? 'Bojongsoang';
    final userRt = user?.rtRw ?? '01/02';
    final userId = user?.id ?? '';

    final isAktivasiBinMode = ModalRoute.of(context)?.settings.arguments == 'aktivasi_bin';
    
    // For aktivasi mode, we need to watch the aktivasi controller too
    final aktivasiState = isAktivasiBinMode ? ref.watch(aktivasiWargaProvider) : null;

    final rawAktivasiList = aktivasiState?.wargaList ?? [];

    final userNim = user?.nim ?? '';

    final allWargaList = isAktivasiBinMode 
        ? _getFilteredWargaAktivasi(rawAktivasiList, userKel, userRt)
        : state.wargaList.where((w) {
            // Jika bukan mode aktivasi, hanya tampilkan Warga Dampingan milik mahasiswa ini (mahasiswaId tidak boleh kosong)
            if (!w.isActivated) return false;
            if (w.mahasiswaId.isEmpty) return false;
            return w.mahasiswaId == userId || (userNim.isNotEmpty && w.mahasiswaId == userNim);
          }).map((w) {
            final displayAddr = w.address.contains('Bojongsoang') || w.address.contains('RT')
                ? w.address
                : 'Jl. ${w.wargaName} No. ${w.binId.length > 3 ? w.binId.substring(w.binId.length - 2) : "4"}, RT $userRt, Kel. $userKel';
            return WargaDampingan(
              binId: w.binId, wargaName: w.wargaName, address: displayAddr, kelurahan: userKel, rtRw: userRt, mahasiswaId: w.mahasiswaId, recentLogs: w.recentLogs, isActivated: w.isActivated, role: w.role, totalPoints: w.totalPoints, apiCorrectPercentage: w.apiCorrectPercentage,
            );
          }).toList();

    List<String> kelurahanList;
    List<String> rtRwList;

    if (isAktivasiBinMode) {
      _selectedKelurahan = userKel;
      _selectedRtRw = userRt;
      kelurahanList = [userKel];
      rtRwList = [userRt];
    } else {
      final kelurahans = allWargaList
          .where((w) => w.role == 'WARGA' && w.kelurahan.isNotEmpty)
          .map((w) => w.kelurahan)
          .toSet()
          .toList();
      kelurahans.sort();

      final rtrws = allWargaList
          .where((w) => w.role == 'WARGA' && w.rtRw.isNotEmpty && 
                       (_selectedKelurahan == 'Semua' || w.kelurahan == _selectedKelurahan))
          .map((w) => w.rtRw)
          .toSet()
          .toList();
      rtrws.sort();

      kelurahanList = <String>['Semua', ...kelurahans];
      rtRwList = <String>['Semua', ...rtrws];

      if (!kelurahanList.contains(_selectedKelurahan)) {
        _selectedKelurahan = 'Semua';
      }
      if (!rtRwList.contains(_selectedRtRw)) {
        _selectedRtRw = 'Semua';
      }
    }

    final filteredWarga = _getFilteredWarga(allWargaList, isAktivasiBinMode, userKel, userRt);

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
            await ref.read(aktivasiWargaProvider.notifier).refresh();
          } else {
            await ref.read(mahasiswaControllerProvider.notifier).refresh();
          }
        },
        color: AppColors.primaryGreen,
        child: _buildBody(state, aktivasiState, filteredWarga, isAktivasiBinMode, kelurahanList, rtRwList, userKel, userRt),
      ),
    );
  }

  Widget _buildBody(MahasiswaState state, AktivasiWargaState? aktivasiState, List<WargaDampingan> filteredWarga, bool isAktivasiBinMode, List<String> kelurahanList, List<String> rtRwList, String userKel, String userRt) {
    final isLoading = isAktivasiBinMode ? (aktivasiState?.isLoading ?? false) : state.isLoading;
    final errorMsg = isAktivasiBinMode ? aktivasiState?.errorMessage : state.errorMessage;
    final isEmpty = filteredWarga.isEmpty;
    final isInitialLoading = isAktivasiBinMode 
        ? (isLoading && (aktivasiState?.wargaList.isEmpty ?? true) && (aktivasiState?.selectedKelurahan == null))
        : (isLoading && state.wargaList.isEmpty);

    if (isInitialLoading) {
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
                    ref.read(aktivasiWargaProvider.notifier).refresh();
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
                              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2)),
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
                              isAktivasiBinMode
                                  ? Row(
                                      children: [
                                        Expanded(
                                          child: TextFormField(
                                            initialValue: userKel,
                                            readOnly: true,
                                            decoration: InputDecoration(
                                              labelText: 'Kelurahan',
                                              prefixIcon: const Icon(Icons.location_city, size: 18, color: AppColors.primaryBlue),
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                              filled: true,
                                              fillColor: const Color(0xFFF5F7FA),
                                            ),
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: TextFormField(
                                            initialValue: userRt,
                                            readOnly: true,
                                            decoration: InputDecoration(
                                              labelText: 'RT/RW',
                                              prefixIcon: const Icon(Icons.home_work, size: 18, color: AppColors.primaryBlue),
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                              filled: true,
                                              fillColor: const Color(0xFFF5F7FA),
                                            ),
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                          ),
                                        ),
                                      ],
                                    )
                                  : Row(
                                      children: [
                                        Expanded(
                                          child: DropdownButtonFormField<String>(
                                            value: _selectedKelurahan,
                                            decoration: const InputDecoration(labelText: 'Kelurahan', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                                            items: kelurahanList.map((k) => DropdownMenuItem(value: k, child: Text(k, style: const TextStyle(fontSize: 13)))).toList(),
                                            onChanged: (val) {
                                              if (val != null) {
                                                setState(() {
                                                  _selectedKelurahan = val;
                                                  _selectedRtRw = 'Semua';
                                                });
                                              }
                                            },
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: DropdownButtonFormField<String>(
                                            value: _selectedRtRw,
                                            decoration: const InputDecoration(labelText: 'RT/RW', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                                            items: rtRwList.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
                                            onChanged: (val) {
                                              if (val != null) {
                                                setState(() => _selectedRtRw = val);
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
                          _buildChartCard(filteredWarga),
                          const SizedBox(height: AppDimensions.md),
                          _buildLeaderboard(context, filteredWarga),
                        ],
                          // Daftar Warga
                          Text(
                            isAktivasiBinMode ? 'Pilih Warga untuk Aktivasi' : 'Daftar Warga Terdaftar',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: AppDimensions.sm),
                          if (filteredWarga.isEmpty)
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Text(
                                  isAktivasiBinMode 
                                      ? 'Tidak ada warga yang memerlukan aktivasi.' 
                                      : 'Belum ada warga dampingan terdaftar.', 
                                  textAlign: TextAlign.center
                                ),
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
                                                    if (warga.kelurahan.isNotEmpty || warga.rtRw.isNotEmpty) ...[
                                                      Text('${warga.rtRw}, ${warga.kelurahan}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlue)),
                                                      const SizedBox(height: 2),
                                                    ],
                                                    Text(warga.address, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                                    const SizedBox(height: 8),
                                                    // Metrik Keaktifan
                                                    Row(
                                                      children: [
                                                        const Icon(Icons.monetization_on, size: 14, color: Colors.amber),
                                                        const SizedBox(width: 4),
                                                        Text('${warga.totalPoints} Poin', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                                        const SizedBox(width: 12),
                                                        const Icon(Icons.analytics, size: 14, color: AppColors.primaryBlue),
                                                        const SizedBox(width: 4),
                                                        Text('${warga.correctPercentage.toStringAsFixed(0)}% Benar', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Row(
                                                      children: [
                                                        const Icon(Icons.access_time, size: 14, color: AppColors.textHint),
                                                        const SizedBox(width: 4),
                                                        Text(warga.lastActiveDate != null 
                                                          ? 'Terakhir: ${warga.lastActiveDate!.day}/${warga.lastActiveDate!.month}/${warga.lastActiveDate!.year}' 
                                                          : 'Belum ada aktivitas', 
                                                          style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                                                      ],
                                                    ),
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
                                                  label: const Text('Aktivasi Bin QR'),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: AppColors.warningOrange,
                                                    foregroundColor: Colors.white,
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                  ),
                                                ),
                                              )
                                            else
                                              Container(
                                                width: double.infinity,
                                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                                decoration: BoxDecoration(
                                                  color: AppColors.primaryGreen.withValues(alpha: 0.08),
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                                                ),
                                                child: const Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Icon(Icons.check_circle_rounded, color: AppColors.primaryGreen, size: 16),
                                                    SizedBox(width: 6),
                                                    Text(
                                                      'Sudah Teraktivasi (Warga Dampingan)',
                                                      style: TextStyle(
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.bold,
                                                        color: AppColors.primaryGreen,
                                                      ),
                                                    ),
                                                  ],
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
    // Ambil top 5 warga dampingan berdasarkan poin tertinggi untuk sinkron dengan list
    final sortedWarga = List<WargaDampingan>.from(wargaList)
      ..sort((a, b) => b.totalPoints.compareTo(a.totalPoints));

    final chartData = sortedWarga.take(5).map((e) {
      final String firstName = e.wargaName.split(' ').first;
      final double score = e.correctPercentage;
      return _ChartDataPoint(firstName, score);
    }).toList();

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

  Widget _buildLeaderboard(BuildContext context, List<WargaDampingan> wargaList) {
    if (wargaList.isEmpty) return const SizedBox();

    // Sort by totalPoints descending, take top 3
    final sortedWarga = List<WargaDampingan>.from(wargaList)
      ..sort((a, b) => b.totalPoints.compareTo(a.totalPoints));
    final top3 = sortedWarga.take(3).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: AppDimensions.md),
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: AppColors.primaryBlue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.leaderboard_rounded, color: AppColors.primaryBlue),
              SizedBox(width: 8),
              Text(
                'Top 3 Warga Paling Aktif',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...top3.asMap().entries.map((entry) {
            final index = entry.key;
            final w = entry.value;
            final isFirst = index == 0;
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.detailWarga,
                  arguments: w,
                );
              },
              child: Padding(
                padding: const EdgeInsets.only(bottom: 8.0, top: 4.0, left: 4.0, right: 4.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                    backgroundColor: isFirst ? Colors.amber : AppColors.textHint,
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      w.wargaName,
                      style: TextStyle(
                        fontWeight: isFirst ? FontWeight.bold : FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Text(
                    '${w.totalPoints} Poin',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
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
