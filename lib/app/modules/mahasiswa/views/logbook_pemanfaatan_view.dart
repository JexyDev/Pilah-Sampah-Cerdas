import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import 'riwayat_program_kerja_view.dart'; // import provider untuk dropdown

class LogbookPemanfaatanView extends ConsumerStatefulWidget {
  const LogbookPemanfaatanView({super.key});

  @override
  ConsumerState<LogbookPemanfaatanView> createState() => _LogbookPemanfaatanViewState();
}

class _LogbookPemanfaatanViewState extends ConsumerState<LogbookPemanfaatanView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedProkerId;
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
        'teknologi': _teknologiCtrl.text.trim(),
        'bahanBaku': _bahanBakuCtrl.text.trim(),
        'beratInputKg': double.tryParse(_beratInputCtrl.text.trim()) ?? 0,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil mencatat aksi!')));
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
  Widget build(BuildContext context) {
    final prokerState = ref.watch(programKerjaListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Logbook Aksi (Pengolahan)', style: TextStyle(fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
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
              
              const Text('Pilih Program (Hanya yang di-ACC)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              prokerState.when(
                loading: () => const CircularProgressIndicator(),
                error: (e, _) => Text(e.toString()),
                data: (list) {
                  final approvedProker = list.where((p) => p['status'] == 'APPROVED').toList();
                  if (approvedProker.isEmpty) {
                    return const Text('Belum ada Program Kerja yang disetujui DPL.', style: TextStyle(color: AppColors.dangerRed));
                  }
                  return DropdownButtonFormField<String>(
                    initialValue: _selectedProkerId,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    hint: const Text('Pilih Proker...'),
                    items: approvedProker.map((p) => DropdownMenuItem(
                      value: p['id'].toString(),
                      child: Text(p['judul']),
                    )).toList(),
                    onChanged: (val) => setState(() => _selectedProkerId = val),
                  );
                },
              ),
              const SizedBox(height: 16),
              
              const Text('Teknologi / Metode', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _teknologiCtrl,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Contoh: Komposter, Maggot BSF'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              const Text('Bahan Baku Utama', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _bahanBakuCtrl,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Contoh: Sisa Makanan Warga'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              const Text('Berat Sampah Masuk (Input)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _beratInputCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), suffixText: 'Kg'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Foto Dokumentasi Aksi', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(8),
                    color: AppColors.backgroundCanvas,
                  ),
                  child: _selectedImage != null
                      ? ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(_selectedImage!, fit: BoxFit.cover))
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, size: 40, color: AppColors.textSecondary),
                            SizedBox(height: 8),
                            Text('Ambil / Pilih Foto', style: TextStyle(color: AppColors.textSecondary)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 32),
              
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan Aksi Harian', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
