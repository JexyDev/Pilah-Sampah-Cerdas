import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../riwayat/controllers/riwayat_controller.dart' show pointHistoryProvider;
import '../controllers/mahasiswa_notifikasi_controller.dart';
import 'riwayat_program_kerja_view.dart'; // import provider untuk dropdown program kerja

final fasilitasWargaListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getFasilitasWarga();
});

class LogbookPemanfaatanView extends ConsumerStatefulWidget {
  const LogbookPemanfaatanView({super.key});

  @override
  ConsumerState<LogbookPemanfaatanView> createState() => _LogbookPemanfaatanViewState();
}

class _LogbookPemanfaatanViewState extends ConsumerState<LogbookPemanfaatanView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedProkerId;
  String? _selectedFasilitasId;
  final _teknologiCtrl = TextEditingController();
  final _bahanBakuCtrl = TextEditingController();
  final _beratInputCtrl = TextEditingController();
  File? _selectedImage;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProkerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Program Kerja terlebih dahulu.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitLogbookPemanfaatan({
        'programKerjaId': _selectedProkerId,
        if (_selectedFasilitasId != null) 'fasilitasId': _selectedFasilitasId,
        'teknologi': _teknologiCtrl.text.trim(),
        'bahanBaku': _bahanBakuCtrl.text.trim(),
        'beratInputKg': double.tryParse(_beratInputCtrl.text.trim()) ?? 0,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        // 1. Tampilkan Notifikasi Latar Belakang (Push Notification Local)
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
          title: 'Kegiatan Berhasil Dicatat! 🎉',
          body: 'Laporan kegiatan/aksi KKN Anda telah disubmit dan mendapatkan poin KKN.',
          color: AppColors.primaryGreen,
          payload: 'ROUTE_POIN',
        );

        // 2. Invalidate Data Poin dan Notifikasi agar langsung update
        ref.invalidate(pointHistoryProvider);
        ref.invalidate(mahasiswaNotificationsProvider);

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Berhasil mencatat aksi harian!'),
          backgroundColor: AppColors.success,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.dangerRed,
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _teknologiCtrl.dispose();
    _bahanBakuCtrl.dispose();
    _beratInputCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final prokerState = ref.watch(programKerjaListProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Laporan Kegiatan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeaderBanner(),
              const SizedBox(height: 16),
              
              _buildSectionCard(
                title: 'Data Program',
                icon: Icons.assignment_rounded,
                children: [
                  const Text('Pilih Program (Hanya yang di-ACC)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  prokerState.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
                    error: (e, _) => Text(e.toString(), style: const TextStyle(color: AppColors.dangerRed)),
                    data: (list) {
                      final approvedProker = list.where((p) {
                        final isApproved = p['status'] == 'APPROVED' || p['statusUsulan'] == 'APPROVED';
                        final isSelesai = p['statusPelaksanaan'] == 'SELESAI' || p['status_pelaksanaan'] == 'SELESAI' || p['status'] == 'SELESAI';
                        return isApproved && !isSelesai;
                      }).toList();
                      if (approvedProker.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.dangerRed.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
                          ),
                          child: const Text(
                            'Belum ada Program Kerja yang disetujui DPL.',
                            style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
                          ),
                        );
                      }
                      return DropdownButtonFormField<String>(
                        initialValue: _selectedProkerId,
                        decoration: _inputDecoration('Pilih Proker...'),
                        items: approvedProker.map((p) => DropdownMenuItem(
                          value: p['id'].toString(),
                          child: Text(p['judul'], style: const TextStyle(fontSize: 14)),
                        )).toList(),
                        onChanged: (val) => setState(() => _selectedProkerId = val),
                        validator: (val) => val == null ? 'Wajib dipilih' : null,
                      );
                    },
                  ),

                  const SizedBox(height: 16),
                  const Text('Pilih Fasilitas Warga (Opsional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Consumer(builder: (context, ref, _) {
                    final fasilitasState = ref.watch(fasilitasWargaListProvider);
                    return fasilitasState.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
                      error: (e, _) => const Text('Gagal memuat fasilitas', style: TextStyle(color: AppColors.dangerRed, fontSize: 12)),
                      data: (list) {
                        if (list.isEmpty) {
                          return const Text('Tidak ada fasilitas warga di RW ini.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontStyle: FontStyle.italic));
                        }
                        return DropdownButtonFormField<String>(
                          initialValue: _selectedFasilitasId,
                          decoration: _inputDecoration('Pilih Fasilitas...'),
                          items: list.map((f) => DropdownMenuItem(
                            value: f['id'].toString(),
                            child: Text(f['nama'] ?? '-', style: const TextStyle(fontSize: 14)),
                          )).toList(),
                          onChanged: (val) => setState(() => _selectedFasilitasId = val),
                        );
                      }
                    );
                  }),
                ],
              ),

              const SizedBox(height: 16),

              _buildSectionCard(
                title: 'Detail Kegiatan',
                icon: Icons.tune_rounded,
                children: [
                  const Text('Teknologi / Metode', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _teknologiCtrl,
                    decoration: _inputDecoration('Contoh: Komposter, Maggot BSF'),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),

                  const Text('Bahan Baku Utama', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _bahanBakuCtrl,
                    decoration: _inputDecoration('Contoh: Sisa Makanan Warga'),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),

                  const Text('Berat Sampah Masuk (Input)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _beratInputCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('').copyWith(suffixText: 'Kg'),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              _buildSectionCard(
                title: 'Dokumentasi',
                icon: Icons.camera_alt_rounded,
                children: [
                  const Text('Foto Dokumentasi Aksi', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _pickImage,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5), width: 1.5, style: BorderStyle.solid),
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.primaryGreen.withValues(alpha: 0.05),
                      ),
                      child: _selectedImage != null
                          ? ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.file(_selectedImage!, fit: BoxFit.cover, width: double.infinity))
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3))),
                                  child: const Icon(Icons.add_a_photo_rounded, size: 32, color: AppColors.primaryGreen),
                                ),
                                const SizedBox(height: 12),
                                const Text('Ambil / Pilih Foto Kegiatan', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w600, fontSize: 13)),
                              ],
                            ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded, size: 20),
                          SizedBox(width: 10),
                          Text('Simpan Laporan & Dapatkan Poin', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                        ],
                      ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.stars_rounded, color: AppColors.warningOrange, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Lapor Kegiatan = Poin',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 14),
                ),
                SizedBox(height: 4),
                Text(
                  'Setiap laporan pemanfaatan sampah yang kamu simpan akan menambahkan poin kontribusi KKN.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: AppColors.primaryGreen),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
      filled: true,
      fillColor: AppColors.backgroundCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.dangerRed),
      ),
    );
  }
}
