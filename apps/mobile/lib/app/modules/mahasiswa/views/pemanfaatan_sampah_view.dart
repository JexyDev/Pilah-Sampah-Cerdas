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

class _PemanfaatanSampahViewState extends ConsumerState<PemanfaatanSampahView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // --- Form Pemanfaatan Sampah ---
  final _formKey1 = GlobalKey<FormState>();
  final _jumlahCtrl = TextEditingController(text: '5.0');
  final _lokasiCtrl = TextEditingController(text: 'Posko KKN / TPS3R RW');
  final _hasilProdukCtrl = TextEditingController(text: 'Pupuk Organik Cair');
  final _deskripsiCtrl = TextEditingController();

  String _jenisPemanfaatan = 'Kompos Organik';
  String _kategoriSampah = 'Organik';
  String _satuan = 'Kg/Hari';
  File? _selectedImage1;

  // --- Form Kegiatan Individu ---
  final _formKey2 = GlobalKey<FormState>();
  final _namaKegiatanCtrl = TextEditingController();
  final _lokasiKegiatanCtrl = TextEditingController();
  final _deskripsiKegiatanCtrl = TextEditingController();
  File? _selectedImage2;

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
    'Pemilahan Non-B3',
  ];

  final List<String> _satuanList = [
    'Kg/Hari',
    'Liter/Hari',
    'Unit/Hari',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  Future<void> _pickImage(bool isTab1) async {
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
        setState(() {
          if (isTab1) {
            _selectedImage1 = File(picked.path);
          } else {
            _selectedImage2 = File(picked.path);
          }
        });
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _jumlahCtrl.dispose();
    _lokasiCtrl.dispose();
    _hasilProdukCtrl.dispose();
    _deskripsiCtrl.dispose();
    _namaKegiatanCtrl.dispose();
    _lokasiKegiatanCtrl.dispose();
    _deskripsiKegiatanCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSubmit(bool isTab1) async {
    if (isTab1) {
      if (!_formKey1.currentState!.validate()) return;
    } else {
      if (!_formKey2.currentState!.validate()) return;
    }

    final user = ref.read(authProvider).user;
    final rwTarget = user?.rw.isNotEmpty == true ? 'RW ${user!.rw.split('/').last}' : '';

    late PemanfaatanSampahRequest request;

    final kelompokData = ref.read(kelompokKknProvider).kelompok;
    final dplTarget = kelompokData?.dosenPembimbing ?? '';

    if (isTab1) {
      request = PemanfaatanSampahRequest(
        jenisPemanfaatan: _jenisPemanfaatan,
        kategoriSampah: _kategoriSampah,
        jumlah: double.tryParse(_jumlahCtrl.text.trim()) ?? 1.0,
        satuan: _satuan,
        wilayahDampingan: '$rwTarget - ${_lokasiCtrl.text.trim()}',
        deskripsi: 'Hasil Produk: ${_hasilProdukCtrl.text.trim()} | Catatan: ${_deskripsiCtrl.text.trim()}',
        fotoPath: _selectedImage1?.path,
        rwTerkait: rwTarget,
        dplId: dplTarget,
      );
    } else {
      request = PemanfaatanSampahRequest(
        jenisPemanfaatan: _namaKegiatanCtrl.text.trim(),
        kategoriSampah: 'Kegiatan Individu', // Diset statis sebagai pembeda
        jumlah: 1.0,
        satuan: 'Kegiatan',
        wilayahDampingan: '$rwTarget - ${_lokasiKegiatanCtrl.text.trim()}',
        deskripsi: _deskripsiKegiatanCtrl.text.trim(),
        fotoPath: _selectedImage2?.path,
        rwTerkait: rwTarget,
        dplId: dplTarget,
      );
    }

    final success = await ref.read(pemanfaatanSampahProvider.notifier).submitLaporan(request);

    if (success && mounted) {
      ref.read(mahasiswaControllerProvider.notifier).fetchDashboardData();
      ref.read(kelompokKknProvider.notifier).fetchKelompok();

      final labelKegiatan = isTab1 ? 'Pemanfaatan Sampah' : 'Kegiatan Individu';

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppColors.primaryGreen, size: 28),
              SizedBox(width: 10),
              Expanded(child: Text('Laporan Terkirim!')),
            ],
          ),
          content: Text(
            'Data $labelKegiatan ($rwTarget) beserta foto berhasil disimpan.\n\nLaporan ini diteruskan ke DPL (Dosen Pembimbing Lapangan) untuk direviu.',
            style: const TextStyle(fontSize: 14, height: 1.4),
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

  Widget _buildPhotoUploader(bool isTab1) {
    final imageFile = isTab1 ? _selectedImage1 : _selectedImage2;
    return InkWell(
      onTap: () => _pickImage(isTab1),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        height: 140,
        decoration: BoxDecoration(
          color: AppColors.primaryGreen.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.35)),
        ),
        child: imageFile != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Stack(
                  children: [
                    Image.file(imageFile, width: double.infinity, height: 140, fit: BoxFit.cover),
                    Positioned(
                      right: 8,
                      top: 8,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        radius: 16,
                        child: IconButton(
                          icon: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                          onPressed: () => setState(() {
                            if (isTab1) {
                              _selectedImage1 = null;
                            } else {
                              _selectedImage2 = null;
                            }
                          }),
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
    );
  }

  Widget _buildTab1Pemanfaatan() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 80.0), // Padding bawah agar tidak kehalang tombol
      child: Form(
        key: _formKey1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                      'Input hasil pemanfaatan sampah KKN (kompos, kerajinan, daur ulang). Data otomatis tersinkron ke DPL.',
                      style: TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              shadowColor: Colors.black.withValues(alpha: 0.06),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Jenis Pemanfaatan Sampah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _jenisPemanfaatan,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      items: _jenisList.map((j) => DropdownMenuItem(value: j, child: Text(j, style: const TextStyle(fontSize: 13)))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _jenisPemanfaatan = val);
                      },
                    ),
                    const SizedBox(height: 20),

                    const Text('Kategori Sampah Utama', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _kategoriSampah,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.category_rounded, color: AppColors.primaryGreen, size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      items: _kategoriList.map((k) => DropdownMenuItem(value: k, child: Text(k, style: const TextStyle(fontSize: 13)))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _kategoriSampah = val);
                      },
                    ),
                    const SizedBox(height: 20),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
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
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
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
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 1,
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
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
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
                    const SizedBox(height: 20),

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
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Lokasi pemanfaatan wajib diisi';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

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
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Deskripsi wajib diisi';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    const Text('Foto Bukti Pemanfaatan (Opsional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    _buildPhotoUploader(true),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab2KegiatanIndividu() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 80.0), // Padding bawah mentok
      child: Form(
        key: _formKey2,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryBlue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.assignment_ind_rounded, color: AppColors.primaryBlue, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Input laporan kegiatan individu Anda. Anda dapat mengetik manual laporannya. Foto dan data akan diteruskan ke DPL.',
                      style: TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              shadowColor: Colors.black.withValues(alpha: 0.06),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Nama / Judul Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _namaKegiatanCtrl,
                      decoration: InputDecoration(
                        hintText: 'Misal: Sosialisasi Warga RW 02',
                        hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
                        prefixIcon: const Icon(Icons.event_note_rounded, color: AppColors.primaryGreen, size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Nama kegiatan wajib diisi';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    const Text('Lokasi Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _lokasiKegiatanCtrl,
                      decoration: InputDecoration(
                        hintText: 'Misal: Balai Desa / Kantor RW',
                        hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
                        prefixIcon: const Icon(Icons.location_on_rounded, color: AppColors.primaryGreen, size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Lokasi kegiatan wajib diisi';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    const Text('Deskripsi Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _deskripsiKegiatanCtrl,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Tuliskan deskripsi lengkap kegiatan individu Anda...',
                        hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Deskripsi kegiatan wajib diisi';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    const Text('Foto Dokumentasi (Opsional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    _buildPhotoUploader(false),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pemanfaatanSampahProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Kegiatan Mahasiswa',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Pemanfaatan Sampah'),
            Tab(text: 'Kegiatan Individu'),
          ],
        ),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tabController,
            children: [
              _buildTab1Pemanfaatan(),
              _buildTab2KegiatanIndividu(),
            ],
          ),
          
          if (state.error != null) 
            Positioned(
              top: 16, left: 16, right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.dangerRed.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(state.error!, style: const TextStyle(fontSize: 12, color: Colors.white))),
                  ],
                ),
              ),
            ),

        ],
      ),
      bottomNavigationBar: Container(
        color: AppColors.backgroundCanvas,
        child: SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.backgroundCanvas,
              border: Border(top: BorderSide(color: Colors.grey.shade300)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                onPressed: state.isLoading ? null : () => _onSubmit(_tabController.index == 0),
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
                            'KIRIM LAPORAN',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

