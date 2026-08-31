import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class EditProgramKerjaView extends ConsumerStatefulWidget {
  final String prokerId;
  const EditProgramKerjaView({super.key, required this.prokerId});

  @override
  ConsumerState<EditProgramKerjaView> createState() => _EditProgramKerjaViewState();
}

class _EditProgramKerjaViewState extends ConsumerState<EditProgramKerjaView> {
  final _formKey = GlobalKey<FormState>();

  final _judulCtrl          = TextEditingController();
  final _deskripsiCtrl      = TextEditingController();
  final _anggaranCtrl       = TextEditingController();
  final _tanggalMulaiCtrl   = TextEditingController();
  final _tanggalSelesaiCtrl = TextEditingController();
  final _linkDriveCtrl      = TextEditingController();

  String? _kategori;
  File? _attachmentFile;
  bool _isLoading = false;
  bool _isFetching = true;
  String? _fetchError;
  Map<String, dynamic>? _prokerData;

  static const _kategoriList = [
    {'value': 'PEMILAHAN', 'label': 'Pemilahan Sampah'},
    {'value': 'PENGANGKUTAN', 'label': 'Pengangkutan Sampah'},
    {'value': 'PENGOLAHAN', 'label': 'Pengolahan Sampah'},
    {'value': 'PEMANFAATAN', 'label': 'Pemanfaatan Sampah'},
    {'value': 'EDUKASI', 'label': 'Edukasi & Sosialisasi'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _judulCtrl.dispose();
    _deskripsiCtrl.dispose();
    _anggaranCtrl.dispose();
    _tanggalMulaiCtrl.dispose();
    _tanggalSelesaiCtrl.dispose();
    _linkDriveCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() { _isFetching = true; _fetchError = null; });
    try {
      final repo = ref.read(kknRepositoryProvider);
      final detail = await repo.getProgramKerjaDetail(widget.prokerId);
      if (detail == null) throw Exception('Data program kerja tidak ditemukan.');
      _prokerData = detail;
      _prefillForm(detail);
    } catch (e) {
      _fetchError = e.toString();
    } finally {
      if (mounted) setState(() => _isFetching = false);
    }
  }

  void _prefillForm(Map<String, dynamic> data) {
    _judulCtrl.text = data['judul']?.toString() ?? data['deskripsi']?.toString() ?? '';
    _deskripsiCtrl.text = data['deskripsi']?.toString() ?? '';
    _anggaranCtrl.text = data['rencanaAnggaran']?.toString() ?? data['kebutuhanBiaya']?.toString() ?? '';
    _linkDriveCtrl.text = data['linkGoogleDrive']?.toString() ?? '';
    _kategori = data['kategori']?.toString().toUpperCase();
    // Validate kategori against list
    final valid = _kategoriList.map((k) => k['value']!).toSet();
    if (_kategori != null && !valid.contains(_kategori)) _kategori = null;

    final waktu = data['waktuPelaksanaan']?.toString() ?? data['targetTanggal']?.toString() ?? '';
    if (waktu.contains(' s/d ')) {
      final parts = waktu.split(' s/d ');
      if (parts.length >= 2) { _tanggalMulaiCtrl.text = parts[0].trim(); _tanggalSelesaiCtrl.text = parts[1].trim(); }
    } else if (waktu.isNotEmpty) {
      _tanggalMulaiCtrl.text = waktu;
    }
  }

  Future<void> _pickAttachment() async {
    final result = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png']);
    if (result != null && result.files.single.path != null) {
      setState(() => _attachmentFile = File(result.files.single.path!));
    }
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    DateTime initial = DateTime.now();
    try { initial = DateTime.parse(ctrl.text); } catch (_) {}
    final picked = await showDatePicker(context: context, initialDate: initial, firstDate: DateTime(2020), lastDate: DateTime(2035));
    if (picked != null) {
      ctrl.text = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_kategori == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih kategori program kerja'), backgroundColor: AppColors.dangerRed));
      return;
    }
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final waktu = _tanggalMulaiCtrl.text.isNotEmpty && _tanggalSelesaiCtrl.text.isNotEmpty
          ? '${_tanggalMulaiCtrl.text} s/d ${_tanggalSelesaiCtrl.text}'
          : _tanggalMulaiCtrl.text;
      final payload = <String, dynamic>{
        'judul': _judulCtrl.text.trim(),
        'kategori': _kategori,
        'deskripsi': _deskripsiCtrl.text.trim(),
        'rencanaAnggaran': _anggaranCtrl.text.trim().isNotEmpty ? _anggaranCtrl.text.trim() : null,
        'targetTanggal': waktu,
        if (_linkDriveCtrl.text.trim().isNotEmpty) 'linkGoogleDrive': _linkDriveCtrl.text.trim(),
        if (_attachmentFile != null) 'filePdfPath': _attachmentFile!.path,
      };
      final success = await repo.editProgramKerja(widget.prokerId, payload);
      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Program kerja berhasil diperbarui!'), backgroundColor: AppColors.primaryGreen));
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal memperbarui program kerja.'), backgroundColor: AppColors.dangerRed));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.dangerRed));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildBanner() {
    final data = _prokerData;
    if (data == null) return const SizedBox.shrink();
    final status = data['statusUsulan']?.toString().toUpperCase() ?? '';
    final catatanDpl = data['catatanDpl']?.toString() ?? '';

    if (status == 'PERLU_REVISI_DPL') {
      return _banner(color: Colors.orange, icon: Icons.rate_review_rounded, title: '\u26a0\ufe0f Program Kerja Perlu Direvisi', body: 'DPL meminta perubahan. Perbaiki sesuai catatan di bawah lalu simpan ulang.', catatan: catatanDpl, catatanLabel: 'Catatan Revisi dari DPL:');
    }
    if (status == 'DITOLAK' || status == 'TIDAK_DISETUJUI') {
      return _banner(color: Colors.red, icon: Icons.cancel_rounded, title: '\u274c Program Kerja Ditolak', body: 'DPL menolak usulan program kerja ini. Perbaiki sesuai catatan lalu ajukan ulang.', catatan: catatanDpl, catatanLabel: 'Alasan Penolakan:');
    }
    if (status == 'BELUM_DISETUJUI' || status.isEmpty) {
      return _banner(color: AppColors.primaryBlue, icon: Icons.info_outline_rounded, title: 'Edit Program Kerja', body: 'Usulan masih menunggu persetujuan DPL. Anda dapat mengubah detail sebelum DPL merespons.', catatan: '', catatanLabel: '');
    }
    return const SizedBox.shrink();
  }

