import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/manajemen_bin_controller.dart';
import '../models/admin_bin_model.dart';

/// Halaman Manajemen Tempat Sampah (Admin/Mahasiswa KKN view).
/// Menampilkan tabel semua tempat sampah dengan data pemilik QR lengkap,
/// filter multi-dimensi (RW, kelurahan, status), dan sorting per kolom.
class ManajemenTempatlSampahView extends ConsumerStatefulWidget {
  const ManajemenTempatlSampahView({super.key});

  @override
  ConsumerState<ManajemenTempatlSampahView> createState() =>
      _ManajemenTempatlSampahViewState();
}

class _ManajemenTempatlSampahViewState
    extends ConsumerState<ManajemenTempatlSampahView> {
  final TextEditingController _searchCtrl = TextEditingController();
  final ScrollController _tableHScrollCtrl = ScrollController();
  final ScrollController _tableVScrollCtrl = ScrollController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    _tableHScrollCtrl.dispose();
    _tableVScrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(manajemenBinProvider);
    final notifier = ref.read(manajemenBinProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: _buildAppBar(state, notifier),
      body: Column(
        children: [
          _buildSearchBar(notifier),
          _buildFilterChips(state, notifier),
          _buildSummaryRow(state),
          const SizedBox(height: 4),
          Expanded(child: _buildBody(state, notifier)),
        ],
      ),
    );
  }

  AppBar _buildAppBar(ManajemenBinState state, ManajemenBinNotifier notifier) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      leading: const BackButton(color: AppColors.textPrimary),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Manajemen Tempat Sampah',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            'Total: ${state.filteredBins.length} dari ${state.allBins.length}',
            style: const TextStyle(
              color: AppColors.textHint,
              fontSize: 11,
              fontWeight: FontWeight.w400,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
          tooltip: 'Refresh',
          onPressed: () => notifier.fetchAll(),
        ),
        if (_hasActiveFilter(state))
          IconButton(
            icon: const Icon(Icons.filter_alt_off_rounded, color: AppColors.dangerRed),
            tooltip: 'Reset filter',
            onPressed: () {
              _searchCtrl.clear();
              notifier.resetFilters();
            },
          ),
      ],
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(height: 1, color: AppColors.border),
      ),
    );
  }

  bool _hasActiveFilter(ManajemenBinState s) =>
      s.searchQuery.isNotEmpty ||
      s.filterRw != null ||
      s.filterKelurahan != null ||
      s.filterStatus != null;

  Widget _buildSearchBar(ManajemenBinNotifier notifier) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: TextField(
        controller: _searchCtrl,
        onChanged: notifier.setSearch,
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
        decoration: InputDecoration(
          hintText: 'Cari nama pemilik, kode QR, lokasi...',
          hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textHint, size: 20),
          suffixIcon: ValueListenableBuilder<TextEditingValue>(
            valueListenable: _searchCtrl,
            builder: (_, val, __) => val.text.isEmpty
                ? const SizedBox.shrink()
                : IconButton(
                    icon: const Icon(Icons.clear_rounded, color: AppColors.textHint, size: 18),
                    onPressed: () {
                      _searchCtrl.clear();
                      notifier.setSearch('');
                    },
                  ),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips(ManajemenBinState state, ManajemenBinNotifier notifier) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
      child: Row(
        children: [
          _FilterDropdown(
            icon: Icons.location_city_rounded,
            label: 'Kelurahan',
            value: state.filterKelurahan,
            options: state.kelurahanOptions,
            onChanged: notifier.setFilterKelurahan,
          ),
          const SizedBox(width: 8),
          _FilterDropdown(
            icon: Icons.home_work_rounded,
            label: 'RW',
            value: state.filterRw,
            options: state.rwOptions,
            onChanged: notifier.setFilterRw,
          ),
          const SizedBox(width: 8),
          _FilterDropdown(
            icon: Icons.water_drop_rounded,
            label: 'Keterisian',
            value: state.filterStatus,
            options: const ['Aman', 'Sedang', 'Penuh'],
            onChanged: notifier.setFilterStatus,
          ),
          const SizedBox(width: 8),
          _FilterDropdown(
            icon: Icons.qr_code_rounded,
            label: 'Status QR',
            value: state.filterStatus,
            options: const ['Tercetak & Aktif', 'Belum Aktif', 'Rusak'],
            onChanged: notifier.setFilterStatus,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(ManajemenBinState state) {
    final total = state.filteredBins.length;
    final aktif = state.filteredBins.where((b) => b.isActiveAndBound).length;
    final penuh = state.filteredBins.where((b) => b.isCritical).length;
    final rusak = state.filteredBins.where((b) => b.realStatus.toLowerCase() == 'broken').length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
      child: Row(
        children: [
          _StatChip(label: 'Total', value: total, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          _StatChip(label: 'Aktif', value: aktif, color: AppColors.primaryGreen),
          const SizedBox(width: 8),
          _StatChip(label: 'Penuh', value: penuh, color: AppColors.dangerRed),
          const SizedBox(width: 8),
          _StatChip(label: 'Rusak', value: rusak, color: AppColors.warningOrange),
        ],
      ),
    );
  }

  Widget _buildBody(ManajemenBinState state, ManajemenBinNotifier notifier) {
    if (state.isLoading && state.allBins.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
    }
    if (state.errorMessage != null && state.allBins.isEmpty) {
      return _buildError(state.errorMessage!, notifier);
    }
    if (state.filteredBins.isEmpty) return _buildEmpty();
    return _buildTable(state, notifier);
  }

  Widget _buildError(String message, ManajemenBinNotifier notifier) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.textHint, size: 48),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => notifier.fetchAll(),
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
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.delete_outline_rounded, color: AppColors.textHint, size: 48),
          SizedBox(height: 12),
          Text(
            'Tidak ada data tempat sampah\nyang sesuai filter.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildTable(ManajemenBinState state, ManajemenBinNotifier notifier) {
    return Scrollbar(
      controller: _tableHScrollCtrl,
      thumbVisibility: true,
      child: SingleChildScrollView(
        controller: _tableHScrollCtrl,
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          width: 1080,
          child: Column(
            children: [
              _buildTableHeader(state, notifier),
              Expanded(
                child: Scrollbar(
                  controller: _tableVScrollCtrl,
                  child: ListView.separated(
                    controller: _tableVScrollCtrl,
                    itemCount: state.filteredBins.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.divider),
                    itemBuilder: (context, i) => _BinTableRow(
                      bin: state.filteredBins[i],
                      isEven: i.isEven,
                      onTap: () => _showDetailSheet(context, state.filteredBins[i]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTableHeader(ManajemenBinState state, ManajemenBinNotifier notifier) {
    Widget col(String label, String field, double width) {
      final bool isActive = state.sortField == field;
      return GestureDetector(
        onTap: () => notifier.setSort(field),
        child: SizedBox(
          width: width,
          child: Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isActive ? AppColors.primaryGreen : AppColors.textSecondary,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(width: 2),
              Icon(
                isActive
                    ? (state.sortAsc ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded)
                    : Icons.unfold_more_rounded,
                size: 13,
                color: isActive ? AppColors.primaryGreen : AppColors.textHint,
              ),
            ],
          ),
        ),
      );
    }

    Widget staticCol(String label, double width) => SizedBox(
          width: width,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.4,
            ),
          ),
        );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      color: AppColors.divider,
      child: Row(
        children: [
          col('PEMILIK', 'wargaName', 180),
          col('KAPASITAS MAKS', 'maxCapacity', 110),
          col('KETERISIAN', 'kapasitas', 130),
          staticCol('STATUS QR', 140),
          staticCol('STATUS KAPASITAS', 110),
          col('WAKTU AKTIVASI', 'verifiedAt', 130),
          staticCol('GPS', 160),
          col('RW', 'rw', 80),
          col('KELURAHAN', 'kelurahan', 100),
        ],
      ),
    );
  }

  void _showDetailSheet(BuildContext context, AdminBinModel bin) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _BinDetailSheet(bin: bin),
    );
  }
}

// Filter Dropdown
class _FilterDropdown extends StatelessWidget {
  const _FilterDropdown({
    required this.icon,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final IconData icon;
  final String label;
  final String? value;
  final List<String> options;
  final void Function(String?) onChanged;

  @override
  Widget build(BuildContext context) {
    final bool isActive = value != null;
    return GestureDetector(
      onTap: () => _showPicker(context),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryGreen.withValues(alpha: 0.1) : Colors.white,
          border: Border.all(
            color: isActive ? AppColors.primaryGreen : AppColors.border,
            width: isActive ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isActive ? AppColors.primaryGreen : AppColors.textSecondary),
            const SizedBox(width: 4),
            Text(
              isActive ? value! : label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? AppColors.primaryGreen : AppColors.textSecondary,
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              isActive ? Icons.close_rounded : Icons.expand_more_rounded,
              size: 14,
              color: isActive ? AppColors.primaryGreen : AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }

  void _showPicker(BuildContext context) {
    if (value != null) {
      onChanged(null);
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(0, 8, 0, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Text(
                'Filter $label',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
            ),
            const Divider(height: 1),
            if (options.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Tidak ada pilihan.', style: TextStyle(color: AppColors.textHint)),
              )
            else
              ...options.map(
                (opt) => ListTile(
                  dense: true,
                  title: Text(opt, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                  onTap: () {
                    Navigator.pop(context);
                    onChanged(opt);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// Stat Chip
class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value, required this.color});
  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$value', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// Table Row
class _BinTableRow extends StatelessWidget {
  const _BinTableRow({required this.bin, required this.isEven, required this.onTap});
  final AdminBinModel bin;
  final bool isEven;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: isEven ? Colors.white : AppColors.backgroundCanvas,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Pemilik
            SizedBox(
              width: 180,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bin.wargaName ?? 'Belum Terikat',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  if (bin.wargaPhone != null)
                    Text(bin.wargaPhone!, style: const TextStyle(fontSize: 10, color: AppColors.primaryGreen)),
                ],
              ),
            ),
            // Kapasitas Maks
            SizedBox(
              width: 110,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${bin.maxCapacityLiter.toStringAsFixed(2)} L',
                      style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                  const Text('Batas Maks', style: TextStyle(fontSize: 9, color: AppColors.textHint)),
                ],
              ),
            ),
            // Rasio Keterisian
            SizedBox(
              width: 130,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: bin.kapasitas / 100,
                            minHeight: 6,
                            backgroundColor: AppColors.border,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              bin.isCritical ? AppColors.dangerRed : bin.isWarning ? AppColors.warningYellow : AppColors.primaryGreen,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text('${bin.kapasitas}%',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: bin.isCritical ? AppColors.dangerRed : AppColors.textSecondary,
                          )),
                    ],
                  ),
                  const Text('Tingkat Keterisian', style: TextStyle(fontSize: 9, color: AppColors.textHint)),
                ],
              ),
            ),
            // Status QR
            SizedBox(width: 140, child: _buildQrBadge()),
            // Status Kapasitas
            SizedBox(width: 110, child: _buildCapBadge()),
            // Waktu Aktivasi
            SizedBox(
              width: 130,
              child: Text(
                (bin.verifiedAt == null || bin.verifiedAt!.isEmpty) ? 'Belum Diaktivasi' : bin.verifiedAt!,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                maxLines: 2,
              ),
            ),
            // GPS
            SizedBox(
              width: 160,
              child: Text(
                bin.gpsFormatted ?? 'Belum Terikat (GPS)',
                style: TextStyle(
                  fontSize: 10,
                  color: (bin.gpsFormatted == null || bin.gpsFormatted!.contains('Belum')) ? AppColors.textHint : AppColors.textBlue,
                ),
                maxLines: 2,
              ),
            ),
            // RW
            SizedBox(
              width: 80,
              child: Text(bin.rw ?? '—', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            // Kelurahan
            SizedBox(
              width: 100,
              child: Text(bin.kelurahan ?? '—', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQrBadge() {
    final bool rusak = bin.realStatus.toLowerCase() == 'broken';
    final bool active = bin.isActiveAndBound;
    final bool printed = bin.realStatus == 'PRINTED';

    Color bg, fg;
    String label;
    IconData icon;

    if (rusak) {
      bg = AppColors.dangerRed.withValues(alpha: 0.1); fg = AppColors.dangerRed; label = 'Rusak'; icon = Icons.cancel_rounded;
    } else if (active) {
      bg = AppColors.primaryGreen.withValues(alpha: 0.1); fg = AppColors.primaryGreen; label = 'Tercetak & Aktif'; icon = Icons.check_circle_rounded;
    } else if (printed) {
      bg = AppColors.textHint.withValues(alpha: 0.15); fg = AppColors.textSecondary; label = 'Belum Aktif'; icon = Icons.radio_button_unchecked_rounded;
    } else {
      bg = AppColors.warningYellow.withValues(alpha: 0.1); fg = AppColors.warningYellow; label = bin.realStatus.isEmpty ? 'Unknown' : bin.realStatus; icon = Icons.info_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: fg),
          const SizedBox(width: 3),
          Flexible(
            child: Text(label, style: TextStyle(fontSize: 10, color: fg, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }

  Widget _buildCapBadge() {
    Color bg, fg;
    String label;
    if (bin.isCritical) {
      bg = AppColors.dangerRed.withValues(alpha: 0.1); fg = AppColors.dangerRed; label = 'PENUH';
    } else if (bin.isWarning) {
      bg = AppColors.warningYellow.withValues(alpha: 0.1); fg = AppColors.warningYellow; label = 'SEDANG';
    } else {
      bg = AppColors.primaryGreen.withValues(alpha: 0.1); fg = AppColors.primaryGreen; label = 'AMAN';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 10, color: fg, fontWeight: FontWeight.w700)),
    );
  }
}

// Detail Bottom Sheet
class _BinDetailSheet extends StatelessWidget {
  const _BinDetailSheet({required this.bin});
  final AdminBinModel bin;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (_, ctrl) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 10, bottom: 4),
            child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.primaryGreenLight, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.delete_rounded, color: AppColors.primaryGreen, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(bin.kode, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text(bin.qrCode, style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: bin.qrCode));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Kode QR disalin'), duration: Duration(seconds: 2), backgroundColor: AppColors.primaryGreen),
                    );
                  },
                  child: const Icon(Icons.copy_rounded, size: 18, color: AppColors.textHint),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              controller: ctrl,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                const _SectionTitle('Data Pemilik'),
                _DetailTile(icon: Icons.person_rounded, label: 'Nama Pemilik', value: bin.wargaName ?? '—'),
                _DetailTile(icon: Icons.phone_rounded, label: 'No. HP', value: bin.wargaPhone ?? '—', copyable: bin.wargaPhone != null),
                _DetailTile(icon: Icons.location_on_rounded, label: 'Alamat', value: bin.lokasi ?? '—'),
                const SizedBox(height: 16),
                const _SectionTitle('Wilayah'),
                _DetailTile(icon: Icons.home_work_rounded, label: 'RW', value: bin.rw ?? '—'),
                _DetailTile(icon: Icons.location_city_rounded, label: 'Kelurahan', value: bin.kelurahan ?? '—'),
                const SizedBox(height: 16),
                const _SectionTitle('Kapasitas & Status'),
                _DetailTile(icon: Icons.delete_rounded, label: 'Kapasitas Maks', value: '${bin.maxCapacityLiter.toStringAsFixed(2)} Liter'),
                _DetailTile(icon: Icons.water_drop_rounded, label: 'Volume Saat Ini', value: '${bin.currentVolumeLiter.toStringAsFixed(2)} L (${bin.kapasitas}%)'),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: bin.kapasitas / 100,
                      minHeight: 10,
                      backgroundColor: AppColors.border,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        bin.isCritical ? AppColors.dangerRed : bin.isWarning ? AppColors.warningYellow : AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _DetailTile(
                  icon: Icons.qr_code_rounded,
                  label: 'Status QR',
                  value: bin.isActiveAndBound ? 'Tercetak & Aktif' : (bin.realStatus == 'PRINTED' ? 'Belum Diaktivasi' : bin.realStatus),
                ),
                _DetailTile(icon: Icons.schedule_rounded, label: 'Waktu Aktivasi', value: bin.verifiedAt ?? 'Belum Diaktivasi'),
                const SizedBox(height: 16),
                const _SectionTitle('Lokasi GPS'),
                _DetailTile(
                  icon: Icons.gps_fixed_rounded,
                  label: 'Koordinat',
                  value: bin.gpsFormatted ?? 'Belum Terikat (GPS)',
                  copyable: bin.gpsFormatted != null && !bin.gpsFormatted!.contains('Belum'),
                ),
                if (bin.lastActivityLog != null && bin.lastActivityLog!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const _SectionTitle('Aktivitas Terakhir'),
                  _DetailTile(icon: Icons.history_rounded, label: 'Log', value: bin.lastActivityLog!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          title,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreen, letterSpacing: 0.5),
        ),
      );
}

class _DetailTile extends StatelessWidget {
  const _DetailTile({required this.icon, required this.label, required this.value, this.copyable = false});
  final IconData icon;
  final String label;
  final String value;
  final bool copyable;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.textHint),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textHint)),
                const SizedBox(height: 1),
                Row(
                  children: [
                    Expanded(child: Text(value, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.w500))),
                    if (copyable)
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: value));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('$label disalin'), duration: const Duration(seconds: 2), backgroundColor: AppColors.primaryGreen),
                          );
                        },
                        child: const Padding(padding: EdgeInsets.only(left: 6), child: Icon(Icons.copy_rounded, size: 14, color: AppColors.textHint)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
