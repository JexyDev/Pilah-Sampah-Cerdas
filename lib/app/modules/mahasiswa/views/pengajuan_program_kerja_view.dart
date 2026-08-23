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
  final _anggaranCtrl = TextEditingController();
  final _tanggalMulaiCtrl = TextEditingController();
  final _tanggalSelesaiCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();
  
  String _kategori = 'Pemilahan';
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitProgramKerja({
        'judul': _kategori, // fallback for any legacy backend requirement
        'kategori': _kategori,
        'rencanaAnggaran': double.tryParse(_anggaranCtrl.text.trim()) ?? 0,
        'targetTanggal': '${_tanggalMulaiCtrl.text.trim()} s/d ${_tanggalSelesaiCtrl.text.trim()}', 
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
    _anggaranCtrl.dispose();
    _tanggalMulaiCtrl.dispose();
    _tanggalSelesaiCtrl.dispose();
    _deskripsiCtrl.dispose();
    super.dispose();
  }

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
              const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _kategori,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'Pemilahan', child: Text('Pemilahan')),
                  DropdownMenuItem(value: 'Pengangkutan', child: Text('Pengangkutan')),
                  DropdownMenuItem(value: 'Pengolahan', child: Text('Pengolahan')),
                  DropdownMenuItem(value: 'Pemanfaatan', child: Text('Pemanfaatan')),
                  DropdownMenuItem(value: 'Edukasi & Sosialisasi', child: Text('Edukasi & Sosialisasi')),
                  DropdownMenuItem(value: 'Lainnya', child: Text('Lainnya')),
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
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Tanggal Mulai', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _tanggalMulaiCtrl,
                          readOnly: true,
                          decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'YYYY-MM-DD', suffixIcon: Icon(Icons.calendar_today)),
                          validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                          onTap: () async {
                              final minDate = DateTime.now().add(const Duration(days: 3));
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: minDate,
                                firstDate: minDate,
                                lastDate: DateTime(2030),
                              );
                            if (picked != null) {
                              _tanggalMulaiCtrl.text = picked.toIso8601String().split('T').first;
                              // Auto-update selesai if it's before mulai
                              if (_tanggalSelesaiCtrl.text.isNotEmpty) {
                                final sDate = DateTime.parse(_tanggalSelesaiCtrl.text);
                                if (sDate.isBefore(picked)) {
                                  _tanggalSelesaiCtrl.text = picked.toIso8601String().split('T').first;
                                }
                              }
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Tanggal Selesai', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _tanggalSelesaiCtrl,
                          readOnly: true,
                          decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'YYYY-MM-DD', suffixIcon: Icon(Icons.calendar_today)),
                          validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                          onTap: () async {
                              final minDate = _tanggalMulaiCtrl.text.isNotEmpty ? DateTime.parse(_tanggalMulaiCtrl.text) : DateTime.now().add(const Duration(days: 3));
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: minDate,
                                firstDate: minDate,
                                lastDate: DateTime(2030),
                              );
                            if (picked != null) {
                              _tanggalSelesaiCtrl.text = picked.toIso8601String().split('T').first;
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
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
