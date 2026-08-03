import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/pengajuan_izin_mahasiswa_entity.dart';

class PengajuanIzinFormView extends ConsumerStatefulWidget {
  const PengajuanIzinFormView({super.key});

  @override
  ConsumerState<PengajuanIzinFormView> createState() => _PengajuanIzinFormViewState();
}

class _PengajuanIzinFormViewState extends ConsumerState<PengajuanIzinFormView> {
  final _formKey = GlobalKey<FormState>();
  KategoriIzin _selectedKategori = KategoriIzin.sakit;
  DateTime _tanggalKegiatan = DateTime.now();
  final TextEditingController _deskripsiController = TextEditingController();
  String? _photoPath;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _deskripsiController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file != null) {
      setState(() => _photoPath = file.path);
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto surat/bukti izin wajib diunggah!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pengajuan Izin Berhasil Dikirim ke DPL! Status: Menunggu Approval DPL.'),
          backgroundColor: AppColors.primaryGreen,
        ),
      );
      Navigator.pop(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Pengajuan Izin / Sakit KKN'),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Notice banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber[50],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber[300]!),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.amber, size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Anjuran: Sebaiknya pengajuan izin dikirimkan H-1 sebelum kegiatan KKN berlangsung.',
                        style: TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Kategori Dropdown (Sakit / Izin SAJA)
              const Text('Kategori Pengajuan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              DropdownButtonFormField<KategoriIzin>(
                initialValue: _selectedKategori,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: KategoriIzin.values.map((k) {
                  return DropdownMenuItem(
                    value: k,
                    child: Text(k.displayName),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedKategori = val);
                },
              ),
              const SizedBox(height: 16),

              // Tanggal Kegiatan
              const Text('Tanggal Kegiatan Terkait', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _tanggalKegiatan,
                    firstDate: DateTime(2025),
                    lastDate: DateTime(2027),
                  );
                  if (picked != null) setState(() => _tanggalKegiatan = picked);
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[400]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(DateFormat('EEEE, dd MMMM yyyy').format(_tanggalKegiatan)),
                      const Icon(Icons.calendar_today_rounded, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Deskripsi
              const Text('Deskripsi / Alasan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _deskripsiController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Jelaskan alasan izin / kondisi sakit...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Deskripsi wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              // Upload Foto Bukti
              const Text('Foto Bukti Surat / Resep Dokter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              InkWell(
                onTap: _pickPhoto,
                child: Container(
                  height: 140,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[400]!, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey[100],
                  ),
                  child: _photoPath == null
                      ? const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_rounded, size: 36, color: AppColors.primaryGreen),
                            SizedBox(height: 8),
                            Text('Ketuk untuk Upload Foto Bukti', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        )
                      : Image.file(File(_photoPath!), fit: BoxFit.cover),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Kirim Pengajuan Izin', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
