import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class PengajuanProgramKerjaView extends ConsumerStatefulWidget {
  const PengajuanProgramKerjaView({super.key});

  @override
  ConsumerState<PengajuanProgramKerjaView> createState() => _PengajuanProgramKerjaViewState();
}

class _PengajuanProgramKerjaViewState extends ConsumerState<PengajuanProgramKerjaView> {
  final _formKey = GlobalKey<FormState>();
  final _judulCtrl = TextEditingController();
  final _anggaranCtrl = TextEditingController();
  final _tanggalCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();
  
  String _kategori = 'Fisik';
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitProgramKerja({
        'judul': _judulCtrl.text.trim(),
        'kategori': _kategori,
        'rencanaAnggaran': double.tryParse(_anggaranCtrl.text.trim()) ?? 0,
        'targetTanggal': _tanggalCtrl.text.trim(), 
        'deskripsi': _deskripsiCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil diajukan!')));
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
    _judulCtrl.dispose();
    _anggaranCtrl.dispose();
    _tanggalCtrl.dispose();
    _deskripsiCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengajuan Program Kerja', style: TextStyle(fontSize: 18)),
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
                        '[Belum Terhubung API] Fitur ini memerlukan backend.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text('Judul Program Kerja', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _judulCtrl,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Contoh: Budidaya Maggot'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _kategori,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'Fisik', child: Text('Fisik (Infrastruktur/Alat)')),
                  DropdownMenuItem(value: 'Non-Fisik', child: Text('Non-Fisik (Edukasi/Sosialisasi)')),
                ],
                onChanged: (val) => setState(() => _kategori = val!),
              ),
              const SizedBox(height: 16),
              const Text('Rencana Anggaran (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _anggaranCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), prefixText: 'Rp '),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              const Text('Target Tanggal Selesai', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _tanggalCtrl,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'YYYY-MM-DD', suffixIcon: Icon(Icons.calendar_today)),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              const Text('Deskripsi Singkat', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _deskripsiCtrl,
                maxLines: 4,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Jelaskan tujuan dan mekanisme pelaksanaan...'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
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
                    : const Text('Ajukan Program Kerja', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
