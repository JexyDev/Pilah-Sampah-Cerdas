import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../controllers/pemanfaatan_sampah_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../../auth/controllers/auth_controller.dart';

class PemanfaatanSampahView extends ConsumerStatefulWidget {
  const PemanfaatanSampahView({super.key});

  @override
  ConsumerState<PemanfaatanSampahView> createState() => _PemanfaatanSampahViewState();
}

class _PemanfaatanSampahViewState extends ConsumerState<PemanfaatanSampahView> {
  final _formKey = GlobalKey<FormState>();
  final _jumlahCtrl = TextEditingController(text: '5.0');
  final _lokasiCtrl = TextEditingController(text: 'Posko KKN / TPS3R RW');
  final _hasilProdukCtrl = TextEditingController(text: 'Pupuk Organik Cair');
  final _deskripsiCtrl = TextEditingController();

  String _jenisPemanfaatan = 'Kompos Organik';
  String _kategoriSampah = 'Organik';
  String _satuan = 'Kg/Hari';

  final List<String> _jenisList = [
    'Kompos Organik',
    'Kerajinan Daur Ulang',
    'Pakan Maggot/Organik',
    'Eco-Enzyme',
    'Penjualan Bank Sampah',
    'Biogas / Energi',
  ];

  final List<String> _kategoriList = [
    'Organik',
    'Anorganik',
    'Daur Ulang Plastik/Kertas',
    'Residu Non-B3',
  ];

  final List<String> _satuanList = [
    'Kg/Hari',
    'Liter/Hari',
    'Unit/Hari',
  ];

  @override
  void dispose() {
    _jumlahCtrl.dispose();
    _lokasiCtrl.dispose();
    _hasilProdukCtrl.dispose();
    _deskripsiCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final user = ref.read(authProvider).user;
    final rwTarget = user?.rtRw.isNotEmpty == true ? 'RW ${user!.rtRw.split('/').last}' : 'RW 02';

    final request = PemanfaatanSampahRequest(
      jenisPemanfaatan: _jenisPemanfaatan,
      kategoriSampah: _kategoriSampah,
      jumlah: double.tryParse(_jumlahCtrl.text.trim()) ?? 1.0,
      satuan: _satuan,
      wilayahDampingan: '$rwTarget - ${_lokasiCtrl.text.trim()}',
      deskripsi: 'Hasil Produk: ${_hasilProdukCtrl.text.trim()} | Catatan: ${_deskripsiCtrl.text.trim()}',
    );

    final success = await ref.read(pemanfaatanSampahProvider.notifier).submitLaporan(request);

    if (success && mounted) {
      // Refresh dashboard & kelompok KKN points
      ref.read(mahasiswaControllerProvider.notifier).fetchDashboardData();
      ref.read(kelompokKknProvider.notifier).fetchKelompok();

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppColors.primaryGreen, size: 28),
              SizedBox(width: 10),
              Text('Laporan Terkirim!'),
            ],
          ),
          content: Text(
            'Data pemanfaatan sampah ($rwTarget) berhasil disimpan ke sistem dan tercatat di Web Monitoring.',
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pemanfaatanSampahProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Input Pemanfaatan Sampah',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primaryGreen, AppColors.primaryBlueDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner Penjelasan
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.recycling_rounded, color: AppColors.primaryGreen, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Input hasil pemanfaatan sampah KKN (kompos, kerajinan, daur ulang) langsung dari mobile. Data otomatis tersinkron ke Web Monitoring DLH.',
                        style: TextStyle(fontSize: 12, color: AppColors.primaryBlueDark, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (state.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.dangerRed),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.dangerRed, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          state.error!,
                          style: const TextStyle(fontSize: 12, color: AppColors.dangerRed),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Card Form Body
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Dropdown Jenis Pemanfaatan
                      const Text('Jenis Pemanfaatan Sampah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _jenisPemanfaatan,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.nature_people_rounded, color: AppColors.textSecondary, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: _jenisList.map((j) => DropdownMenuItem(value: j, child: Text(j))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _jenisPemanfaatan = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // Dropdown Kategori Sampah
                      const Text('Kategori Sampah Utama', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _kategoriSampah,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.category_outlined, color: AppColors.textSecondary, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: _kategoriList.map((k) => DropdownMenuItem(value: k, child: Text(k))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _kategoriSampah = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // Row Jumlah & Satuan
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Jumlah / Volume', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _jumlahCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  decoration: InputDecoration(
                                    prefixIcon: const Icon(Icons.scale_rounded, color: AppColors.textSecondary, size: 20),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                                    if (double.tryParse(v.trim()) == null) return 'Input angka tidak valid';
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Satuan Unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  initialValue: _satuan,
                                  decoration: InputDecoration(
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  items: _satuanList.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _satuan = val);
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Lokasi Pemanfaatan
                      const Text('Lokasi / Tempat Pemanfaatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _lokasiCtrl,
                        decoration: InputDecoration(
                          hintText: 'Misal: Posko KKN / TPS3R RW',
                          prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.textSecondary, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Lokasi pemanfaatan wajib diisi';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Deskripsi Pemanfaatan
                      const Text('Deskripsi & Catatan Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _deskripsiCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'Tuliskan deskripsi singkat pembuatan atau hasil pemanfaatan sampah...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Deskripsi wajib diisi';
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 2,
                  ),
                  onPressed: state.isLoading ? null : _onSubmit,
                  child: state.isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'KIRIM LAPORAN PEMANFAATAN',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
