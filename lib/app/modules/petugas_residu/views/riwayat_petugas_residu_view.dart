import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  void _showDetailModal(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(20),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.scale_rounded,
                  color: AppColors.primaryGreen,
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item['title']?.toString() ?? item['classification']?.toString() ?? 'Setoran Timbangan',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _infoRow('Waktu Submit', item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString() ?? '-'),
            _infoRow('Lokasi / Alamat', item['address']?.toString() ?? item['alamat']?.toString() ?? '-'),
            _infoRow('Berat Fisik', '${item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0} Kg'),
            _infoRow('Klasifikasi', item['classification']?.toString() ?? item['kategori']?.toString() ?? '-'),
            _infoRow('Warga', item['wargaName']?.toString() ?? item['namaWarga']?.toString() ?? '-'),
            _infoRow('Status Server', item['status']?.toString() ?? 'TERKIRIM'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlueDark,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Tutup', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
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
                            final subtitle = item['subtitle']?.toString() ?? item['wargaName']?.toString() ?? item['namaWarga']?.toString() ?? item['binCode']?.toString() ?? '';
                            final address = item['address']?.toString() ?? item['alamat']?.toString() ?? '';
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
