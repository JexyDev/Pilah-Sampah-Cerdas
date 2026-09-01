import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class EditLogbookKknView extends ConsumerStatefulWidget {
  final String logbookId;
  const EditLogbookKknView({super.key, required this.logbookId});

  @override
  ConsumerState<EditLogbookKknView> createState() => _EditLogbookKknViewState();
}

class _EditLogbookKknViewState extends ConsumerState<EditLogbookKknView> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _tanggalCtrl = TextEditingController();
  final _waktuMulaiCtrl = TextEditingController();
  final _waktuSelesaiCtrl = TextEditingController();
  final _lokasiCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();

  // State
  DateTime _selectedDate = DateTime.now();
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  String? _selectedProkerId;
  List<String> _existingPhotoUrls = [];
  final List<File> _newFiles = [];
  bool _isLoading = false;
  bool _isFetching = true;
  String? _fetchError;
  Map<String, dynamic>? _logbookData;
  List<Map<String, dynamic>> _prokerList = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _tanggalCtrl.dispose();
    _waktuMulaiCtrl.dispose();
    _waktuSelesaiCtrl.dispose();
    _lokasiCtrl.dispose();
    _deskripsiCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isFetching = true;
      _fetchError = null;
    });
    try {
      final repo = ref.read(kknRepositoryProvider);
      final results = await Future.wait([
        repo.getLogbookDetail(widget.logbookId),
        repo.getProgramKerja(),
      ]);
      final detail = results[0] as Map<String, dynamic>?;
      final prokerListRaw = results[1] as List<Map<String, dynamic>>;
      if (detail == null) throw Exception('Data logbook tidak ditemukan.');
      _logbookData = detail;
      _prokerList = prokerListRaw;
      _prefillForm(detail);
    } catch (e) {
      _fetchError = e.toString();
    } finally {
      if (mounted) setState(() => _isFetching = false);
    }
  }

  void _prefillForm(Map<String, dynamic> data) {
    final dateStr = data['tanggalKegiatan'] ?? data['tanggal'] ?? '';
    if (dateStr.toString().isNotEmpty) {
      try {
        _selectedDate = DateTime.parse(dateStr.toString());
      } catch (_) {}
    }
    _tanggalCtrl.text =
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

    _waktuMulaiCtrl.text = data['waktuMulai']?.toString() ?? '';
    if (_waktuMulaiCtrl.text.isNotEmpty) {
      final p = _waktuMulaiCtrl.text.split(':');
      if (p.length >= 2) {
        _startTime = TimeOfDay(
          hour: int.tryParse(p[0]) ?? 0,
          minute: int.tryParse(p[1]) ?? 0,
        );
      }
    }

    _waktuSelesaiCtrl.text = data['waktuSelesai']?.toString() ?? '';
    if (_waktuSelesaiCtrl.text.isNotEmpty) {
      final p = _waktuSelesaiCtrl.text.split(':');
      if (p.length >= 2) {
        _endTime = TimeOfDay(
          hour: int.tryParse(p[0]) ?? 0,
          minute: int.tryParse(p[1]) ?? 0,
        );
      }
    }

    _lokasiCtrl.text = data['tempat']?.toString() ?? '';
    _deskripsiCtrl.text = data['deskripsi']?.toString() ?? '';
    _selectedProkerId = data['programKerjaId']?.toString();

    // Existing photos
    final urls = data['attachmentUrls'] ?? data['fotoDokumentasi'];
    if (urls is List) {
      _existingPhotoUrls = List<String>.from(urls.map((e) => e.toString()));
    } else if (urls is String && urls.isNotEmpty) {
      _existingPhotoUrls = [urls];
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.pickFiles(
      type: FileType.image,
      allowMultiple: true,
    );
    if (result != null) {
      setState(() {
        _newFiles.addAll(
          result.files.where((f) => f.path != null).map((f) => File(f.path!)),
        );
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final payload = {
        'tanggalKegiatan': _tanggalCtrl.text.trim(),
        'waktuMulai': _waktuMulaiCtrl.text.trim(),
        'waktuSelesai': _waktuSelesaiCtrl.text.trim(),
        'tempat': _lokasiCtrl.text.trim(),
        'deskripsi': _deskripsiCtrl.text.trim(),
        if (_selectedProkerId != null) 'programKerjaId': _selectedProkerId,
      };
      final success = await repo.editLogbookHarian(
        widget.logbookId,
        payload,
        imagePaths: _newFiles.isEmpty
            ? null
            : _newFiles.map((f) => f.path).toList(),
      );
      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Logbook berhasil diperbarui!'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal memperbarui logbook.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildStatusBanner() {
    final data = _logbookData;
    if (data == null) return const SizedBox.shrink();
    final status = data['statusApproval']?.toString().toUpperCase() ?? '';
    final catatanDpl = data['catatanDpl']?.toString() ?? '';
    final catatanKetua = data['catatanKetua']?.toString() ?? '';

    if (status == 'PERLU_REVISI_DPL') {
      return _buildBanner(
        color: Colors.orange,
        icon: Icons.rate_review_rounded,
        title: '\u26a0\ufe0f Logbook Perlu Direvisi',
        body: 'DPL meminta perubahan. Silakan perbaiki dan simpan ulang.',
        catatan: catatanDpl,
        catatanLabel: 'Catatan dari DPL:',
      );
    }
    if (status == 'DITOLAK_KETUA') {
      return _buildBanner(
        color: Colors.red,
        icon: Icons.cancel_rounded,
        title: '\u274c Logbook Ditolak Ketua',
        body: 'Silakan perbaiki sesuai catatan berikut dan kirim ulang.',
        catatan: catatanKetua,
        catatanLabel: 'Alasan Penolakan:',
      );
    }
    if (status == 'MENUNGGU_VERIFIKASI_DPL') {
      return _buildBanner(
        color: Colors.amber.shade700,
        icon: Icons.hourglass_empty_rounded,
        title: 'Sedang Ditinjau DPL',
        body:
            'Logbook sedang diverifikasi DPL. Anda masih bisa mengubah sebelum DPL merespons.',
        catatan: '',
        catatanLabel: '',
      );
    }
    if (status == 'MENUNGGU_VERIFIKASI_KETUA') {
      return _buildBanner(
        color: AppColors.primaryBlue,
        icon: Icons.hourglass_top_rounded,
        title: 'Menunggu Persetujuan Ketua',
        body:
            'Logbook menunggu persetujuan Ketua Kelompok. Anda masih bisa mengubah.',
        catatan: '',
        catatanLabel: '',
      );
    }
    return _buildBanner(
      color: AppColors.primaryBlue,
      icon: Icons.info_outline_rounded,
      title: 'Edit Logbook Harian',
      body: 'Perbarui isian logbook ini sesuai kebutuhan.',
      catatan: '',
      catatanLabel: '',
    );
  }

  Widget _buildBanner({
    required Color color,
    required IconData icon,
    required String title,
    required String body,
    required String catatan,
    required String catatanLabel,
  }) {
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
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            body,
            style: TextStyle(
              fontSize: 12,
              color: color.withValues(alpha: 0.85),
              height: 1.4,
            ),
          ),
          if (catatan.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: color.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    catatanLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    catatan,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _tanggalCtrl.text =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _pickTime(bool isStart) async {
    final initial = isStart
        ? (_startTime ?? const TimeOfDay(hour: 8, minute: 0))
        : (_endTime ?? const TimeOfDay(hour: 16, minute: 0));
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        if (isStart) {
          _startTime = picked;
          _waktuMulaiCtrl.text = formatted;
        } else {
          _endTime = picked;
          _waktuSelesaiCtrl.text = formatted;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFetching) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Edit Logbook'),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
        ),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'Memuat data logbook...',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    if (_fetchError != null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          title: const Text(
            'Edit Logbook Harian',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 52,
                  color: AppColors.dangerRed,
                ),
                const SizedBox(height: 12),
                Text(
                  'Gagal memuat data:\n$_fetchError',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.dangerRed),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _fetchData,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Coba Lagi'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Edit Logbook Harian',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
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
              _buildStatusBanner(),
              const SizedBox(height: 16),
              _buildSectionCard(
                title: 'Data Aktivitas',
                icon: Icons.receipt_long_rounded,
                children: [
                  _buildField(
                    label: 'Tanggal Kegiatan',
                    controller: _tanggalCtrl,
                    hint: 'Pilih tanggal',
                    readOnly: true,
                    onTap: _pickDate,
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Pilih tanggal' : null,
                    suffixIcon: const Icon(
                      Icons.calendar_month_rounded,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildField(
                          label: 'Waktu Mulai',
                          controller: _waktuMulaiCtrl,
                          hint: '08:00',
                          readOnly: true,
                          onTap: () => _pickTime(true),
                          validator: (v) =>
                              v == null || v.isEmpty ? 'Wajib diisi' : null,
                          suffixIcon: const Icon(
                            Icons.access_time_rounded,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildField(
                          label: 'Waktu Selesai',
                          controller: _waktuSelesaiCtrl,
                          hint: '12:00',
                          readOnly: true,
                          onTap: () => _pickTime(false),
                          validator: (v) =>
                              v == null || v.isEmpty ? 'Wajib diisi' : null,
                          suffixIcon: const Icon(
                            Icons.access_time_rounded,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildField(
                    label: 'Tempat / Lokasi',
                    controller: _lokasiCtrl,
                    hint: 'Cth: RW 05 / Kelurahan / Lapangan',
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Masukkan lokasi' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildField(
                    label: 'Deskripsi Kegiatan',
                    controller: _deskripsiCtrl,
                    hint: 'Ceritakan kegiatan yang dilakukan...',
                    maxLines: 4,
                    validator: (v) => v == null || v.trim().length < 10
                        ? 'Deskripsi minimal 10 karakter'
                        : null,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (_prokerList.isNotEmpty) ...[
                _buildSectionCard(
                  title: 'Relasi Program (Opsional)',
                  icon: Icons.link_rounded,
                  children: [
                    const Text(
                      'Program Kerja Terkait',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _showProkerPicker,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCanvas,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                _selectedProkerId != null
                                    ? _prokerList
                                              .firstWhere(
                                                (p) =>
                                                    p['id']?.toString() ==
                                                    _selectedProkerId,
                                                orElse: () => {
                                                  'judul':
                                                      'Pilih Proker (Jika ada)...',
                                                },
                                              )['judul']
                                              ?.toString() ??
                                          'Pilih Proker (Jika ada)...'
                                    : 'Tidak terkait proker',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(
                              Icons.arrow_drop_down_rounded,
                              color: AppColors.textSecondary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              _buildSectionCard(
                title: 'Dokumentasi & Lampiran',
                icon: Icons.photo_library_rounded,
                children: [
                  if (_existingPhotoUrls.isNotEmpty) ...[
                    const Text(
                      'Foto Saat Ini',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 90,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _existingPhotoUrls.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) => ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            _existingPhotoUrls[i],
                            width: 90,
                            height: 90,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 90,
                              height: 90,
                              color: AppColors.backgroundCanvas,
                              child: const Icon(
                                Icons.broken_image_rounded,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  const Text(
                    'Ganti / Tambah Foto',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_newFiles.isNotEmpty) ...[
                    SizedBox(
                      height: 90,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _newFiles.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) => Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(
                                _newFiles[i],
                                width: 90,
                                height: 90,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Positioned(
                              top: 2,
                              right: 2,
                              child: GestureDetector(
                                onTap: () =>
                                    setState(() => _newFiles.removeAt(i)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(
                                    color: AppColors.dangerRed,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 12,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      side: BorderSide(
                        color: AppColors.primaryGreen.withValues(alpha: 0.5),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.add_photo_alternate_rounded),
                    label: const Text(
                      'Ambil / Pilih Foto',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    onPressed: _pickFiles,
                  ),
                ],
              ),

              const SizedBox(height: 24),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : const Text(
                          'Simpan Perubahan',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required String hint,
    int maxLines = 1,
    bool readOnly = false,
    VoidCallback? onTap,
    String? Function(String?)? validator,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          readOnly: readOnly,
          onTap: onTap,
          validator: validator,
          decoration: _inputDecoration(hint).copyWith(suffixIcon: suffixIcon),
        ),
      ],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: AppColors.primaryGreen),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
      filled: true,
      fillColor: AppColors.backgroundCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primaryGreen),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.dangerRed),
      ),
    );
  }

  void _showProkerPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          builder: (_, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
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
                          'Pilih Program Kerja',
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
                      children: [
                        _buildProkerOption(
                          ctx: ctx,
                          id: null,
                          title: 'Tidak terkait proker',
                          description:
                              'Logbook ini tidak berhubungan dengan program kerja manapun',
                        ),
                        ..._prokerList.map(
                          (p) => _buildProkerOption(
                            ctx: ctx,
                            id: p['id']?.toString(),
                            title: p['judul']?.toString() ?? '-',
                            description:
                                'Ketuk untuk mengaitkan logbook ini dengan program kerja tersebut',
                          ),
                        ),
                      ],
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

  Widget _buildProkerOption({
    required BuildContext ctx,
    required String? id,
    required String title,
    required String description,
  }) {
    final isSelected = _selectedProkerId == id;
    return InkWell(
      onTap: () {
        setState(() => _selectedProkerId = id);
        Navigator.pop(ctx);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
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
                id == null
                    ? Icons.link_off_rounded
                    : Icons.work_outline_rounded,
                size: 20,
                color: isSelected ? AppColors.primaryGreen : AppColors.textHint,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected
                      ? AppColors.primaryGreen
                      : Colors.grey.shade300,
                  width: isSelected ? 6 : 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
