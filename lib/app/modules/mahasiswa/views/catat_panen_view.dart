import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

final unharvestedLogbooksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final repo = ref.watch(kknRepositoryProvider);
  return repo.getUnharvestedLogbooks();
});

class CatatPanenView extends ConsumerStatefulWidget {
  const CatatPanenView({super.key});

  @override
  ConsumerState<CatatPanenView> createState() => _CatatPanenViewState();
}

class _CatatPanenViewState extends ConsumerState<CatatPanenView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedPemanfaatanId;
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
    if (_selectedPemanfaatanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Laporan Kegiatan terlebih dahulu.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitPanenHasil({
        'pemanfaatanId': _selectedPemanfaatanId,
        'beratOutputKg': double.tryParse(_beratOutputCtrl.text.trim()) ?? 0,
        'nilaiEkonomiRp': double.tryParse(_nilaiEkonomiCtrl.text.trim()) ?? 0,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil mencatat panen!')));
        ref.invalidate(unharvestedLogbooksProvider);
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
    final unharvestedState = ref.watch(unharvestedLogbooksProvider);

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
              
              const Text('Pilih Laporan (Sumber Hasil)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              unharvestedState.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text(e.toString()),
                data: (list) {
                  if (list.isEmpty) {
                    return const Text('Tidak ada laporan kegiatan yang belum dipanen.', style: TextStyle(color: AppColors.dangerRed));
                  }
                  return DropdownButtonFormField<String>(
                    isExpanded: true,
                    initialValue: _selectedPemanfaatanId,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    hint: const Text('Pilih Laporan...'),
                    items: list.map((p) => DropdownMenuItem(
                      value: p['id'].toString(),
                      child: Text("${p['program'] ?? ''} - ${p['teknologi'] ?? ''}"),
                    )).toList(),
                    onChanged: (val) => setState(() => _selectedPemanfaatanId = val),
                  );
                },
              ),
              const SizedBox(height: 16),

              const Text('Berat Hasil Jadi (Output)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _beratOutputCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), suffixText: 'Kg', hintText: 'Contoh: 5.5'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Estimasi Nilai Ekonomi (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nilaiEkonomiCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), prefixText: 'Rp ', hintText: 'Contoh: 50000'),
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
