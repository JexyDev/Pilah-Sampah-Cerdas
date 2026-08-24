import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  final _fotoUrlCtrl = TextEditingController();
  String _kategoriAspirasi = 'UMUM';
  final List<String> _kategoriAspirasiList = ['UMUM', 'FASILITAS', 'PELAYANAN', 'LAINNYA'];
  int _ratingAspirasi = 5;

  Future<void> _onSubmit() async {
    ScaffoldMessenger.of(context).clearSnackBars();
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harap lengkapi semua kolom yang wajib diisi.'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }
    
    if (_fotoUrlCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto bukti wajib dilampirkan (masukkan tautan Google Drive/Cloud).'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }
    
    final notifier = ref.read(wargaAspirasiProvider.notifier);
    
    final success = await notifier.submitAspirasi({
      'judul': _judulAspirasiCtrl.text.trim(),
      'isiKritikSaran': _isiAspirasiCtrl.text.trim(),
      'kategori': _kategoriAspirasi,
      'rating': _ratingAspirasi,
      'fotoBuktiUrl': _fotoUrlCtrl.text.trim(),
    });

    if (mounted) {
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

    return Scaffold(
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
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
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
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
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
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
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
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
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

              const Text('Tautan Bukti (Opsional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _fotoUrlCtrl,
                keyboardType: TextInputType.url,
                decoration: InputDecoration(
                  hintText: 'https://...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
                  prefixIcon: const Icon(Icons.link_rounded, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '* Catatan: Fitur unggah foto langsung dari HP belum tersedia. Jika Anda memiliki foto bukti, silakan unggah ke Google Drive/layanan cloud lainnya dan tempelkan tautannya (link) di atas.',
                style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.3),
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
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: state.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text('Kirim Kritik & Saran', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ),
    );
  }
}
