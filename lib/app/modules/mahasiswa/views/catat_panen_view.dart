import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import 'riwayat_program_kerja_view.dart';

class CatatPanenView extends ConsumerStatefulWidget {
  const CatatPanenView({super.key});

  @override
  ConsumerState<CatatPanenView> createState() => _CatatPanenViewState();
}

class _CatatPanenViewState extends ConsumerState<CatatPanenView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedProkerId;
  final _beratOutputCtrl = TextEditingController();
  final _nilaiEkonomiCtrl = TextEditingController();
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
      await repo.submitPanenHasil({
        'programKerjaId': _selectedProkerId,
        'beratOutputKg': double.tryParse(_beratOutputCtrl.text.trim()) ?? 0,
        'nilaiEkonomiRp': double.tryParse(_nilaiEkonomiCtrl.text.trim()) ?? 0,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil mencatat panen!')));
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
        title: const Text('Catat Panen / Hasil', style: TextStyle(fontSize: 18)),
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
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warningYellow.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.warningYellow),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.warningYellow),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '[Belum Terhubung API] Form ini membutuhkan endpoint /kkn/panen-hasil dari Backend.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text('Pilih Program (Sumber Hasil)', style: TextStyle(fontWeight: FontWeight.bold)),
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
                    value: _selectedProkerId,
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

              const Text('Berat Hasil Jadi (Output)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _beratOutputCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), suffixText: 'Kg', hintText: 'Misal: 5.5'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Estimasi Nilai Ekonomi (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nilaiEkonomiCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), prefixText: 'Rp ', hintText: 'Misal: 50000'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Foto Hasil / Panen', style: TextStyle(fontWeight: FontWeight.bold)),
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
                    : const Text('Simpan Panen', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