  Widget _banner({required Color color, required IconData icon, required String title, required String body, required String catatan, required String catatanLabel}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 14))),
          ]),
          const SizedBox(height: 4),
          Text(body, style: TextStyle(fontSize: 12, color: color.withValues(alpha: 0.85), height: 1.4)),
          if (catatan.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withValues(alpha: 0.2))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(catatanLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
                  const SizedBox(height: 4),
                  Text(catatan, style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.4)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildField({required String label, required TextEditingController controller, required String hint, int maxLines = 1, bool readOnly = false, VoidCallback? onTap, String? Function(String?)? validator}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          readOnly: readOnly,
          onTap: onTap,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: readOnly,
            fillColor: readOnly ? AppColors.backgroundCanvas : null,
          ),
          style: const TextStyle(fontSize: 13),
          validator: validator,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isFetching) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Program Kerja'), backgroundColor: Colors.white, foregroundColor: AppColors.textPrimary, elevation: 0),
        body: const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Memuat data program kerja...', style: TextStyle(color: AppColors.textSecondary)),
        ])),
      );
    }

    if (_fetchError != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Program Kerja'), backgroundColor: Colors.white, foregroundColor: AppColors.textPrimary, elevation: 0),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 52, color: AppColors.dangerRed),
                const SizedBox(height: 12),
                Text(_fetchError!, style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton.icon(onPressed: _fetchData, icon: const Icon(Icons.refresh_rounded), label: const Text('Coba Lagi')),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Edit Program Kerja', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(color: AppColors.border, height: 1)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildBanner(),
              // Kategori
              const Text('Kategori Program Kerja', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _kategori,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                hint: const Text('Pilih kategori...', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                items: _kategoriList.map((k) => DropdownMenuItem(value: k['value'], child: Text(k['label']!, style: const TextStyle(fontSize: 13)))).toList(),
                onChanged: (v) => setState(() => _kategori = v),
                validator: (v) => v == null ? 'Pilih kategori' : null,
              ),
              const SizedBox(height: 14),
              _buildField(label: 'Judul Program Kerja', controller: _judulCtrl, hint: 'Judul singkat yang deskriptif', validator: (v) => v == null || v.isEmpty ? 'Masukkan judul' : null),
              const SizedBox(height: 14),
              _buildField(label: 'Deskripsi & Tujuan', controller: _deskripsiCtrl, hint: 'Jelaskan tujuan dan rencana kegiatan...', maxLines: 4, validator: (v) => v == null || v.trim().length < 10 ? 'Deskripsi minimal 10 karakter' : null),
              const SizedBox(height: 14),
              _buildField(label: 'Rencana Anggaran (Opsional)', controller: _anggaranCtrl, hint: 'Contoh: Rp 500.000'),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: _buildField(label: 'Tanggal Mulai', controller: _tanggalMulaiCtrl, hint: 'YYYY-MM-DD', readOnly: true, onTap: () => _pickDate(_tanggalMulaiCtrl))),
                const SizedBox(width: 12),
                Expanded(child: _buildField(label: 'Tanggal Selesai', controller: _tanggalSelesaiCtrl, hint: 'YYYY-MM-DD', readOnly: true, onTap: () => _pickDate(_tanggalSelesaiCtrl))),
              ]),
              const SizedBox(height: 14),
              _buildField(label: 'Link Google Drive (Opsional)', controller: _linkDriveCtrl, hint: 'https://drive.google.com/...'),
              const SizedBox(height: 14),
              const Text('Lampiran File (PDF / Foto)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 6),
              if (_attachmentFile != null) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.primaryGreen.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3))),
                  child: Row(
                    children: [
                      const Icon(Icons.attach_file_rounded, size: 16, color: AppColors.primaryGreen),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_attachmentFile!.path.split('/').last, style: const TextStyle(fontSize: 12, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis)),
                      IconButton(icon: const Icon(Icons.close, size: 16, color: AppColors.dangerRed), onPressed: () => setState(() => _attachmentFile = null), constraints: const BoxConstraints(), padding: EdgeInsets.zero),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.primary, side: const BorderSide(color: AppColors.primary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), padding: const EdgeInsets.symmetric(vertical: 12)),
                icon: const Icon(Icons.upload_file_rounded),
                label: Text(_attachmentFile == null ? 'Pilih File' : 'Ganti File', style: const TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _pickAttachment,
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                      : const Text('Simpan Perubahan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
