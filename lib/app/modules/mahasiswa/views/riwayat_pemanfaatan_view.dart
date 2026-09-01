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
                  label: const Text('Lapor Data', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    elevation: 0,
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                    shape: const StadiumBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.catatPanen),
                  icon: const Icon(Icons.eco, size: 18, color: Colors.white),
                  label: const Text('Catat Hasil', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    elevation: 0,
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                    shape: const StadiumBorder(),
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
    final displayStatus = isPanen ? 'Catatan Hasil Akhir' : 'Laporan Pemanfaatan Awal';

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
    Navigator.push(context, MaterialPageRoute(builder: (_) => EditPemanfaatanScreen(item: item))).then((_) {
      // ignore: unused_result
      ref.refresh(riwayatPemanfaatanProvider);
    });
  }

  void _showEditPanenDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> item) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => EditPanenScreen(item: item))).then((_) {
      // ignore: unused_result
      ref.refresh(riwayatPemanfaatanProvider);
    });
  }
}

// ----------------------------------------------------------------------
// Dedicated Screens for Editing
// ----------------------------------------------------------------------

class EditPemanfaatanScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> item;
  const EditPemanfaatanScreen({super.key, required this.item});

  @override
  ConsumerState<EditPemanfaatanScreen> createState() => _EditPemanfaatanScreenState();
}

class _EditPemanfaatanScreenState extends ConsumerState<EditPemanfaatanScreen> {
  final _formKey = GlobalKey<FormState>();
  
  List<Map<String, dynamic>> _programList = [];
  bool _isLoading = true;
  String? _selectedProgram;

  late TextEditingController tcKategori;
  late TextEditingController tcTeknologi;
  late TextEditingController tcBerat;
  late TextEditingController tcUnit;
  
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    tcKategori = TextEditingController(text: widget.item['bahanBaku']?.toString() ?? '');
    tcTeknologi = TextEditingController(text: widget.item['jenisProgram']?.toString() ?? '');
    tcBerat = TextEditingController(text: widget.item['jumlahBahanMasukKg']?.toString() ?? '');
    tcUnit = TextEditingController(text: widget.item['unitBahanBaku']?.toString() ?? 'Kg');
    _loadPrograms();
  }

  Future<void> _loadPrograms() async {
    try {
      final repo = ref.read(kknRepositoryProvider);
      final progs = await repo.getProgramKerja();
      if (mounted) {
        setState(() {
          _programList = progs;
          _isLoading = false;
          
          final currentProg = widget.item['namaProgram']?.toString() ?? '';
          if (_programList.any((p) => (p['judul']?.toString() ?? '') == currentProg)) {
            _selectedProgram = currentProg;
          } else if (_programList.isNotEmpty) {
            // let it be null
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProgram == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih program terlebih dahulu')));
      return;
    }

    setState(() => _isSubmitting = true);
    final val = double.tryParse(tcBerat.text) ?? 0;
    
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.updateLogbookPemanfaatan(widget.item['id'].toString(), {
        'program': _selectedProgram,
        'bahanBaku': tcKategori.text,
        'teknologi': tcTeknologi.text,
        'volumeBahanBaku': val,
        'unitBahanBaku': tcUnit.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil diupdate'), backgroundColor: AppColors.primaryGreen));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal mengupdate. Silakan coba lagi.'), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Laporan Awal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Program Pemanfaatan', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedProgram,
                    isExpanded: true,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    hint: const Text('Pilih Program'),
                    items: _programList.map((p) {
                      final title = p['judul']?.toString() ?? 'Tanpa Judul';
                      return DropdownMenuItem(value: title, child: Text(title));
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedProgram = val),
                    validator: (val) => val == null ? 'Wajib dipilih' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  const Text('Kategori / Bahan Baku', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: tcKategori,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  const Text('Metode / Teknologi', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: tcTeknologi,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Volume / Berat', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: tcBerat,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                              validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Unit', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: tcUnit,
                              decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                              validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                      child: _isSubmitting 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Simpan Perubahan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }
}

class EditPanenScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> item;
  const EditPanenScreen({super.key, required this.item});

  @override
  ConsumerState<EditPanenScreen> createState() => _EditPanenScreenState();
}

class _EditPanenScreenState extends ConsumerState<EditPanenScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController tcHasil;
  late TextEditingController tcNilaiEkonomi;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    tcHasil = TextEditingController(text: widget.item['jumlahHasilKg']?.toString() ?? '');
    tcNilaiEkonomi = TextEditingController(text: widget.item['luasLahanM2']?.toString() ?? '');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSubmitting = true);
    final valHasil = double.tryParse(tcHasil.text) ?? 0;
    final valEkonomi = double.tryParse(tcNilaiEkonomi.text) ?? 0;
    
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.updatePanenHasil(widget.item['id'].toString(), {
        'hasil': valHasil,
        'luasLahanM2': valEkonomi,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil diupdate'), backgroundColor: AppColors.primaryGreen));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal mengupdate. Silakan coba lagi.'), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Laporan Akhir', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Jumlah Hasil Output', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: tcHasil,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Nilai Ekonomi (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: tcNilaiEkonomi,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  child: _isSubmitting 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan Perubahan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
