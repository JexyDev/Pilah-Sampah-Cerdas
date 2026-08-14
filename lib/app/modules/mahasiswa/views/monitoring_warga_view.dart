import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/aktivasi_warga_controller.dart';
import '../../auth/controllers/auth_controller.dart';
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
    final user = ref.read(authProvider).user;

    final isAktivasiBinMode =
        ModalRoute.of(context)?.settings.arguments == 'aktivasi_bin';
    if (isAktivasiBinMode && !_hasFetchedAktivasi) {
      _hasFetchedAktivasi = true;
      final kelurahan = user?.kelurahan ?? '';
      final rw = user?.rw ?? '';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(aktivasiWargaProvider.notifier).fetchWargaWithRegion(
                kelurahan: kelurahan,
                rw: rw,
              );
        }
      });
    }
  }

  List<WargaDampingan> _getFilteredWarga(List<WargaDampingan> allWarga, bool isAktivasiBinMode, String userKec, String userKel, String userRw) {
    return allWarga.where((w) {
      if (w.role.isNotEmpty && w.role != 'WARGA') return false; // Hanya tampilkan role warga

      if (_selectedKelurahan != 'Semua') {
        final targetKel = _selectedKelurahan.toLowerCase();
        final matches = w.kelurahan.toLowerCase().contains(targetKel) || 
            w.address.toLowerCase().contains(targetKel);
        if (!matches) return false;
      }
      
      if (_selectedRtRw != 'Semua') {
        final cleanSelected = _selectedRtRw.replaceAll(RegExp(r'[^\d]'), '');
        final cleanWarga = w.rw.replaceAll(RegExp(r'[^\d]'), '');
        final cleanAddr = w.address.replaceAll(RegExp(r'[^\d]'), '');

        final matches = (cleanWarga.isNotEmpty && cleanWarga.contains(cleanSelected)) ||
            (cleanAddr.isNotEmpty && cleanAddr.contains(cleanSelected)) ||
            w.rw.contains(_selectedRtRw) ||
            w.address.contains(_selectedRtRw);
        if (!matches) return false;
      }

      if (_searchController.text.isNotEmpty) {
        final query = _searchController.text.toLowerCase();
        if (!w.wargaName.toLowerCase().contains(query) &&
            !w.binId.toLowerCase().contains(query) &&
            !w.address.toLowerCase().contains(query)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<WargaDampingan> _getFilteredWargaAktivasi(List<dynamic> allWarga, String userKec, String userKel, String userRw) {
    try {
      return allWarga.map((e) {
        final WargaDampingan w = e is WargaDampingan ? e : WargaDampingan.fromJson(e as Map<String, dynamic>);
        final targetKel = w.kelurahan.isNotEmpty ? w.kelurahan : userKel;
        final targetRw = w.rw.isNotEmpty ? w.rw : userRw;
        final targetKec = w.kecamatan.isNotEmpty ? w.kecamatan : userKec;
        final kelDisplay = targetKel.toLowerCase().startsWith('kel') ? targetKel : 'Kel. $targetKel';

        String formattedAddr = w.address;
        if (formattedAddr.contains('RT ,') || formattedAddr.contains('Kel.') && (formattedAddr.endsWith('Kel.') || formattedAddr.contains('Kel.,') || formattedAddr.contains('Kel. '))) {
          String cleaned = formattedAddr
              .replaceAll(RegExp(r',?\s*RT\s*,?'), '')
              .replaceAll(RegExp(r',?\s*Kel\.?\s*$'), '')
              .trim();
          if (cleaned.endsWith(',')) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
          formattedAddr = '$cleaned, RW $targetRw, $kelDisplay, Kec. $targetKec';
        } else if (!formattedAddr.toLowerCase().contains('rw') && !formattedAddr.toLowerCase().contains('kel')) {
          final numStr = w.binId.length >= 2 ? w.binId.substring(w.binId.length - 2) : '04';
          formattedAddr = '$formattedAddr No. $numStr, RW $targetRw, $kelDisplay, Kec. $targetKec';
        }

        return WargaDampingan(
          wargaId: w.wargaId,
          binId: w.binId,
          wargaName: w.wargaName,
          address: formattedAddr,
          kelurahan: targetKel,
          rw: targetRw,
          kecamatan: targetKec,
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
    final userKec = user?.kecamatan ?? '';
    final userKel = user?.kelurahan ?? '';
    final userRw = user?.rw ?? '';

    final isAktivasiBinMode = ModalRoute.of(context)?.settings.arguments == 'aktivasi_bin';
    
    // For aktivasi mode, we need to watch the aktivasi controller too
    final aktivasiState = isAktivasiBinMode ? ref.watch(aktivasiWargaProvider) : null;

    final rawAktivasiList = aktivasiState?.wargaList ?? [];

    final userKelDisplay = userKel.toLowerCase().startsWith('kel') ? userKel : 'Kel. $userKel';
    final allWargaList = isAktivasiBinMode 
        ? _getFilteredWargaAktivasi(rawAktivasiList, userKec, userKel, userRw)
        : state.wargaList.map((w) {
            final displayAddr = w.address.contains('Bojongsoang') || w.address.contains('RW')
                ? w.address
                : 'Jl. ${w.wargaName} No. ${w.binId.length > 3 ? w.binId.substring(w.binId.length - 2) : "4"}, RW $userRw, $userKelDisplay, Kec. $userKec';
            return WargaDampingan(
              wargaId: w.wargaId, binId: w.binId, wargaName: w.wargaName, address: displayAddr, kelurahan: userKel, rw: userRw, kecamatan: userKec, mahasiswaId: w.mahasiswaId, recentLogs: w.recentLogs, isActivated: w.isActivated, role: w.role, totalPoints: w.totalPoints, apiCorrectPercentage: w.apiCorrectPercentage,
            );
          }).toList();

    List<String> kelurahanList = [];
    List<String> rtRwList = [];

    if (isAktivasiBinMode) {
      _selectedKelurahan = userKel;
      _selectedRtRw = userRw;
    }

    final kelurahans = allWargaList
        .where((w) => w.role == 'WARGA' && w.kelurahan.isNotEmpty)
        .map((w) => w.kelurahan)
        .toSet()
        .toList();
    kelurahans.sort();

    final rtrws = allWargaList
        .where((w) => w.role == 'WARGA' && w.rw.isNotEmpty && 
                     (_selectedKelurahan == 'Semua' || w.kelurahan == _selectedKelurahan))
        .map((w) => w.rw)
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

    final filteredWarga = _getFilteredWarga(allWargaList, isAktivasiBinMode, userKec, userKel, userRw);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: Text(isAktivasiBinMode ? 'Pilih Warga' : 'Monitoring Warga Dampingan', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
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
        child: _buildBody(state, aktivasiState, filteredWarga, isAktivasiBinMode, kelurahanList, rtRwList, userKec, userKel, userRw),
      ),
    );
  }

  Widget _buildBody(MahasiswaState state, AktivasiWargaState? aktivasiState, List<WargaDampingan> filteredWarga, bool isAktivasiBinMode, List<String> kelurahanList, List<String> rtRwList, String userKec, String userKel, String userRw) {
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
                    hintText: 'Cari nama atau ID tempat sampah...',
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
                            child: InputDecorator(
                              key: ValueKey('kel_$userKel'),
                              decoration: InputDecoration(
                                labelText: 'Kelurahan Dampingan',
                                prefixIcon: const Icon(Icons.location_city_rounded, size: 18, color: AppColors.primaryGreen),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                filled: true,
                                fillColor: const Color(0xFFF5F7FA),
                                isDense: true,
                              ),
                              child: Text(
                                userKel.isNotEmpty ? (userKel.toLowerCase().startsWith('kel') ? userKel : 'Kel. $userKel') : '-',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InputDecorator(
                              key: ValueKey('rtrw_$userRw'),
                              decoration: InputDecoration(
                                labelText: 'RW Dampingan',
                                prefixIcon: const Icon(Icons.maps_home_work_outlined, size: 18, color: AppColors.primaryGreen),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                filled: true,
                                fillColor: const Color(0xFFF5F7FA),
                                isDense: true,
                              ),
                              child: Text(
                                userRw.isNotEmpty ? (userRw.startsWith('RW') ? userRw : 'RW $userRw') : 'RW 02',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _selectedKelurahan,
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
                              initialValue: _selectedRtRw,
                              decoration: const InputDecoration(labelText: 'RW', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12)),
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
                  margin: const EdgeInsets.only(bottom: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                  shadowColor: Colors.black.withValues(alpha: 0.06),
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
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ── Top Header Row: Warga Name + Status Badge ────────
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      warga.wargaName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: warga.mahasiswaId.isNotEmpty ? AppColors.primaryBlueLight : Colors.grey[200],
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        warga.mahasiswaId.isNotEmpty
                                            ? (warga.pendampingName.isNotEmpty
                                                ? 'Dampingan: ${warga.pendampingName}'
                                                : 'Dampingan Mahasiswa')
                                            : 'Mandiri',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: warga.mahasiswaId.isNotEmpty ? AppColors.primaryBlueDark : Colors.grey[600],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: !warga.isActivated
                                      ? AppColors.dangerRed.withValues(alpha: 0.1)
                                      : isErrorProne
                                          ? AppColors.dangerRed.withValues(alpha: 0.1)
                                          : AppColors.primaryGreen.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  !warga.isActivated 
                                      ? 'Belum Aktivasi' 
                                      : isErrorProne 
                                          ? 'Butuh Edukasi' 
                                          : 'Pemilahan Baik',
                                  style: TextStyle(
                                    color: !warga.isActivated
                                        ? AppColors.dangerRed
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
                          const SizedBox(height: 6),

                          // ── Sub-info RT & Kelurahan ─────────────────────────
                          Builder(
                            builder: (_) {
                              final rtStr = warga.rw.isNotEmpty ? (warga.rw.startsWith('RW') ? warga.rw : 'RW ') : (userRw.startsWith('RW') ? userRw : 'RW $userRw');
                              final kelStr = warga.kelurahan.isNotEmpty ? (warga.kelurahan.toLowerCase().startsWith('kel') ? warga.kelurahan : 'Kel. ${warga.kelurahan}') : (userKel.toLowerCase().startsWith('kel') ? userKel : 'Kel. $userKel');
                              return Text(
                                '$rtStr, $kelStr',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryGreen),
                              );
                            },
                          ),
                          const SizedBox(height: 4),

                          // ── Sub-info Alamat Lengkap ──────────────────────────
                          Text(
                            warga.address,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                          ),
                          const SizedBox(height: 10),

                          // ── Metrik Keaktifan (Poin & % Benar) ───────────────
                          Row(
                            children: [
                              const Icon(Icons.monetization_on_rounded, size: 15, color: AppColors.warningYellow),
                              const SizedBox(width: 4),
                              Text('${warga.totalPoints} Poin', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              const SizedBox(width: 14),
                              const Icon(Icons.analytics_rounded, size: 15, color: AppColors.primaryBlue),
                              const SizedBox(width: 4),
                              Text('${warga.correctPercentage.toStringAsFixed(0)}% Benar', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 4),

                          // ── Terakhir Aktif ──────────────────────────────────
                          Row(
                            children: [
                              const Icon(Icons.access_time_rounded, size: 14, color: AppColors.textHint),
                              const SizedBox(width: 4),
                              Text(
                                warga.lastActiveDate != null 
                                  ? 'Terakhir: ${warga.lastActiveDate!.day}/${warga.lastActiveDate!.month}/${warga.lastActiveDate!.year}' 
                                  : 'Belum ada aktivitas', 
                                style: const TextStyle(fontSize: 11, color: AppColors.textHint),
                              ),
                            ],
                          ),

                          // ── Bottom Action / Status Container ───────────────
                          if (isAktivasiBinMode) ...[
                            const SizedBox(height: 14),
                            if (!warga.isActivated)
                              SizedBox(
                                width: double.infinity,
                                height: 46,
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
                                  icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                                  label: const Text(
                                    'Aktivasi Tempat Sampah',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.2),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryGreen,
                                    foregroundColor: Colors.white,
                                    elevation: 1,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              )
                            else
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryGreen.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(10),
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
    // Ambil top 5 warga dampingan berdasarkan poin tertinggi
    final sortedWarga = List<WargaDampingan>.from(wargaList)
      ..sort((a, b) => b.totalPoints.compareTo(a.totalPoints));

    final chartData = sortedWarga.take(5).map((e) {
      final String firstName = e.wargaName.split(' ').first;
      final double score = e.totalPoints.toDouble(); // Pakai point asli, bukan percentage
      return _ChartDataPoint(firstName, score);
    }).toList();

    // Hitung max value untuk skala Y (kelipatan 50 terdekat)
    double maxY = 100.0;
    if (chartData.isNotEmpty) {
      final highest = chartData.map((e) => e.value).reduce((a, b) => a > b ? a : b);
      if (highest > 0) {
        maxY = ((highest / 50).ceil() * 50).toDouble();
      }
    }

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
            'Grafik Poin Warga (Top 5)',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          if (chartData.isEmpty)
            const SizedBox(
              height: 180,
              child: Center(child: Text('Data tidak cukup untuk menampilkan grafik.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary))),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 180,
                  child: CustomPaint(
                    painter: _CustomXYChartPainter(chartData, maxY),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundCanvas,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Keterangan Sumbu (Matematis):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      SizedBox(height: 4),
                      Text('• Sumbu X (Horizontal) mewakili Nama Warga Dampingan.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      Text('• Sumbu Y (Vertikal) mewakili Total Poin Warga.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
              ],
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
                      backgroundColor: isFirst ? AppColors.warningYellow : AppColors.textHint,
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
  final double maxY;
  
  _CustomXYChartPainter(this.data, this.maxY);

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

    // Margin grafik
    const double paddingLeft = 40.0;
    const double paddingBottom = 24.0;
    const double paddingTop = 12.0;
    const double paddingRight = 16.0;

    final chartWidth = size.width - paddingLeft - paddingRight;
    final chartHeight = size.height - paddingTop - paddingBottom;

    // Draw Y Axis Gridlines (0, 25%, 50%, 75%, 100% of maxY)
    for (int i = 0; i <= 4; i++) {
      final yValue = (i * maxY) / 4;
      final yPos = size.height - paddingBottom - (yValue / maxY * chartHeight);
      
      // Draw gridline
      canvas.drawLine(Offset(paddingLeft, yPos), Offset(size.width - paddingRight, yPos), paintGrid);

      // Draw Y labels
      final tp = TextPainter(
        text: TextSpan(text: yValue.toInt().toString(), style: const TextStyle(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(paddingLeft - tp.width - 8, yPos - (tp.height / 2)));
    }

    // Draw X and Y Axes
    canvas.drawLine(const Offset(paddingLeft, paddingTop), Offset(paddingLeft, size.height - paddingBottom), paintAxis);
    canvas.drawLine(Offset(paddingLeft, size.height - paddingBottom), Offset(size.width - paddingRight, size.height - paddingBottom), paintAxis);

    if (data.isEmpty) return;

    // Calculate step width for X axis
    final double stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    // Build line path
    final path = Path();
    final points = <Offset>[];

    for (int i = 0; i < data.length; i++) {
      final x = paddingLeft + (i * stepX);
      final double safeMaxY = maxY > 0 ? maxY : 1;
      final y = size.height - paddingBottom - (data[i].value / safeMaxY * chartHeight);
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
