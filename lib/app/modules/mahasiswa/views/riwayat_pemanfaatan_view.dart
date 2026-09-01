import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../riwayat/controllers/riwayat_controller.dart' show pointHistoryProvider;
import 'package:intl/intl.dart';
import '../../../routes/app_routes.dart';


final riwayatPemanfaatanProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return await repo.getPemanfaatanLogs();
});

class RiwayatPemanfaatanView extends ConsumerWidget {
  const RiwayatPemanfaatanView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(riwayatPemanfaatanProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Data Pemanfaatan & Hasil'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),

      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 10, offset: const Offset(0, -5)),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.logbookPemanfaatan),
                  icon: const Icon(Icons.recycling, size: 18, color: Colors.white),
                  label: const Text('Lapor Pemanfaatan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.catatPanen),
                  icon: const Icon(Icons.eco, size: 18, color: Colors.white),
                  label: const Text('Catat Hasil', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Gagal memuat data: ${err.toString()}', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(riwayatPemanfaatanProvider),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
        data: (data) {
          if (data.isEmpty) {
            return const Center(child: Text('Belum ada riwayat pemanfaatan/hasil'));
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(riwayatPemanfaatanProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final item = data[index] as Map<String, dynamic>;
                return _buildHistoryCard(context, ref, item);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, WidgetRef ref, Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final namaProgram = item['namaProgram']?.toString() ?? 'Program Pemanfaatan';
    final jenisProgram = item['jenisProgram']?.toString() ?? '';
    final bahanMasuk = item['jumlahBahanMasukKg'] ?? 0;
    final hasil = item['jumlahHasilKg'] ?? 0;
    final unit = item['unitHasil']?.toString() ?? 'Kg';
    final status = item['status']?.toString() ?? 'PROSES';
    
    DateTime? tgl;
    if (item['tanggalPencatatan'] != null) {
      tgl = DateTime.tryParse(item['tanggalPencatatan'].toString())?.toLocal();
    }
    final tglStr = tgl != null ? DateFormat('dd MMM yyyy, HH:mm').format(tgl) : '-';

    final isPanen = status == 'PANEN';
    final displayStatus = isPanen ? 'Laporan Pemanfaatan Akhir' : 'Laporan Pemanfaatan Awal';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    namaProgram,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPanen ? AppColors.primaryGreen.withAlpha(26) : AppColors.primaryBlue.withAlpha(26),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    displayStatus,
                    style: TextStyle(
                      color: isPanen ? AppColors.primaryGreen : AppColors.primaryBlue,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Teknologi: $jenisProgram', style: const TextStyle(fontSize: 13, color: Colors.black87)),
            Text('Input Sampah: $bahanMasuk Kg', style: const TextStyle(fontSize: 13, color: Colors.black87)),
            if (isPanen) Text('Total Hasil: $hasil $unit', style: const TextStyle(fontSize: 13, color: Colors.black87)),
            Text('Tanggal: $tglStr', style: const TextStyle(fontSize: 13, color: Colors.black54)),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (!isPanen) ...[
                  TextButton.icon(
                    onPressed: () => _showEditPemanfaatanDialog(context, ref, item),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit Input'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                if (isPanen) ...[
                  TextButton.icon(
                    onPressed: () => _showEditPanenDialog(context, ref, item),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit Hasil'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                TextButton.icon(
                  onPressed: () => _confirmDelete(context, ref, id, isPanen),
                  icon: const Icon(Icons.delete, size: 16),
                  label: const Text('Hapus'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,
                    
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, String id, bool isPanen) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi Hapus'),
        content: const Text('Apakah Anda yakin ingin menghapus data ini? Poin seluruh anggota kelompok akan ditarik kembali.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                if (isPanen) {
                  await repo.deletePanenHasil(id);
                } else {
                  await repo.deleteLogbookPemanfaatan(id);
                }
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil dihapus')));
                }
                ref.invalidate(riwayatPemanfaatanProvider);
                ref.invalidate(pointHistoryProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  void _showEditPemanfaatanDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> item) {
    final id = item['id'].toString();
    final tcTeknologi = TextEditingController(text: item['jenisProgram']?.toString());
    final tcBerat = TextEditingController(text: item['jumlahBahanMasukKg']?.toString());
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Laporan Awal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Metode / Teknologi', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 4),
              TextField(
                controller: tcTeknologi,
                decoration: InputDecoration(
                  isDense: true,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Berat Sampah (Kg)', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 4),
              TextField(
                controller: tcBerat,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Maks. 50',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
        actionsPadding: const EdgeInsets.only(right: 16, bottom: 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            onPressed: () async {
              final val = double.tryParse(tcBerat.text) ?? 0;
              if (val <= 0 || val > 50) {
                ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Berat harus antara 0 - 50 Kg')));
                return;
              }
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                await repo.updateLogbookPemanfaatan(id, {
                  'teknologi': tcTeknologi.text,
                  'volumeBahanBaku': val,
                });
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil diupdate')));
                }
                ref.invalidate(riwayatPemanfaatanProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Simpan', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showEditPanenDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> item) {
    final id = item['id'].toString();
    final tcHasil = TextEditingController(text: item['jumlahHasilKg']?.toString());
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Laporan Akhir', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Jumlah Hasil (Kg/Liter)', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 4),
              TextField(
                controller: tcHasil,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Maks. 100',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
        actionsPadding: const EdgeInsets.only(right: 16, bottom: 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            onPressed: () async {
              final val = double.tryParse(tcHasil.text) ?? 0;
              if (val <= 0 || val > 100) {
                ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Hasil harus antara 0 - 100')));
                return;
              }
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                await repo.updatePanenHasil(id, {
                  'hasil': val,
                });
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil diupdate')));
                }
                ref.invalidate(riwayatPemanfaatanProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Simpan', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
