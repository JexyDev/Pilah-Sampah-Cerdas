import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/thousands_formatter.dart';
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
  final _judulCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();
  final _linkDriveCtrl = TextEditingController();
  
  String? _kategori;
  File? _attachmentFile;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _kategoriList = [
    {
      'title': 'Pemilahan',
      'desc': 'Edukasi dan implementasi pemilahan sampah dari sumbernya.',
      'icon': Icons.recycling_rounded,
    },
    {
      'title': 'Pengangkutan',
      'desc': 'Sistem dan jadwal pengangkutan sampah warga ke TPS.',
      'icon': Icons.local_shipping_rounded,
    },
    {
      'title': 'Pengolahan',
      'desc': 'Pengolahan sampah organik dan anorganik menjadi produk.',
      'icon': Icons.factory_rounded,
    },
    {
      'title': 'Pemanfaatan',
      'desc': 'Pemanfaatan hasil olahan sampah untuk kebutuhan warga.',
      'icon': Icons.eco_rounded,
    },
    {
      'title': 'Edukasi & Sosialisasi',
      'desc': 'Penyuluhan kesadaran lingkungan kepada warga sekitar.',
      'icon': Icons.people_outline_rounded,
    },
    {
      'title': 'Lainnya',
      'desc': 'Kategori program kerja KKN lainnya di luar daftar di atas.',
      'icon': Icons.more_horiz_rounded,
    },
  ];

  Future<void> _showAttachmentPicker() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.picture_as_pdf_rounded, color: AppColors.primaryGreen),
                title: const Text('Dokumen PDF Proposal / Bukti'),
                onTap: () async {
                  Navigator.pop(context);
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['pdf'],
                  );
                  if (result != null && result.files.single.path != null) {
                    setState(() => _attachmentFile = File(result.files.single.path!));
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: AppColors.primaryGreen),
                title: const Text('Foto Galeri'),
                onTap: () async {
                  Navigator.pop(context);
                  final picked = await ImagePicker().pickImage(
                    source: ImageSource.gallery,
                    imageQuality: 75,
                  );
                  if (picked != null) {
                    setState(() => _attachmentFile = File(picked.path));
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primaryGreen),
                title: const Text('Kamera Langsung'),
                onTap: () async {
                  Navigator.pop(context);
                  final picked = await ImagePicker().pickImage(
                    source: ImageSource.camera,
                    imageQuality: 75,
                  );
                  if (picked != null) {
                    setState(() => _attachmentFile = File(picked.path));
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_kategori == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Harap pilih kategori.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitProgramKerja({
        'judul': _judulCtrl.text.trim(),
        'kategori': _kategori!,
        'rencanaAnggaran': double.tryParse(_anggaranCtrl.text.trim().replaceAll('.', '')) ?? 0,
        'targetTanggal': '${_tanggalMulaiCtrl.text.trim()} s/d ${_tanggalSelesaiCtrl.text.trim()}', 
        'deskripsi': _deskripsiCtrl.text.trim(),
        'linkGoogleDrive': _linkDriveCtrl.text.trim(),
        if (_attachmentFile != null) 'filePdfPath': _attachmentFile!.path,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil diajukan!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _buildInputDecoration({String? hintText, Widget? prefixIcon, Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
      ),
    );
  }

  void _showKategoriBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.85,
          expand: false,
          builder: (ctx, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        const Text(
                          'Pilih Kategori',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 20,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.only(bottom: 32),
                      children: _kategoriList.map((kat) {
                        final isSelected = _kategori == kat['title'];
                        return InkWell(
                          onTap: () {
                            setState(() => _kategori = kat['title'] as String);
                            Navigator.pop(ctx);
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 14,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? const Color(0xFFE8F5E9)
                                        : const Color(0xFFF5F7FA),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    kat['icon'] as IconData,
                                    size: 20,
                                    color: isSelected
                                        ? AppColors.primaryGreen
                                        : AppColors.textHint,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        kat['title'] as String,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isSelected
                                              ? FontWeight.bold
                                              : FontWeight.w500,
                                          color: isSelected
                                              ? AppColors.primaryGreen
                                              : AppColors.textPrimary,
                                        ),
                                      ),
                                      Text(
                                        kat['desc'] as String,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textSecondary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  Container(
                                    margin: const EdgeInsets.only(left: 12),
                                    padding: const EdgeInsets.all(2),
                                    decoration: const BoxDecoration(
                                      color: AppColors.primaryGreen,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.check,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                  )
                                else
                                  Container(
                                    margin: const EdgeInsets.only(left: 12),
                                    width: 18,
                                    height: 18,
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: Colors.grey.shade400,
                                      ),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
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
              const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _isLoading ? null : _showKategoriBottomSheet,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _kategori ?? 'Pilih Kategori Program',
                          style: TextStyle(
                            fontSize: 16,
                            color: _kategori == null ? AppColors.textHint : AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: AppColors.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Rencana Anggaran (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _anggaranCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsFormatter()],
                decoration: _buildInputDecoration(
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(left: 16, right: 8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Rp',
                          style: TextStyle(fontSize: 16, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                  hintText: '0',
                ),
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
                          decoration: _buildInputDecoration(hintText: 'YYYY-MM-DD', suffixIcon: const Icon(Icons.calendar_today, size: 20)),
                          validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                          onTap: () async {
                              final minDate = DateTime.now().add(const Duration(days: 1));
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
                          decoration: _buildInputDecoration(hintText: 'YYYY-MM-DD', suffixIcon: const Icon(Icons.calendar_today, size: 20)),
                          validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                          onTap: () async {
                              final minDate = _tanggalMulaiCtrl.text.isNotEmpty ? DateTime.parse(_tanggalMulaiCtrl.text) : DateTime.now().add(const Duration(days: 1));
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
              const Text('Judul Program', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _judulCtrl,
                decoration: _buildInputDecoration(hintText: 'Contoh: Sosialisasi Maggot BSF'),
                validator: (val) => val == null || val.isEmpty ? 'Judul wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              const Text('Deskripsi Singkat', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _deskripsiCtrl,
                maxLines: 4,
                decoration: _buildInputDecoration(hintText: 'Jelaskan tujuan dan mekanisme pelaksanaan...'),
                validator: (val) => val == null || val.isEmpty ? 'Deskripsi wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              const Text('Tautan Bukti Google Drive (URL)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _linkDriveCtrl,
                keyboardType: TextInputType.url,
                decoration: _buildInputDecoration(hintText: 'https://drive.google.com/...'),
              ),
              const SizedBox(height: 16),
              const Text('Unggah Berkas Bukti / Proposal (PDF/Foto)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _showAttachmentPicker,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _attachmentFile != null ? AppColors.primaryGreen : Colors.grey.shade300,
                      width: _attachmentFile != null ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _attachmentFile != null ? Icons.check_circle_rounded : Icons.attach_file_rounded,
                        color: _attachmentFile != null ? AppColors.primaryGreen : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _attachmentFile != null
                              ? _attachmentFile!.path.split('/').last.split('\\').last
                              : 'Pilih Berkas Lampiran (Opsional)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: _attachmentFile != null ? FontWeight.w600 : FontWeight.normal,
                            color: _attachmentFile != null ? AppColors.textPrimary : AppColors.textHint,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (_attachmentFile != null)
                        GestureDetector(
                          onTap: () => setState(() => _attachmentFile = null),
                          child: const Padding(
                            padding: EdgeInsets.all(4.0),
                            child: Icon(Icons.close_rounded, size: 20, color: Colors.grey),
                          ),
                        ),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
