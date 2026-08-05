import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
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
  File? _selectedImage;

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

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primaryGreen),
              title: const Text('Kamera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppColors.primaryGreen),
              title: const Text('Galeri HP'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source != null) {
      final picked = await picker.pickImage(source: source, imageQuality: 80);
      if (picked != null) {
        setState(() => _selectedImage = File(picked.path));
      }
    }
  }

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
      fotoPath: _selectedImage?.path,
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
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
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
                  color: AppColors.primaryGreen.withValues(alpha: 0.08),
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
                        style: TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.35),
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
                shadowColor: Colors.black.withValues(alpha: 0.06),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Dropdown Jenis Pemanfaatan
                      const Text('Jenis Pemanfaatan Sampah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _jenisPemanfaatan,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 20),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                        ),
                        items: _jenisList.map((j) => DropdownMenuItem(value: j, child: Text(j, style: const TextStyle(fontSize: 13)))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _jenisPemanfaatan = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // Dropdown Kategori Sampah
                      const Text('Kategori Sampah Utama', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _kategoriSampah,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.category_rounded, color: AppColors.primaryGreen, size: 20),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                        ),
                        items: _kategoriList.map((k) => DropdownMenuItem(value: k, child: Text(k, style: const TextStyle(fontSize: 13)))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _kategoriSampah = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // Row Jumlah & Satuan
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Jumlah / Volume', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _jumlahCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  decoration: InputDecoration(
                                    prefixIcon: const Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 20),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: AppColors.border),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                                    ),
                                  ),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                                    if (double.tryParse(v.trim()) == null) return 'Input tidak valid';
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
                                const Text('Satuan Unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  initialValue: _satuan,
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: AppColors.border),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                                    ),
                                  ),
                                  items: _satuanList.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
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
                      const Text('Lokasi / Tempat Pemanfaatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _lokasiCtrl,
                        decoration: InputDecoration(
                          hintText: 'Misal: Posko KKN / TPS3R RW',
                          hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
                          prefixIcon: const Icon(Icons.location_on_rounded, color: AppColors.primaryGreen, size: 20),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Lokasi pemanfaatan wajib diisi';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Deskripsi Pemanfaatan
                      const Text('Deskripsi & Catatan Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _deskripsiCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'Tuliskan deskripsi singkat pembuatan atau hasil pemanfaatan sampah...',
                          hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Deskripsi wajib diisi';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Foto Bukti Pemanfaatan Sampah
                      const Text('Foto Bukti Pemanfaatan (Opsional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: _pickImage,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: double.infinity,
                          height: 140,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.35)),
                          ),
                          child: _selectedImage != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Stack(
                                    children: [
                                      Image.file(_selectedImage!, width: double.infinity, height: 140, fit: BoxFit.cover),
                                      Positioned(
                                        right: 8,
                                        top: 8,
                                        child: CircleAvatar(
                                          backgroundColor: Colors.black54,
                                          radius: 16,
                                          child: IconButton(
                                            icon: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                                            onPressed: () => setState(() => _selectedImage = null),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.add_a_photo_rounded, size: 36, color: AppColors.primaryGreen),
                                    SizedBox(height: 8),
                                    Text('Ketuk untuk Ambil / Upload Foto Bukti', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                                  ],
                                ),
                        ),
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
