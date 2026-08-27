import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/warga_aspirasi_controller.dart';
class WargaAspirasiView extends ConsumerStatefulWidget {
  const WargaAspirasiView({super.key});

  @override
  ConsumerState<WargaAspirasiView> createState() => _WargaAspirasiViewState();
}

class _WargaAspirasiViewState extends ConsumerState<WargaAspirasiView> {
  final _formKey = GlobalKey<FormState>();
  final _judulAspirasiCtrl = TextEditingController();
  final _isiAspirasiCtrl = TextEditingController();
  File? _fotoBukti;
  final _picker = ImagePicker();
  
  String _kategoriAspirasi = 'UMUM';
  final List<String> _kategoriAspirasiList = ['UMUM', 'FASILITAS', 'PELAYANAN', 'LAINNYA'];
  int _ratingAspirasi = 5;

  Future<void> _pickImage() async {
    try {
      final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (pickedFile != null) {
        setState(() => _fotoBukti = File(pickedFile.path));
      }
    } catch (e) {
      debugPrint('Gagal memilih gambar: $e');
    }
  }

  Future<void> _onSubmit() async {
    ScaffoldMessenger.of(context).clearSnackBars();
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harap lengkapi semua kolom yang wajib diisi.'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }
    
    if (_fotoBukti == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto bukti fisik dari galeri wajib dilampirkan.'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }
    
    final notifier = ref.read(wargaAspirasiProvider.notifier);
    
    final success = await notifier.submitAspirasi({
      'judul': _judulAspirasiCtrl.text.trim(),
      'isiKritikSaran': _isiAspirasiCtrl.text.trim(),
      'kategori': _kategoriAspirasi,
      'rating': _ratingAspirasi,
      'fotoBuktiUrl': _fotoBukti!.path,
    });

    if (mounted) {
      ScaffoldMessenger.of(context).clearSnackBars();
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kritik & Saran berhasil dikirim!'), backgroundColor: AppColors.primaryGreen),
        );
        Navigator.pop(context);
      } else {
        final errorMsg = ref.read(wargaAspirasiProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMsg ?? 'Gagal mengirim aspirasi.'), backgroundColor: AppColors.dangerRed),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(wargaAspirasiProvider);

    bool hasUnsavedChanges() {
      return _judulAspirasiCtrl.text.isNotEmpty ||
             _isiAspirasiCtrl.text.isNotEmpty ||
             _fotoBukti != null ||
             _kategoriAspirasi != 'UMUM' ||
             _ratingAspirasi != 5;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        if (!hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Batalkan Input Aspirasi?', style: TextStyle(fontWeight: FontWeight.bold)),
              content: const Text('Perubahan ini akan terhapus jika Anda keluar dari halaman ini.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Lanjutkan Edit', style: TextStyle(color: AppColors.textSecondary)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Keluar'),
                ),
              ],
            );
          },
        );

        if (shouldPop == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Kritik & Saran',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Judul Kritik & Saran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _judulAspirasiCtrl,
                decoration: InputDecoration(
                  hintText: 'Contoh: Masalah Bak Sampah',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
                ),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              const Text('Deskripsi Lengkap', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _isiAspirasiCtrl,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Tuliskan detail kritik atau saran Anda...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
                ),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _kategoriAspirasi,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                          ),
                          items: _kategoriAspirasiList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _kategoriAspirasi = v!),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Rating Kepuasan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<int>(
                          initialValue: _ratingAspirasi,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
                          ),
                          items: List.generate(5, (index) {
                            int rating = index + 1;
                            return DropdownMenuItem(value: rating, child: Text('$rating ⭐'));
                          }).toList(),
                          onChanged: (v) => setState(() => _ratingAspirasi = v!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              const Text('Foto Bukti (Wajib)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickImage,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F9FA),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: _fotoBukti != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(_fotoBukti!, fit: BoxFit.cover),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_rounded, size: 40, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text('Ketuk untuk unggah foto dari galeri', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: state.isLoading ? null : _onSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
              shadowColor: AppColors.primaryGreen.withValues(alpha: 0.4),
            ),
            child: state.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text('Kirim Kritik & Saran', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
      ),
    ),
    );
  }
}
