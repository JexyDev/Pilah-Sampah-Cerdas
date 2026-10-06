import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/logbook_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/repositories/kkn_repository.dart';
import '../../../routes/app_routes.dart';

/// Provider statistik KPI logbook mahasiswa (<30ms, ~1KB)
final logbookStatsProvider =
    FutureProvider.autoDispose<LogbookStats?>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getLogbookStats();
});

/// Provider legacy / fallback untuk pemanggilan daftar logbook
final logbookListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getLogbookList(page: 1, limit: 15);
});

/// State untuk Server-Side Pagination Logbook
class LogbookPaginationState {
  final List<Map<String, dynamic>> items;
  final int page;
  final int totalPages;
  final int total;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? errorMessage;
  final String statusFilter;
  final String searchQuery;

  const LogbookPaginationState({
    this.items = const [],
    this.page = 1,
    this.totalPages = 1,
    this.total = 0,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.errorMessage,
    this.statusFilter = 'ALL',
    this.searchQuery = '',
  });

  LogbookPaginationState copyWith({
    List<Map<String, dynamic>>? items,
    int? page,
    int? totalPages,
    int? total,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? errorMessage,
    String? statusFilter,
    String? searchQuery,
  }) {
    return LogbookPaginationState(
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      total: total ?? this.total,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      errorMessage: errorMessage,
      statusFilter: statusFilter ?? this.statusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

/// Notifier Server-Side Pagination Logbook
class LogbookPaginationNotifier extends StateNotifier<LogbookPaginationState> {
  final KknRepository _repo;

  LogbookPaginationNotifier(this._repo) : super(const LogbookPaginationState()) {
    loadInitial();
  }

  Future<void> loadInitial({String? status, String? search}) async {
    final statusFilter = status ?? state.statusFilter;
    final searchQuery = search ?? state.searchQuery;

    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
      statusFilter: statusFilter,
      searchQuery: searchQuery,
    );

    try {
      final res = await _repo.getPaginatedLogbooks(
        page: 1,
        limit: 15,
        statusApproval: statusFilter != 'ALL' ? statusFilter : null,
        search: searchQuery.isNotEmpty ? searchQuery : null,
      );

      state = state.copyWith(
        items: res.data,
        page: 1,
        total: res.pagination.total,
        totalPages: res.pagination.totalPages,
        isLoading: false,
        hasMore: res.pagination.page < res.pagination.totalPages,
      );
    } catch (e) {
      final rawErr = e.toString().replaceAll('Exception: ', '');
      final isTechnicalErr = rawErr.contains('prisma') ||
          rawErr.contains('invocation') ||
          rawErr.contains('argument') ||
          rawErr.contains('StatusLogbookKkn');
      state = state.copyWith(
        isLoading: false,
        errorMessage: isTechnicalErr
            ? 'Tidak ada data logbook untuk filter yang dipilih.'
            : rawErr,
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.page + 1;
      final res = await _repo.getPaginatedLogbooks(
        page: nextPage,
        limit: 15,
        statusApproval: state.statusFilter != 'ALL' ? state.statusFilter : null,
        search: state.searchQuery.isNotEmpty ? state.searchQuery : null,
      );

      final merged = [...state.items, ...res.data];
      state = state.copyWith(
        items: merged,
        page: nextPage,
        total: res.pagination.total,
        totalPages: res.pagination.totalPages,
        isLoadingMore: false,
        hasMore: nextPage < res.pagination.totalPages,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void filterByStatus(String status) {
    if (state.statusFilter == status) return;
    loadInitial(status: status);
  }

  void search(String query) {
    loadInitial(search: query);
  }

  Future<void> refresh() async {
    await loadInitial();
  }
}

final logbookPaginationProvider = StateNotifierProvider.autoDispose<
    LogbookPaginationNotifier, LogbookPaginationState>((ref) {
  final repo = ref.watch(kknRepositoryProvider);
  return LogbookPaginationNotifier(repo);
});

class DataLogbookHarianView extends ConsumerStatefulWidget {
  const DataLogbookHarianView({super.key});

  @override
  ConsumerState<DataLogbookHarianView> createState() =>
      _DataLogbookHarianViewState();
}

class _DataLogbookHarianViewState extends ConsumerState<DataLogbookHarianView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 250) {
      ref.read(logbookPaginationProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildStatusBadge(String? status) {
    final s = (status ?? '').toUpperCase();
    Color color;
    String label;
    IconData icon;

    switch (s) {
      case 'DISETUJUI_DPL':
      case 'DISETUJUI':
        color = AppColors.primaryGreen;
        label = 'Disetujui';
        icon = Icons.check_circle_rounded;
      case 'PERLU_REVISI_DPL':
        color = Colors.orange;
        label = 'Perlu Revisi';
        icon = Icons.rate_review_rounded;
      case 'DITOLAK_KETUA':
        color = AppColors.dangerRed;
        label = 'Ditolak Ketua';
        icon = Icons.cancel_rounded;
      case 'MENUNGGU_VERIFIKASI_DPL':
        color = Colors.amber.shade700;
        label = 'Menunggu DPL';
        icon = Icons.hourglass_empty_rounded;
      case 'MENUNGGU_PERSETUJUAN_KETUA':
      case 'MENUNGGU_VERIFIKASI_KETUA':
        color = AppColors.primaryBlue;
        label = 'Menunggu Ketua';
        icon = Icons.hourglass_top_rounded;
      default:
        color = AppColors.textSecondary;
        label = s.isEmpty ? 'Draft' : s.replaceAll('_', ' ');
        icon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  bool _canEdit(String? status) {
    final s = (status ?? '').toUpperCase();
    return s != 'DITOLAK_DPL';
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '-';
    try {
      final d = DateTime.parse(raw);
      const months = [
        '',
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      return '${d.day} ${months[d.month]} ${d.year}';
    } catch (_) {
      return raw.split('T').first;
    }
  }

  String _fmtTime(String? t) {
    if (t == null || t.isEmpty) return '';
    final parts = t.split(':');
    if (parts.length >= 2) return '${parts[0]}:${parts[1]}';
    return t;
  }

  Widget _buildKpiStatsHeader(LogbookStats? stats) {
    if (stats == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildKpiItem(
            label: 'Total',
            count: stats.total,
            color: AppColors.textPrimary,
            icon: Icons.assignment_rounded,
          ),
          _buildKpiItem(
            label: 'Menunggu',
            count: stats.pendingKetua + stats.pendingDpl,
            color: Colors.amber.shade700,
            icon: Icons.hourglass_top_rounded,
          ),
          _buildKpiItem(
            label: 'Disetujui',
            count: stats.approved,
            color: AppColors.primaryGreen,
            icon: Icons.check_circle_rounded,
          ),
          _buildKpiItem(
            label: 'Revisi',
            count: stats.revisi,
            color: Colors.orange.shade800,
            icon: Icons.rate_review_rounded,
          ),
        ],
      ),
    );
  }

  Widget _buildKpiItem({
    required String label,
    required int count,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips(String currentFilter) {
    final filters = [
      {'key': 'ALL', 'label': 'Semua'},
      {'key': 'MENUNGGU_VERIFIKASI_DPL', 'label': 'Menunggu DPL'},
      {'key': 'DISETUJUI_DPL', 'label': 'Disetujui'},
      {'key': 'PERLU_REVISI_DPL', 'label': 'Perlu Revisi'},
      {'key': 'DITOLAK_KETUA', 'label': 'Ditolak'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: filters.map((f) {
          final isSelected = currentFilter == f['key'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isSelected,
              label: Text(
                f['label']!,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
              ),
              selectedColor: AppColors.primaryGreen,
              backgroundColor: Colors.white,
              checkmarkColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: isSelected ? AppColors.primaryGreen : AppColors.border,
                ),
              ),
              onSelected: (_) {
                ref
                    .read(logbookPaginationProvider.notifier)
                    .filterByStatus(f['key']!);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildLogbookCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) {
    final id = item['id']?.toString() ?? '';
    final tanggal = _formatDate(
      item['tanggalKegiatan']?.toString() ?? item['tanggal']?.toString(),
    );
    final tempat = item['tempat']?.toString() ?? '-';
    final deskripsi = item['deskripsi']?.toString() ?? '-';
    final mulai = _fmtTime(item['waktuMulai']?.toString());
    final selesai = _fmtTime(item['waktuSelesai']?.toString());
    final prokerNama = item['programKerja'] is Map
        ? item['programKerja']['judul']?.toString()
        : item['namaProker']?.toString();
    final status = item['statusApproval']?.toString();
    final catatanDpl = item['catatanDpl']?.toString() ?? '';
    final catatanKetua = item['catatanKetua']?.toString() ?? '';
    final catatan = catatanDpl.isNotEmpty ? catatanDpl : catatanKetua;
    final canEdit = _canEdit(status);
    final isRevisi = status == 'PERLU_REVISI_DPL';
    final isDitolak = status == 'DITOLAK_KETUA';
    final isDisetujui = status == 'DISETUJUI_DPL' || status == 'DISETUJUI';

    return Card(
      elevation: 1.5,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isRevisi
              ? Colors.orange.shade200
              : isDitolak
              ? AppColors.dangerRed.withValues(alpha: 0.2)
              : AppColors.border,
          width: isRevisi || isDitolak ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tanggal,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (mulai.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            '$mulai${selesai.isNotEmpty ? ' – $selesai' : ''}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _buildStatusBadge(status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  size: 13,
                  color: AppColors.primaryGreen,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    tempat,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              deskripsi,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textPrimary,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (prokerNama != null && prokerNama.isNotEmpty) ...[
              const SizedBox(height: 5),
              Row(
                children: [
                  Icon(
                    Icons.link_rounded,
                    size: 12,
                    color: AppColors.primary.withValues(alpha: 0.7),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Proker: $prokerNama',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.primary.withValues(alpha: 0.8),
                        fontStyle: FontStyle.italic,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            if (catatan.isNotEmpty && (isRevisi || isDitolak)) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: isRevisi ? Colors.orange.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isRevisi
                        ? Colors.orange.shade200
                        : Colors.red.shade200,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      isRevisi
                          ? Icons.rate_review_rounded
                          : Icons.cancel_rounded,
                      size: 12,
                      color: isRevisi
                          ? Colors.orange.shade700
                          : Colors.red.shade700,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        catatan,
                        style: TextStyle(
                          fontSize: 11,
                          color: isRevisi
                              ? Colors.orange.shade800
                              : Colors.red.shade800,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (canEdit && id.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: isRevisi
                        ? Colors.orange.shade700
                        : AppColors.primary,
                    backgroundColor:
                        (isRevisi ? Colors.orange : AppColors.primary)
                            .withValues(alpha: 0.07),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    minimumSize: Size.zero,
                  ),
                  icon: Icon(
                    isRevisi
                        ? Icons.rate_review_rounded
                        : (isDisetujui
                            ? Icons.edit_note_rounded
                            : Icons.edit_rounded),
                    size: 14,
                  ),
                  label: Text(
                    isRevisi
                        ? 'Revisi Sekarang'
                        : (isDisetujui
                            ? 'Ajukan Ulang / Edit'
                            : 'Edit Logbook'),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: () async {
                    await Navigator.pushNamed(
                      context,
                      AppRoutes.editLogbookKkn,
                      arguments: {'id': id},
                    );
                    ref.read(logbookPaginationProvider.notifier).refresh();
                    ref.invalidate(logbookStatsProvider);
                    ref.invalidate(logbookListProvider);
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final paginationState = ref.watch(logbookPaginationProvider);
    final statsAsync = ref.watch(logbookStatsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Logbook Harian Saya',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border, height: 1),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Muat Ulang',
            onPressed: () {
              ref.read(logbookPaginationProvider.notifier).refresh();
              ref.invalidate(logbookStatsProvider);
              ref.invalidate(logbookListProvider);
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_logbook_new',
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add_rounded),
        label: const Text(
          'Input Logbook',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        onPressed: () async {
          await Navigator.pushNamed(context, AppRoutes.inputLogbookKkn);
          ref.read(logbookPaginationProvider.notifier).refresh();
          ref.invalidate(logbookStatsProvider);
          ref.invalidate(logbookListProvider);
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(logbookPaginationProvider.notifier).refresh();
          ref.invalidate(logbookStatsProvider);
        },
        child: Column(
          children: [
            _buildKpiStatsHeader(statsAsync.valueOrNull),
            _buildFilterChips(paginationState.statusFilter),
            const SizedBox(height: 4),
            Expanded(
              child: _buildContent(paginationState),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(LogbookPaginationState state) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.cloud_off_rounded,
                size: 52,
                color: AppColors.textSecondary,
              ),
              const SizedBox(height: 12),
              Text(
                state.errorMessage!,
                style: const TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () =>
                    ref.read(logbookPaginationProvider.notifier).refresh(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.edit_document,
                size: 48,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Belum ada logbook harian',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Tap tombol di bawah untuk mulai mencatat aktivitas harian.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      );
    }

    final int itemCount = state.items.length + (state.isLoadingMore ? 1 : 0);

    return ListView.separated(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        if (i == state.items.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          );
        }
        return _buildLogbookCard(ctx, ref, state.items[i]);
      },
    );
  }
}
