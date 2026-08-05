import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/petugas_residu_controller.dart';

class RiwayatPetugasResiduView extends ConsumerStatefulWidget {
  const RiwayatPetugasResiduView({super.key});

  @override
  ConsumerState<RiwayatPetugasResiduView> createState() => _RiwayatPetugasResiduViewState();
}

class _RiwayatPetugasResiduViewState extends ConsumerState<RiwayatPetugasResiduView> {
  String _dateRange = 'HARI_INI';
  String _typeFilter = 'SEMUA';

  String _formatDateTime(String? rawStr) {
    if (rawStr == null || rawStr.isEmpty || rawStr == '-') return '-';
    try {
      final dt = DateTime.parse(rawStr).toLocal();
      return DateFormat('yyyy-MM-dd HH:mm', 'id_ID').format(dt) + ' WIB';
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
    final addr = item['address']?.toString() ??
        item['alamat']?.toString() ??
        item['location']?.toString() ??
        item['lokasi']?.toString() ??
        item['rtRwName']?.toString() ??
        item['assignedZone']?.toString();
    if (addr != null && addr.isNotEmpty && addr != '-') return addr;
    return 'Wilayah Penugasan Petugas';
  }

  String _resolveWargaName(Map<String, dynamic> item) {
    final name = item['wargaName']?.toString() ??
        item['namaWarga']?.toString() ??
        item['citizenName']?.toString() ??
        item['userName']?.toString() ??
        item['subtitle']?.toString();
    if (name != null && name.isNotEmpty && name != '-') return name;
    return 'Warga Binaan (Umum)';
  }

  void _showDetailModal(Map<String, dynamic> item) {
    final rawDate = item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString();
    final formattedDate = _formatDateTime(rawDate);
    final alamat = _resolveAlamat(item);
    final warga = _resolveWargaName(item);

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
                      color: AppColors.primaryGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.scale_rounded,
                      color: AppColors.primaryGreen,
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
              _infoRow('Lokasi / Alamat', alamat),
              _infoRow('Berat Fisik', '${item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0} Kg'),
              _infoRow('Klasifikasi', item['classification']?.toString() ?? item['kategori']?.toString() ?? item['type']?.toString() ?? '-'),
              _infoRow('Warga', warga),
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
    final state = ref.watch(petugasResiduControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Riwayat Tugas & Pelanggaran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: Column(
          children: [
            // Filter Bar
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: AppDimensions.sm),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _dateRange,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        labelText: 'Tanggal',
                        labelStyle: TextStyle(fontSize: 12),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'HARI_INI', child: Text('Hari Ini', style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'MINGGU_INI', child: Text('Minggu Ini', style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'BULAN_INI', child: Text('Bulan Ini', style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                      ],
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _dateRange = v);
                          ref.read(petugasResiduControllerProvider.notifier).setHistoryFilters(dateRange: v);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _typeFilter,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        labelText: 'Jenis Log',
                        labelStyle: TextStyle(fontSize: 12),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'SEMUA', child: Text('Semua Log', style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'SETORAN', child: Text('Setoran Timbangan', style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                      ],
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _typeFilter = v);
                          ref.read(petugasResiduControllerProvider.notifier).setHistoryFilters(type: v);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // List History
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                  : state.historyList.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_toggle_off_rounded, size: 56, color: AppColors.textHint),
                              SizedBox(height: 12),
                              Text('Belum ada riwayat aktivitas tugas', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(AppDimensions.md),
                          itemCount: state.historyList.length,
                          itemBuilder: (ctx, index) {
                            final item = state.historyList[index];
                            final title = item['title']?.toString() ?? item['classification']?.toString() ?? item['kategori']?.toString() ?? 'Setoran Timbangan';
                            final subtitle = _resolveWargaName(item);
                            final address = _resolveAlamat(item);
                            final weight = item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 1,
                              child: ListTile(
                                onTap: () => _showDetailModal(item),
                                leading: CircleAvatar(
                                  backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.12),
                                  child: const Icon(
                                    Icons.scale_rounded,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                                title: Text(
                                  title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    const SizedBox(height: 2),
                                    Text(address, style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.green[50],
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '$weight Kg',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Icon(Icons.chevron_right, size: 16, color: AppColors.textHint),
                                  ],
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
