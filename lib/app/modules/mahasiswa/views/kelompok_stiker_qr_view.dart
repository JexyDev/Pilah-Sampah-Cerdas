import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/values/app_colors.dart';
import '../controllers/kelompok_stiker_qr_controller.dart';
import '../../../data/models/kelompok_qr_models.dart';

class KelompokStikerQrView extends ConsumerStatefulWidget {
  const KelompokStikerQrView({super.key});

  @override
  ConsumerState<KelompokStikerQrView> createState() =>
      _KelompokStikerQrViewState();
}

class _KelompokStikerQrViewState extends ConsumerState<KelompokStikerQrView> {
  bool _hasLoadedExplicitId = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasLoadedExplicitId) {
      _hasLoadedExplicitId = true;
      final explicitId = ModalRoute.of(context)?.settings.arguments as String?;
      if (explicitId != null && explicitId.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ref
                .read(kelompokStikerQrProvider.notifier)
                .loadData(explicitKelompokId: explicitId);
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kelompokStikerQrProvider);
    final controller = ref.read(kelompokStikerQrProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Stiker QR Kelompok',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.errorMessage != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => controller.loadData(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Coba Lagi',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : state.qrData == null
          ? const Center(child: Text('Data tidak tersedia'))
          : RefreshIndicator(
              onRefresh: controller.loadData,
              color: AppColors.primary,
              child: Column(
                children: [
                  _buildHeader(state.qrData!),
                  _buildFilterTabs(state, controller),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.filteredItems.length,
                      itemBuilder: (context, index) {
                        final item = state.filteredItems[index];
                        return _buildCardItem(
                          context,
                          item,
                          state.qrData?.kelompok.cakupanRw ?? [],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar:
          (state.qrData != null &&
              !state.isLoading &&
              state.errorMessage == null)
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: ElevatedButton.icon(
                  onPressed: state.isLoading
                      ? null
                      : () => controller.exportData(),
                  icon: const Icon(Icons.print, color: Colors.white),
                  label: const Text(
                    'Kirim ke Percetakan (PDF)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildHeader(KelompokQrData data) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            data.kelompok.nama,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.person,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                'DPL: ${data.kelompok.dpl}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          if ((data.kelompok.kelurahan.isNotEmpty &&
                  data.kelompok.kelurahan != '-') ||
              data.kelompok.cakupanRw.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  size: 14,
                  color: AppColors.primaryGreen,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    [
                      if (data.kelompok.kelurahan.isNotEmpty &&
                          data.kelompok.kelurahan != '-')
                        (data.kelompok.kelurahan
                                .toLowerCase()
                                .startsWith('kel')
                            ? data.kelompok.kelurahan
                            : 'Kel. ${data.kelompok.kelurahan}'),
                      if (data.kelompok.cakupanRw.isNotEmpty)
                        data.kelompok.cakupanRw.length > 1
                            ? 'Multi RW: ${data.kelompok.cakupanRw.map((r) => r.startsWith('RW') ? r : 'RW $r').join(', ')}'
                            : (data.kelompok.cakupanRw.first.startsWith('RW')
                                ? data.kelompok.cakupanRw.first
                                : 'RW ${data.kelompok.cakupanRw.first}'),
                    ].join(' • '),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryGreen,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem(
                  '${data.kuota.tersediaBelumTerpakai}',
                  'Tersedia',
                ),
                Container(
                  width: 1,
                  height: 30,
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
                _buildStatItem('${data.kuota.sudahTerikatWarga}', 'Terpasang'),
                Container(
                  width: 1,
                  height: 30,
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
                _buildStatItem('${data.kuota.targetTotal}', 'Total Stiker'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildFilterTabs(
    KelompokStikerQrState state,
    KelompokStikerQrController controller,
  ) {
    final qrData = state.qrData;
    if (qrData == null) return const SizedBox.shrink();

    final allCount = qrData.items.length;
    final organikCount = qrData.items
        .where((e) => e.jenis.toUpperCase() == 'ORGANIK')
        .length;
    final anorganikCount = qrData.items
        .where((e) => e.jenis.toUpperCase() == 'ANORGANIK')
        .length;

    final availCount = qrData.kuota.tersediaBelumTerpakai;
    final boundCount = qrData.kuota.sudahTerikatWarga;
    final cakupanRw = qrData.kelompok.cakupanRw;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tier 1: Kategori Sampah
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(
                  'ALL',
                  'Semua ($allCount)',
                  state.selectedFilter,
                  (val) => controller.setFilter(val),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'ORGANIK',
                  'Organik ($organikCount)',
                  state.selectedFilter,
                  (val) => controller.setFilter(val),
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'ANORGANIK',
                  'Anorganik ($anorganikCount)',
                  state.selectedFilter,
                  (val) => controller.setFilter(val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Tier 2: Status Penggunaan & Filter RW Dinamis (Khusus Multi-RW)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Status Filter
                _buildSubFilterChip(
                  'ALL',
                  'Semua Status',
                  state.selectedStatus,
                  (val) => controller.setStatusFilter(val),
                ),
                const SizedBox(width: 6),
                _buildSubFilterChip(
                  'AVAILABLE',
                  'Tersedia ($availCount)',
                  state.selectedStatus,
                  (val) => controller.setStatusFilter(val),
                  activeColor: Colors.green.shade700,
                ),
                const SizedBox(width: 6),
                _buildSubFilterChip(
                  'BOUND',
                  'Terpasang ($boundCount)',
                  state.selectedStatus,
                  (val) => controller.setStatusFilter(val),
                  activeColor: Colors.blue.shade700,
                ),

                // Multi-RW Filter (Muncul jika kelompok mencakup >1 RW)
                if (cakupanRw.length > 1) ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    width: 1,
                    height: 18,
                    color: Colors.grey.shade300,
                  ),
                  const Icon(
                    Icons.location_on_rounded,
                    size: 14,
                    color: AppColors.primaryGreen,
                  ),
                  const SizedBox(width: 4),
                  _buildSubFilterChip(
                    'ALL',
                    'Semua RW (${cakupanRw.length} RW)',
                    state.selectedRw,
                    (val) => controller.setRwFilter(val),
                  ),
                  for (final r in cakupanRw) ...[
                    const SizedBox(width: 6),
                    _buildSubFilterChip(
                      r,
                      r.startsWith('RW') ? r : 'RW $r',
                      state.selectedRw,
                      (val) => controller.setRwFilter(val),
                      activeColor: Colors.teal.shade700,
                    ),
                  ],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    String value,
    String label,
    String selected,
    ValueChanged<String> onSelected,
  ) {
    final isSelected = selected == value;
    return InkWell(
      onTap: () => onSelected(value),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildSubFilterChip(
    String value,
    String label,
    String selected,
    ValueChanged<String> onSelected, {
    Color? activeColor,
  }) {
    final isSelected = selected == value;
    final color = activeColor ?? AppColors.primary;
    return InkWell(
      onTap: () => onSelected(value),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withValues(alpha: 0.12)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 1.2 : 0.8,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? color : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 11,
          ),
        ),
      ),
    );
  }

  Widget _buildCardItem(
    BuildContext context,
    StikerQrItem item,
    List<String> cakupanRw,
  ) {
    final isOrganik = item.jenis.toUpperCase() == 'ORGANIK';
    final borderColor =
        isOrganik ? AppColors.primaryGreen : AppColors.nonOrganicColor;
    final isBound = item.status == 'ACTIVE_BOUND';
    final itemRw = item.wargaRw;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: borderColor.withValues(alpha: 0.5),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _showQrPreviewDialog(context, item, cakupanRw),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: QrImageView(
                        data: item.qrCode,
                        version: QrVersions.auto,
                        size: 64,
                        gapless: false,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.zoom_in_rounded,
                        size: 12,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.qrCode,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right_rounded,
                            size: 18,
                            color: AppColors.textHint,
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: borderColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item.kategoriNama,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: borderColor,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isBound
                                  ? Colors.blue.withValues(alpha: 0.1)
                                  : Colors.green.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              isBound ? 'Terpasang' : 'Tersedia',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: isBound
                                    ? Colors.blue[700]
                                    : Colors.green[700],
                              ),
                            ),
                          ),
                          // Badge Wilayah RW Dinamis
                          if (isBound && itemRw != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.indigo.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.location_on_rounded,
                                    size: 10,
                                    color: Colors.indigo.shade700,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    'RW $itemRw',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.indigo.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else if (!isBound && cakupanRw.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.teal.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.hub_rounded,
                                    size: 10,
                                    color: Colors.teal.shade700,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    cakupanRw.length > 1
                                        ? 'Multi RW (${cakupanRw.length})'
                                        : (cakupanRw.first.startsWith('RW')
                                            ? cakupanRw.first
                                            : 'RW ${cakupanRw.first}'),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.teal.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.photo_rounded,
                                  size: 10,
                                  color: AppColors.primary,
                                ),
                                SizedBox(width: 2),
                                Text(
                                  'Lihat Foto Stiker',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (isBound && item.terikatWarga != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.person,
                                    size: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      item.terikatWarga!.nama,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on,
                                    size: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      item.terikatWarga!.alamat,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showQrPreviewDialog(
    BuildContext context,
    StikerQrItem item, [
    List<String>? cakupanRw,
  ]) {
    final isOrganik = item.jenis.toUpperCase() == 'ORGANIK';
    final themeColor =
        isOrganik ? AppColors.primaryGreen : AppColors.nonOrganicColor;
    final isBound = item.status == 'ACTIVE_BOUND';

    showDialog(
      context: context,
      builder: (ctx) {
        bool showStikerPhoto = true; // DEFAULT: Tampilkan Foto Stiker Fisik Resmi
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            contentPadding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 1. Header Kategori & Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: themeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: themeColor.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isOrganik
                                  ? Icons.eco_rounded
                                  : Icons.delete_outline_rounded,
                              size: 14,
                              color: themeColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              item.kategoriNama,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: themeColor,
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
                          color: isBound
                              ? Colors.blue.withValues(alpha: 0.1)
                              : Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isBound ? 'Terpasang' : 'Tersedia',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isBound ? Colors.blue[700] : Colors.green[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // 2. Mode Selector: Foto Stiker Fisik vs QR Code Saja
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setDialogState(() => showStikerPhoto = true),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: showStikerPhoto ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: showStikerPhoto
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.06),
                                          blurRadius: 4,
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.photo_rounded,
                                    size: 14,
                                    color: showStikerPhoto
                                        ? AppColors.primaryGreen
                                        : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Foto Stiker (10x15)',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: showStikerPhoto
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                      color: showStikerPhoto
                                          ? AppColors.primaryGreen
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => setDialogState(() => showStikerPhoto = false),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: !showStikerPhoto ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: !showStikerPhoto
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.06),
                                          blurRadius: 4,
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.qr_code_2_rounded,
                                    size: 14,
                                    color: !showStikerPhoto
                                        ? AppColors.primaryGreen
                                        : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Scan Barcode Saja',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: !showStikerPhoto
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                      color: !showStikerPhoto
                                          ? AppColors.primaryGreen
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 3. Tampilan Gambar/Foto Stiker (Interactive Viewer)
                  if (showStikerPhoto) ...[
                    InteractiveViewer(
                      minScale: 0.8,
                      maxScale: 3.5,
                      child: Center(
                        child: _StikerPosterWidget(
                          item: item,
                          width: 230,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Pinch / cubit untuk memperbesar foto stiker',
                      style: TextStyle(fontSize: 10, color: AppColors.textHint),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: CustomPaint(
                        size: const Size.square(200),
                        painter: QrPainter(
                          data: item.qrCode,
                          version: QrVersions.auto,
                          gapless: false,
                          eyeStyle: const QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: Colors.black,
                          ),
                          dataModuleStyle: const QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),
                  SelectableText(
                    item.qrCode,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (isBound && item.wargaRw != null) ...[
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.indigo.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.indigo.shade200),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_on_rounded,
                            size: 14,
                            color: Colors.indigo.shade700,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Terpasang di RW ${item.wargaRw}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.indigo.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                  ] else if (!isBound && (cakupanRw?.isNotEmpty ?? false)) ...[
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.teal.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.teal.shade200),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.hub_rounded,
                            size: 14,
                            color: Colors.teal.shade700,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              (cakupanRw!.length > 1)
                                  ? 'Bebas Dipasang di: ${cakupanRw.map((r) => r.startsWith('RW') ? r : 'RW $r').join(', ')}'
                                  : 'Alokasi: ${cakupanRw.first.startsWith('RW') ? cakupanRw.first : 'RW ${cakupanRw.first}'}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.teal.shade700,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],
                  const Text(
                    'Gunakan stiker ini saat aktivasi tempat sampah warga',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  if (isBound && item.terikatWarga != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Warga: ${item.terikatWarga!.nama}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          if (item.terikatWarga!.telepon != '-')
                            Text(
                              'No. Telp: ${item.terikatWarga!.telepon}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          if (item.terikatWarga!.alamat != '-')
                            Text(
                              'Alamat: ${item.terikatWarga!.alamat}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(dialogCtx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Tutup'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Widget Foto Stiker Poster Resmi 10x15cm (Proporsi Asli 1182 x 1772 px)
class _StikerPosterWidget extends StatelessWidget {
  final StikerQrItem item;
  final double width;

  const _StikerPosterWidget({
    required this.item,
    this.width = 230.0,
  });

  @override
  Widget build(BuildContext context) {
    final isAnorganik = item.jenis.toUpperCase() == 'ANORGANIK';
    final templateAsset = isAnorganik
        ? 'assets/images/qr_template_anorganik.png'
        : 'assets/images/qr_template_organik.png';

    // Original design canvas: 1182 x 1772 px (Rasio 10x15cm)
    final posterHeight = width * (1772.0 / 1182.0);
    final scaleX = width / 1182.0;
    final scaleY = posterHeight / 1772.0;

    // Koordinat QR Code resmi: left: 177.5, top: 1250.0, ukuran: 375x375
    final qrLeft = 177.5 * scaleX;
    final qrTop = 1250.0 * scaleY;
    final qrSize = 375.0 * scaleX;

    // Koordinat nomor seri resmi:
    final textLeft = (isAnorganik ? 632.0 : 648.0) * scaleX;
    final textTop = (isAnorganik ? 1618.0 : 1585.0) * scaleY;
    final textWidth = (isAnorganik ? 403.0 : 446.0) * scaleX;

    return Container(
      width: width,
      height: posterHeight,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            // 1. Foto Template Stiker Latar Belakang Resmi
            Positioned.fill(
              child: Image.asset(
                templateAsset,
                fit: BoxFit.fill,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: isAnorganik ? Colors.amber.shade100 : Colors.green.shade100,
                    child: Center(
                      child: Text(
                        item.kategoriNama,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                },
              ),
            ),

            // 2. Barcode QR Code di Posisi Resmi Stiker
            Positioned(
              left: qrLeft,
              top: qrTop,
              width: qrSize,
              height: qrSize,
              child: Container(
                color: Colors.white,
                padding: EdgeInsets.all(qrSize * 0.04),
                child: CustomPaint(
                  size: Size.square(qrSize),
                  painter: QrPainter(
                    data: item.qrCode,
                    version: QrVersions.auto,
                    gapless: false,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ),

            // 3. Teks Nomor Seri Barcode di Bawah Label
            Positioned(
              left: textLeft,
              top: textTop,
              width: textWidth,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  item.qrCode,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: isAnorganik ? 14 : 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
