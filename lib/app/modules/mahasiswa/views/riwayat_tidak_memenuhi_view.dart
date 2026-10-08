import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../controllers/riwayat_tidak_memenuhi_controller.dart';

class RiwayatTidakMemenuhiView extends ConsumerStatefulWidget {
  const RiwayatTidakMemenuhiView({super.key});

  @override
  ConsumerState<RiwayatTidakMemenuhiView> createState() =>
      _RiwayatTidakMemenuhiViewState();
}

class _RiwayatTidakMemenuhiViewState
    extends ConsumerState<RiwayatTidakMemenuhiView> {
  DateTime? _selectedStartDate;
  DateTime? _selectedEndDate;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('id_ID', null);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(riwayatTidakMemenuhiProvider.notifier).fetchData();
    });
  }

  Future<void> _pickStartDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedStartDate ?? now,
      firstDate: DateTime(2025, 1, 1),
      lastDate: _selectedEndDate ?? now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryGreen,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedStartDate = picked);
      ref
          .read(riwayatTidakMemenuhiProvider.notifier)
          .setFilterRange(_selectedStartDate, _selectedEndDate);
    }
  }

  Future<void> _pickEndDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedEndDate ?? now,
      firstDate: _selectedStartDate ?? DateTime(2025, 1, 1),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryGreen,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedEndDate = picked);
      ref
          .read(riwayatTidakMemenuhiProvider.notifier)
          .setFilterRange(_selectedStartDate, _selectedEndDate);
    }
  }

  void _applyQuickFilter(int days) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (days == 0) {
      // Hari Ini
      setState(() {
        _selectedStartDate = today;
        _selectedEndDate = today;
      });
    } else {
      setState(() {
        _selectedStartDate = today.subtract(Duration(days: days));
        _selectedEndDate = today;
      });
    }
    ref
        .read(riwayatTidakMemenuhiProvider.notifier)
        .setFilterRange(_selectedStartDate, _selectedEndDate);
  }

  void _clearFilter() {
    setState(() {
      _selectedStartDate = null;
      _selectedEndDate = null;
    });
    ref.read(riwayatTidakMemenuhiProvider.notifier).clearFilter();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(riwayatTidakMemenuhiProvider);
    final hasActiveFilter =
        _selectedStartDate != null || _selectedEndDate != null;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Riwayat Tidak Memenuhi',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Segarkan Data',
            onPressed: () =>
                ref.read(riwayatTidakMemenuhiProvider.notifier).refresh(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(riwayatTidakMemenuhiProvider.notifier).refresh(),
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ─── Header Info & Edukasi Banner ───────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoBanner(state),
                    const SizedBox(height: 12),
                    _buildCategorySelector(state),
                    const SizedBox(height: 12),
                    _buildDateFilterSection(hasActiveFilter),
                  ],
                ),
              ),
            ),

            // ─── Content List / Loading / Empty ──────────────────────
            if (state.isLoading && state.items.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.primaryGreen,
                  ),
                ),
              )
            else if (state.errorMessage != null && state.items.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          size: 48,
                          color: AppColors.dangerRed,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          state.errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => ref
                              .read(riwayatTidakMemenuhiProvider.notifier)
                              .refresh(),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Coba Lagi'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (state.items.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _buildEmptyState(hasActiveFilter, state.selectedKategori),
              )
            else
              SliverPadding(
                padding: EdgeInsets.fromLTRB(
                  16,
                  8,
                  16,
                  MediaQuery.paddingOf(context).bottom + 48,
                ),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = state.items[index];
                      return _buildSesiCard(item);
                    },
                    childCount: state.items.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBanner(RiwayatTidakMemenuhiState state) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange.shade800,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Evaluasi Kehadiran Posko KKN',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${state.totalTidakMemenuhi} Tidak Terpenuhi • ${state.totalAlpha} Tanpa Keterangan',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.orange.shade800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: const Text(
              '• Tidak Terpenuhi: Mahasiswa tercatat melakukan presensi masuk (check-in), namun durasi kegiatan di posko belum mencapai target minimal harian (4 Jam) atau belum melakukan presensi keluar (check-out) pada hari lampau.\n• Tanpa Keterangan: Mahasiswa tidak tercatat melakukan presensi masuk pada jadwal kegiatan posko serta tidak memiliki pengajuan izin atau sakit resmi yang disetujui DPL.',
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF92400E),
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector(RiwayatTidakMemenuhiState state) {
    return Row(
      children: [
        Expanded(
          child: _buildCategoryTab(
            label: 'Tidak Terpenuhi',
            count: state.totalTidakMemenuhi,
            isSelected: state.selectedKategori == KategoriFilter.kurangDurasi,
            activeColor: const Color(0xFFD97706),
            onTap: () => ref
                .read(riwayatTidakMemenuhiProvider.notifier)
                .setKategori(KategoriFilter.kurangDurasi),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildCategoryTab(
            label: 'Tanpa Keterangan',
            count: state.totalAlpha,
            isSelected: state.selectedKategori == KategoriFilter.alpha,
            activeColor: AppColors.dangerRed,
            onTap: () => ref
                .read(riwayatTidakMemenuhiProvider.notifier)
                .setKategori(KategoriFilter.alpha),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryTab({
    required String label,
    required int count,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color:
              isSelected ? activeColor.withValues(alpha: 0.12) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : AppColors.border,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isSelected ? activeColor : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? activeColor : AppColors.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateFilterSection(bool hasActiveFilter) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.calendar_month_rounded,
                size: 18,
                color: AppColors.primaryGreen,
              ),
              const SizedBox(width: 6),
              const Text(
                'Filter Tanggal',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              if (hasActiveFilter)
                InkWell(
                  onTap: _clearFilter,
                  borderRadius: BorderRadius.circular(6),
                  child: const Padding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.close_rounded,
                          size: 14,
                          color: AppColors.dangerRed,
                        ),
                        SizedBox(width: 2),
                        Text(
                          'Reset',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.dangerRed,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildDateInputBox(
                  label: 'Dari',
                  date: _selectedStartDate,
                  onTap: _pickStartDate,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                '—',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildDateInputBox(
                  label: 'Sampai',
                  date: _selectedEndDate,
                  onTap: _pickEndDate,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Quick filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildQuickFilterChip(
                  label: 'Semua',
                  isSelected: !hasActiveFilter,
                  onTap: _clearFilter,
                ),
                const SizedBox(width: 6),
                _buildQuickFilterChip(
                  label: 'Hari Ini',
                  isSelected: _isTodayFilter(),
                  onTap: () => _applyQuickFilter(0),
                ),
                const SizedBox(width: 6),
                _buildQuickFilterChip(
                  label: '7 Hari Terakhir',
                  isSelected: _isDaysFilter(7),
                  onTap: () => _applyQuickFilter(7),
                ),
                const SizedBox(width: 6),
                _buildQuickFilterChip(
                  label: '30 Hari Terakhir',
                  isSelected: _isDaysFilter(30),
                  onTap: () => _applyQuickFilter(30),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _isTodayFilter() {
    if (_selectedStartDate == null || _selectedEndDate == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return _selectedStartDate == today && _selectedEndDate == today;
  }

  bool _isDaysFilter(int days) {
    if (_selectedStartDate == null || _selectedEndDate == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final targetStart = today.subtract(Duration(days: days));
    return _selectedStartDate == targetStart && _selectedEndDate == today;
  }

  Widget _buildDateInputBox({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    final text = date != null
        ? DateFormat('dd MMM yyyy', 'id_ID').format(date)
        : 'Pilih Tanggal';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: date != null
              ? AppColors.primaryGreen.withValues(alpha: 0.05)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: date != null
                ? AppColors.primaryGreen.withValues(alpha: 0.5)
                : AppColors.border,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: date != null
                    ? AppColors.textPrimary
                    : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryGreen
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? AppColors.primaryGreen
                : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildSesiCard(SesiTidakMemenuhi item) {
    String dateStr = '-';
    if (item.attendedAt != null) {
      dateStr = DateFormat('yyyy-MM-dd').format(item.attendedAt!);
    } else if (item.rawData?['tanggal'] != null &&
        item.rawData!['tanggal'].toString().isNotEmpty &&
        item.rawData!['tanggal'] != '-') {
      dateStr = item.rawData!['tanggal'].toString();
    } else if (item.rawData?['dateKey'] != null &&
        item.rawData!['dateKey'].toString().isNotEmpty) {
      dateStr = item.rawData!['dateKey'].toString();
    }

    final targetMins = item.targetMinutes > 0 ? item.targetMinutes : 240;
    final rasioDouble =
        (item.durationMinutes / targetMins * 100).clamp(0.0, 100.0);
    final bool isAlphaItem = item.isAlpha;

    // Badge styling & label
    final Color badgeBorderColor =
        isAlphaItem ? const Color(0xFFEF4444) : const Color(0xFFF59E0B);
    final Color badgeBgColor =
        isAlphaItem ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB);
    final Color badgeTextColor =
        isAlphaItem ? const Color(0xFFDC2626) : const Color(0xFFD97706);
    final IconData badgeIcon =
        isAlphaItem ? Icons.cancel_outlined : Icons.warning_amber_rounded;
    final String badgeLabel = isAlphaItem
        ? 'Tanpa Keterangan'
        : (item.checkOutAt == null ? 'Tanpa Check-Out' : 'Kurang Jam (< 4 Jam)');

    final jamMasukText = (isAlphaItem || item.attendedAt == null)
        ? '-'
        : '${DateFormat("HH:mm").format(item.attendedAt!)} WIB';
    final jamPulangText = item.checkOutAt != null
        ? '${DateFormat("HH:mm").format(item.checkOutAt!)} WIB'
        : (isAlphaItem ? '-' : 'Belum Check-Out');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAlphaItem ? Colors.red.shade200 : Colors.orange.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.pushNamed(
              context,
              AppRoutes.kknAttendanceHistory,
              arguments: {
                'scheduleId': item.scheduleId,
                'fallbackData': {
                  'statusKehadiran': isAlphaItem ? 'ALPA' : item.status,
                  'namaKegiatan': item.scheduleTitle,
                  'jamMasuk': item.attendedAt?.toIso8601String(),
                  'jamPulang': item.checkOutAt?.toIso8601String(),
                  'durasiAktualMenit': item.durationMinutes,
                  'durasiTargetMenit': item.targetMinutes,
                  'durasiJedaMenit': item.durasiJedaMenit,
                  'durasiJedaFormatted': item.jedaFormatted,
                  'isMemenuhiDurasi': false,
                  'method': isAlphaItem ? 'ALPA_AUTO' : 'GPS_ACTIVITY',
                },
              },
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header: Kalender Icon, Tanggal, Subtitle, & Badge ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.calendar_today_outlined,
                        size: 16,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dateStr,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.scheduleTitle,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: badgeBgColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: badgeBorderColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(badgeIcon, size: 12, color: badgeTextColor),
                          const SizedBox(width: 4),
                          Text(
                            badgeLabel,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: badgeTextColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // ── Body: Responsif & Rapih ──
                if (isAlphaItem) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFEE2E2)),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          Icons.event_busy_rounded,
                          color: Color(0xFFDC2626),
                          size: 20,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Tidak ada rekam presensi check-in pada jadwal posko ini (0 Poin Kehadiran).',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF991B1B),
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // Baris 1: Jam Masuk & Jam Keluar
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Jam Masuk',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                jamMasukText,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF16A34A),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text(
                                'Jam Pulang',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                jamPulangText,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: item.checkOutAt != null
                                      ? AppColors.textPrimary
                                      : Colors.orange.shade800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Baris 2: 3 Kolom Metrik (Durasi Posko | Waktu Jeda | Rasio Target)
                  Row(
                    children: [
                      // Durasi Bersih
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Durasi Posko',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.durationFormatted,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                'Target ${item.targetFormatted}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Durasi Jeda
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Durasi Jeda',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFFD97706),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.durasiJedaMenit > 0 ? item.jedaFormatted : '0 Menit',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFD97706),
                                ),
                              ),
                              const Text(
                                'Di luar posko',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Rasio Capaian
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Rasio Target',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                '${rasioDouble.toStringAsFixed(1)}%',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: rasioDouble >= 100
                                      ? const Color(0xFF16A34A)
                                      : Colors.orange.shade800,
                                ),
                              ),
                              Text(
                                '${item.durationMinutes}/${targetMins}m',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 10),

                // Footer CTA: Lihat Detail
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      'Lihat Detail Presensi',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isAlphaItem
                            ? AppColors.dangerRed
                            : Colors.orange.shade800,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 15,
                      color: isAlphaItem
                          ? AppColors.dangerRed
                          : Colors.orange.shade800,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool hasActiveFilter, KategoriFilter kategori) {
    String title;
    String subtitle;
    IconData icon;
    Color iconColor;

    if (kategori == KategoriFilter.alpha) {
      icon = Icons.verified_user_rounded;
      iconColor = AppColors.primaryGreen;
      title = 'Tidak Ada Catatan Tanpa Keterangan';
      subtitle = hasActiveFilter
          ? 'Tidak ada catatan Tanpa Keterangan pada rentang tanggal yang dipilih.'
          : 'Luar biasa! Anda tidak memiliki catatan Tanpa Keterangan pada kegiatan posko KKN.';
    } else {
      icon = Icons.timer_rounded;
      iconColor = AppColors.primaryGreen;
      title = 'Tidak Ada Sesi yang Tidak Terpenuhi';
      subtitle = hasActiveFilter
          ? 'Seluruh sesi pada rentang tanggal ini memenuhi target durasi kerja minimum posko.'
          : 'Hebat! Seluruh sesi kehadiran posko Anda telah memenuhi target durasi kerja minimal 4 jam.';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 56,
                color: iconColor,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            if (hasActiveFilter) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _clearFilter,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Reset Filter Tanggal'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryGreen,
                  side: const BorderSide(color: AppColors.primaryGreen),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
