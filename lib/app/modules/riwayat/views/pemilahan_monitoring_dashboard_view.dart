import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/waste_log_entity.dart';
import '../controllers/riwayat_controller.dart';
import '../../shared/widgets/skeleton_loading.dart';
import '../../shared/widgets/empty_state.dart';

/// Dashboard Monitoring Pemilahan Sampah (Web & Admin Superset)
/// Urutan Kolom: [Timestamp] → [Identitas Warga] → [Wilayah] → [Kategori] → [Volume (Kg)] → [Foto] → [Status]
class PemilahanMonitoringDashboardView extends ConsumerStatefulWidget {
  const PemilahanMonitoringDashboardView({super.key});

  @override
  ConsumerState<PemilahanMonitoringDashboardView> createState() =>
      _PemilahanMonitoringDashboardViewState();
}

class _PemilahanMonitoringDashboardViewState
    extends ConsumerState<PemilahanMonitoringDashboardView> {
  String _searchQuery = '';
  String _selectedRtRw = 'Semua';
  String _selectedKategori = 'Semua';
  DateTimeRange? _selectedDateRange;

  int _currentPage = 1;
  final int _pageSize = 10;

  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(wasteLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Dashboard Monitoring Pemilahan Sampah'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(wasteLogsProvider),
            tooltip: 'Refresh Data',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Bar Header
            _buildFilterHeader(context),
            const SizedBox(height: 16),

            // Table Content
            Expanded(
              child: Card(
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: logsAsync.when(
                  data: (logs) {
                    final filtered = _applyFilters(logs);
                    final paginated = _applyPagination(filtered);

                    if (filtered.isEmpty) {
                      return const EmptyState(
                        message: 'Data pemilahan tidak ditemukan dengan filter ini.',
                        icon: Icons.find_in_page_outlined,
                      );
                    }

                    return Column(
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.vertical,
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowColor: WidgetStateProperty.all(
                                  const Color(0xFFF8FAFC),
                                ),
                                columnSpacing: 24,
                                columns: const [
                                  DataColumn(label: Text('Timestamp', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Identitas Warga', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Wilayah', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Volume (Kg)', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Foto Bukti', style: TextStyle(fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Status', style: TextStyle(fontWeight: FontWeight.bold))),
                                ],
                                rows: paginated.map((item) {
                                  final isOrganik = item.wasteType.name.toLowerCase().contains('organ');
                                  final formattedDate = DateFormat('dd MMM yyyy HH:mm').format(item.date);
                                  return DataRow(
                                    cells: [
                                      DataCell(Text(formattedDate, style: const TextStyle(fontSize: 13))),
                                      DataCell(Text(item.wargaName ?? 'Warga #${item.userId.substring(0, 6)}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                                      DataCell(Text(item.wilayah ?? 'RW 03', style: const TextStyle(fontSize: 13))),
                                      DataCell(
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isOrganik ? const Color(0xFFDCFCE7) : const Color(0xFFE0F2FE),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            isOrganik ? 'Organik' : 'Anorganik',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: isOrganik ? const Color(0xFF166534) : const Color(0xFF075985),
                                            ),
                                          ),
                                        ),
                                      ),
                                      DataCell(Text('${item.weightKg.toStringAsFixed(1)} Kg', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                      DataCell(
                                        IconButton(
                                          icon: const Icon(Icons.image_outlined, size: 20, color: AppColors.primaryGreen),
                                          onPressed: () {
                                            showDialog(
                                              context: context,
                                              builder: (ctx) => AlertDialog(
                                                title: const Text('Foto Bukti Pemilahan'),
                                                content: (item.photoUrl == null || item.photoUrl!.isEmpty)
                                                    ? const SizedBox(height: 150, child: Center(child: Icon(Icons.image_not_supported_rounded, size: 80, color: Colors.grey)))
                                                    : CachedNetworkImage(
                                                        imageUrl: item.photoUrl!,
                                                        errorWidget: (_, __, ___) => const SizedBox(height: 150, child: Center(child: Icon(Icons.broken_image_rounded, size: 80, color: Colors.grey))),
                                                      ),
                                                actions: [
                                                  TextButton(
                                                    onPressed: () => Navigator.pop(ctx),
                                                    child: const Text('Tutup'),
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      DataCell(
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: item.isValidated ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            item.isValidated ? 'Tervalidasi' : 'Menunggu',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: item.isValidated ? const Color(0xFF15803D) : const Color(0xFFB45309),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ),
                        // Pagination Bar Footer
                        _buildPaginationFooter(filtered.length),
                      ],
                    );
                  },
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(30),
                      child: SkeletonLoading(height: 300, width: double.infinity),
                    ),
                  ),
                  error: (_, __) => const EmptyState(
                    message: 'Gagal memuat data monitoring dari server.',
                    icon: Icons.error_outline_rounded,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterHeader(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        // Search Bar
        SizedBox(
          width: 250,
          child: TextField(
            controller: _searchController,
            onChanged: (val) => setState(() {
              _searchQuery = val;
              _currentPage = 1;
            }),
            decoration: InputDecoration(
              hintText: 'Cari Nama Warga...',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ),

        // Filter RW
        DropdownButton<String>(
          value: _selectedRtRw,
          items: const [
            DropdownMenuItem(value: 'Semua', child: Text('Semua Wilayah')),
            DropdownMenuItem(value: 'RW 03', child: Text('RW 03')),
            DropdownMenuItem(value: 'RW 03', child: Text('RW 03')),
            DropdownMenuItem(value: 'RW 03', child: Text('RW 03')),
          ],
          onChanged: (val) => setState(() {
            _selectedRtRw = val ?? 'Semua';
            _currentPage = 1;
          }),
        ),

        // Filter Kategori
        DropdownButton<String>(
          value: _selectedKategori,
          items: const [
            DropdownMenuItem(value: 'Semua', child: Text('Semua Kategori')),
            DropdownMenuItem(value: 'Organik', child: Text('Organik')),
            DropdownMenuItem(value: 'Anorganik', child: Text('Anorganik')),
          ],
          onChanged: (val) => setState(() {
            _selectedKategori = val ?? 'Semua';
            _currentPage = 1;
          }),
        ),

        // Date Range Picker
        OutlinedButton.icon(
          icon: const Icon(Icons.calendar_today_rounded, size: 18),
          label: Text(_selectedDateRange == null
              ? 'Rentang Tanggal'
              : '${DateFormat('dd/MM').format(_selectedDateRange!.start)} - ${DateFormat('dd/MM').format(_selectedDateRange!.end)}'),
          onPressed: () async {
            final picked = await showDateRangePicker(
              context: context,
              firstDate: DateTime(2025),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              setState(() {
                _selectedDateRange = picked;
                _currentPage = 1;
              });
            }
          },
        ),

        if (_selectedDateRange != null)
          IconButton(
            icon: const Icon(Icons.clear_rounded, size: 18),
            onPressed: () => setState(() => _selectedDateRange = null),
            tooltip: 'Reset Tanggal',
          ),
      ],
    );
  }

  Widget _buildPaginationFooter(int totalItems) {
    final maxPage = (totalItems / _pageSize).ceil();
    final effectiveMaxPage = maxPage == 0 ? 1 : maxPage;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Menampilkan ${totalItems == 0 ? 0 : (_currentPage - 1) * _pageSize + 1} - ${(_currentPage * _pageSize).clamp(0, totalItems)} dari $totalItems data',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded),
                onPressed: _currentPage > 1
                    ? () => setState(() => _currentPage--)
                    : null,
              ),
              Text('Halaman $_currentPage dari $effectiveMaxPage', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded),
                onPressed: _currentPage < effectiveMaxPage
                    ? () => setState(() => _currentPage++)
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<WasteLogEntity> _applyFilters(List<WasteLogEntity> logs) {
    return logs.where((item) {
      if (_searchQuery.isNotEmpty) {
        final name = (item.wargaName ?? item.userId).toLowerCase();
        if (!name.contains(_searchQuery.toLowerCase())) return false;
      }

      if (_selectedRtRw != 'Semua') {
        if (item.wilayah != _selectedRtRw) return false;
      }

      if (_selectedKategori != 'Semua') {
        final cat = item.wasteType.name.toLowerCase();
        if (_selectedKategori == 'Organik' && !cat.contains('organ')) return false;
        if (_selectedKategori == 'Anorganik' && cat.contains('organ')) return false;
      }

      if (_selectedDateRange != null) {
        if (item.date.isBefore(_selectedDateRange!.start) ||
            item.date.isAfter(_selectedDateRange!.end.add(const Duration(days: 1)))) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  List<WasteLogEntity> _applyPagination(List<WasteLogEntity> filtered) {
    final startIndex = (_currentPage - 1) * _pageSize;
    if (startIndex >= filtered.length) return [];
    final endIndex = (startIndex + _pageSize).clamp(0, filtered.length);
    return filtered.sublist(startIndex, endIndex);
  }
}
