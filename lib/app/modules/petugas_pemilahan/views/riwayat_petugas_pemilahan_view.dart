import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/petugas_pemilahan_controller.dart';

class RiwayatPetugasPemilahanView extends ConsumerStatefulWidget {
  const RiwayatPetugasPemilahanView({super.key});

  @override
  ConsumerState<RiwayatPetugasPemilahanView> createState() => _RiwayatPetugasPemilahanViewState();
}

class _RiwayatPetugasPemilahanViewState extends ConsumerState<RiwayatPetugasPemilahanView> {
  String _dateRange = 'HARI_INI';
  String _typeFilter = 'SEMUA';

  Widget _buildFilterTab(String label, String value) {
    final isSelected = _typeFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() => _typeFilter = value);
        ref.read(petugasPemilahanControllerProvider.notifier).setHistoryFilters(dateRange: _dateRange, type: value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? null : Border.all(color: AppColors.primaryGreen),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.primaryGreen,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  String _formatDateTime(String? rawStr) {
    if (rawStr == null || rawStr.isEmpty || rawStr == '-') return '-';
    try {
      final dt = DateTime.parse(rawStr).toLocal();
      return '${DateFormat('d MMMM yyyy, HH:mm', 'id_ID').format(dt)} WIB';
    } catch (_) {
      if (rawStr.contains('T')) {
        final parts = rawStr.split('T');
        final datePart = parts[0];
        final timePart = parts[1].split('.')[0].split('Z')[0];
        return '$datePart $timePart WIB';
      }
      return rawStr;
    }
  }

  String _resolveAlamat(Map<String, dynamic> item) {
    if (item['latitude'] != null && item['longitude'] != null) {
      return '${item['latitude']}, ${item['longitude']}';
    }
    final addr = item['address']?.toString() ??
        item['alamat']?.toString() ??
        item['location']?.toString() ??
        item['lokasi']?.toString() ??
        item['rtRwName']?.toString() ??
        item['assignedZone']?.toString();
    if (addr != null && addr.isNotEmpty && addr != '-') return addr;
    return '-';
  }

  String _resolveWargaName(Map<String, dynamic> item) {
    final name = item['wargaName']?.toString() ??
        item['namaWarga']?.toString() ??
        item['citizenName']?.toString() ??
        item['userName']?.toString() ??
        item['subtitle']?.toString();
    if (name != null && name.isNotEmpty && name != '-') return name;
    return '-';
  }

  void _showDetailModal(Map<String, dynamic> item) {
    final rawDate = item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString();
    final formattedDate = _formatDateTime(rawDate);
    final alamat = _resolveAlamat(item);

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.residuColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.scale_rounded,
                        color: AppColors.residuColor,
                        size: 24,
                      ),
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item['title']?.toString() ?? item['classification']?.toString() ?? 'Setoran Timbangan',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              _infoRow('Waktu Submit', formattedDate),
              _infoRow('Koordinat GPS', alamat),
              _infoRow('Berat Fisik', '${item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0} Kg'),
              _infoRow('Klasifikasi', item['classification']?.toString() ?? item['kategori']?.toString() ?? item['type']?.toString() ?? '-'),
              _infoRow('Status Server', item['status']?.toString() ?? 'TERKIRIM'),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlueDark,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Tutup', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 115,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(petugasPemilahanControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Riwayat Tugas', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.primaryGreen)),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: Column(
          children: [
            // Filter Tabs (Semua, Non Poin, Poin)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  _buildFilterTab('Semua Aktivitas', 'SEMUA'),
                  const SizedBox(width: 8),
                  _buildFilterTab('Riwayat Non Poin', 'NON_POIN'),
                  const SizedBox(width: 8),
                  _buildFilterTab('Riwayat Perolehan Poin', 'POIN'),
                ],
              ),
            ),
            
            // Filter Bar Waktu
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: DropdownButtonFormField<String>(
                initialValue: _dateRange,
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down, size: 20, color: AppColors.textSecondary),
                dropdownColor: Colors.white,
                menuMaxHeight: 300,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  labelText: 'Pilih Waktu Riwayat',
                  labelStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  filled: true,
                  fillColor: AppColors.backgroundCanvas,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                items: const [
                  DropdownMenuItem(value: 'HARI_INI', child: Text('Hari Ini', overflow: TextOverflow.ellipsis)),
                  DropdownMenuItem(value: 'MINGGU_INI', child: Text('Minggu Ini', overflow: TextOverflow.ellipsis)),
                  DropdownMenuItem(value: 'BULAN_INI', child: Text('Bulan Ini', overflow: TextOverflow.ellipsis)),
                ],
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _dateRange = v);
                    ref.read(petugasPemilahanControllerProvider.notifier).setHistoryFilters(dateRange: v, type: _typeFilter);
                  }
                },
              ),
            ),
            // Remove excessive SizedBox to bring History list closer to the filter
            
            // List History
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                  : state.historyList.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_rounded, size: 56, color: AppColors.textHint),
                              SizedBox(height: 12),
                              Text('Belum ada riwayat aktivitas tugas', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 4, bottom: 100),
                          itemCount: state.historyList.length,
                          itemBuilder: (ctx, index) {
                            final item = state.historyList[index];
                            final title = item['title']?.toString() ?? item['classification']?.toString() ?? item['kategori']?.toString() ?? 'Setoran Timbangan';
                            final subtitle = _resolveWargaName(item);
                            final address = _resolveAlamat(item);
                            final weight = item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0;
                            
                            final rawDate = item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString();
                            final formattedDate = _formatDateTime(rawDate);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () => _showDetailModal(item),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: AppColors.residuColor.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: const Icon(Icons.scale_rounded, color: AppColors.residuColor, size: 24),
                                        ),
                                        const SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      title,
                                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: AppColors.residuColor.withValues(alpha: 0.1),
                                                      borderRadius: BorderRadius.circular(8),
                                                    ),
                                                    child: Text(
                                                      '$weight Kg',
                                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.residuColor),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              if (item['points'] != null && item['points'] > 0)
                                                Container(
                                                  margin: const EdgeInsets.only(bottom: 6),
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.warningOrange.withValues(alpha: 0.1),
                                                    borderRadius: BorderRadius.circular(12),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      const Icon(Icons.stars_rounded, color: AppColors.warningOrange, size: 14),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        '+${item['points']}',
                                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.warningOrange),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              if (subtitle.isNotEmpty && subtitle != '-')
                                                Row(
                                                  children: [
                                                    const Icon(Icons.person_rounded, size: 14, color: AppColors.textSecondary),
                                                    const SizedBox(width: 4),
                                                    Expanded(child: Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                                  ],
                                                ),
                                              if (subtitle.isNotEmpty && subtitle != '-') const SizedBox(height: 4),
                                              if (address.isNotEmpty && address != '-')
                                                Row(
                                                  children: [
                                                    const Icon(Icons.location_on_rounded, size: 14, color: AppColors.textSecondary),
                                                    const SizedBox(width: 4),
                                                    Expanded(child: Text(address, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                                  ],
                                                ),
                                              if (formattedDate.isNotEmpty && formattedDate != '-')
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 8),
                                                  child: Text(formattedDate, style: const TextStyle(fontSize: 11, color: AppColors.textHint, fontWeight: FontWeight.w500)),
                                                ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

