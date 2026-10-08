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

  String _formatDate(DateTime dt) {
    try {
      return DateFormat('EEEE, dd MMM yyyy', 'id_ID').format(dt);
    } catch (_) {
      return DateFormat('dd/MM/yyyy').format(dt);
    }
  }

  String _formatTime(DateTime dt) {
    return DateFormat('HH:mm').format(dt);
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
                    _buildInfoBanner(state.totalTidakMemenuhi),
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
                child: _buildEmptyState(hasActiveFilter),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
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

  Widget _buildInfoBanner(int totalCount) {
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
                      'Ketentuan Durasi Harian KKN',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Total: $totalCount Sesi Tidak Memenuhi Target',
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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Status "Hadir Tidak Memenuhi" diberikan apabila durasi berada di zona kegiatan kurang dari target minimal yang ditentukan. Sesi ini tetap tercatat hadir namun tidak memperoleh bonus +3 Poin Durasi.',
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF92400E),
                height: 1.4,
              ),
            ),
          ),
        ],
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
    final progress = (item.durationMinutes / (item.targetMinutes > 0 ? item.targetMinutes : 1))
        .clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.orange.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: item.scheduleId.isNotEmpty
              ? () {
                  Navigator.pushNamed(
                    context,
                    AppRoutes.kknAttendanceHistory,
                    arguments: {'scheduleId': item.scheduleId},
                  );
                }
              : null,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header Card: Tanggal & Badge Status ─────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (item.attendedAt != null)
                            Text(
                              _formatDate(item.attendedAt!),
                              style: const TextStyle(
                                fontSize: 13,
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
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade300),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            size: 13,
                            color: Colors.orange.shade800,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.statusDisplay,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange.shade800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 10),

                // ── Jam Check-in & Check-out ──────────────────────────
                Row(
                  children: [
                    Expanded(
                      child: _buildTimeInfo(
                        icon: Icons.login_rounded,
                        label: 'Check-In',
                        time: item.attendedAt != null
                            ? '${_formatTime(item.attendedAt!)} WIB'
                            : '-',
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    Container(
                      height: 24,
                      width: 1,
                      color: AppColors.border,
                    ),
                    Expanded(
                      child: _buildTimeInfo(
                        icon: Icons.logout_rounded,
                        label: 'Check-Out',
                        time: item.checkOutAt != null
                            ? '${_formatTime(item.checkOutAt!)} WIB'
                            : 'Selesai Lebih Cepat',
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
                if (item.rentangTotalFormatted.isNotEmpty && item.rentangTotalFormatted != '-') ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.blueGrey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blueGrey.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.schedule_rounded, size: 14, color: Colors.blueGrey.shade700),
                        const SizedBox(width: 6),
                        Text(
                          'Rentang Jam Dinding: ${item.rentangTotalFormatted}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.blueGrey.shade800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 12),

                // ── Progress Bar Durasi ──────────────────────────────
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Durasi Efektif di Posko: ${item.durationFormatted}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          Text(
                            'Target: ${item.targetFormatted}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 8,
                          backgroundColor: Colors.grey.shade200,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.orange.shade600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.timelapse_rounded,
                            size: 13,
                            color: Colors.orange.shade800,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Kekurangan: ${item.shortageFormatted}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange.shade800,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${(progress * 100).toInt()}% Tercapai',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      if (item.jedaFormatted.isNotEmpty && item.jedaFormatted != '0 Menit') ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.amber.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.location_off_rounded, size: 13, color: Colors.amber.shade900),
                              const SizedBox(width: 5),
                              Text(
                                'Di Luar Zona / Jeda: ${item.jedaFormatted}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.amber.shade900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // ── Status Badge Kurang dari Target ──────────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 14, color: Colors.orange.shade900),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '⚠️ Kurang ${item.shortageFormatted} dari Target (${item.targetFormatted})',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.orange.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // ── Keterangan Edukasi & Action ──────────────────────
                Text(
                  item.keterangan,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
                if (item.scheduleId.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Lihat Detail Sesi',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade800,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 16,
                        color: Colors.orange.shade800,
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimeInfo({
    required IconData icon,
    required String label,
    required String time,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                time,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool hasActiveFilter) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.verified_rounded,
                size: 56,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Tidak Ada Sesi yang Tidak Memenuhi',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasActiveFilter
                  ? 'Tidak ditemukan riwayat kehadiran dengan status "Hadir Tidak Memenuhi" pada rentang tanggal yang Anda pilih.'
                  : 'Luar biasa! Seluruh presensi kegiatan KKN Anda telah memenuhi target durasi jam kerja atau belum ada presensi yang diselesaikan sebelum target.',
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
