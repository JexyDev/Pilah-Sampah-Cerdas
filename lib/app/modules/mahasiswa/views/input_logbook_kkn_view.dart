import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../controllers/mahasiswa_notifikasi_controller.dart';
import 'riwayat_program_kerja_view.dart'; // import provider untuk dropdown program kerja

final fasilitasWargaListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final repo = ref.read(kknRepositoryProvider);
      return repo.getFasilitasWarga();
    });

class InputLogbookKknView extends ConsumerStatefulWidget {
  const InputLogbookKknView({super.key});

  @override
  ConsumerState<InputLogbookKknView> createState() =>
      _InputLogbookKknViewState();
}

class _InputLogbookKknViewState extends ConsumerState<InputLogbookKknView> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedProkerId;
  String? _selectedFasilitasId;

  final _tanggalCtrl = TextEditingController();
  final _waktuMulaiCtrl = TextEditingController();
  final _waktuSelesaiCtrl = TextEditingController();
  final _lokasiCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;

  final List<File> _selectedFiles = [];
  bool _isLoading = false;
  bool _isPastReport = false;

  @override
  void initState() {
    super.initState();
    _tanggalCtrl.text =
        "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}";
  }

  Future<void> _showPickerOptions() async {
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
                leading: const Icon(
                  Icons.camera_alt_rounded,
                  color: AppColors.primaryGreen,
                ),
                title: const Text('Ambil dari Kamera'),
                // subtitle: const Text('Ambil foto langsung dari kamera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.photo_library_rounded,
                  color: AppColors.primaryGreen,
                ),
                title: const Text('Galeri Foto (Pilih Banyak)'),
                subtitle: const Text('Pilih satu atau beberapa foto sekaligus'),
                onTap: () {
                  Navigator.pop(context);
                  _pickFromGallery();
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.picture_as_pdf_rounded,
                  color: AppColors.primaryGreen,
                ),
                title: const Text('Dokumen PDF'),
                subtitle: const Text('Pilih file dokumen PDF'),
                onTap: () {
                  Navigator.pop(context);
                  _pickFile();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickFromCamera() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
        imageQuality: 75,
        maxWidth: 1600,
        maxHeight: 1600,
      );
      if (picked != null) {
        setState(() => _selectedFiles.add(File(picked.path)));
      }
    } catch (e) {
      debugPrint('Error pick camera: $e');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final picker = ImagePicker();
      final pickedList = await picker.pickMultiImage(
        imageQuality: 75,
        maxWidth: 1600,
        maxHeight: 1600,
      );
      if (pickedList.isNotEmpty) {
        setState(() {
          _selectedFiles.addAll(pickedList.map((p) => File(p.path)));
        });
      }
    } catch (e) {
      debugPrint('Error pick gallery: $e');
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: true,
      );
      if (result != null && result.paths.isNotEmpty) {
        setState(() {
          for (final path in result.paths) {
            if (path != null) {
              _selectedFiles.add(File(path));
            }
          }
        });
      }
    } catch (e) {
      debugPrint('Error pick file: $e');
    }
  }

  void _removeFile(int index) {
    setState(() {
      if (index >= 0 && index < _selectedFiles.length) {
        _selectedFiles.removeAt(index);
      }
    });
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: _isPastReport 
          ? today.subtract(const Duration(days: 365)) 
          : today.subtract(const Duration(days: 30)),
      lastDate: today.add(const Duration(hours: 23, minutes: 59)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryGreen,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _tanggalCtrl.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _selectTime(bool isStart) async {
    final initialTime = isStart
        ? _startTime ?? TimeOfDay.now()
        : _endTime ?? TimeOfDay.now();
    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryGreen,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        final formatted =
            "${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}";
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

  Future<void> _submit() async {
    ScaffoldMessenger.of(context).clearSnackBars();
    if (!_formKey.currentState!.validate()) return;

    if (_selectedFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto bukti kegiatan wajib diunggah (minimal 1 foto)!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final platformStr = Platform.isIOS
          ? 'IOS'
          : Platform.isAndroid
          ? 'ANDROID'
          : 'WEB';

      await repo.submitLogbookHarian({
        'tanggalKegiatan': _tanggalCtrl.text,
        'waktuMulai': _waktuMulaiCtrl.text,
        'waktuSelesai': _waktuSelesaiCtrl.text,
        'tempat': _lokasiCtrl.text.trim(),
        'deskripsi': _deskripsiCtrl.text.trim(),
        'platformOs': platformStr,
        if (_isPastReport) 'isPastReport': 'true',
        if (_selectedProkerId != null) 'programKerjaId': _selectedProkerId,
        if (_selectedFasilitasId != null) 'fasilitasId': _selectedFasilitasId,
      }, imagePaths: _selectedFiles.map((f) => f.path).toList());

      if (mounted) {
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
          title: 'Logbook Berhasil Dikirim! ✅',
          body:
              'Laporan aktivitas harian Anda telah masuk dan menunggu validasi DPL.',
          color: AppColors.primaryGreen,
          payload: 'ROUTE_POIN',
        );

        ref.invalidate(mahasiswaNotificationsProvider);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Berhasil mencatat logbook harian!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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

  @override
  Widget build(BuildContext context) {
    final prokerState = ref.watch(programKerjaListProvider);

    bool hasUnsavedChanges() {
      return _waktuMulaiCtrl.text.isNotEmpty ||
          _waktuSelesaiCtrl.text.isNotEmpty ||
          _lokasiCtrl.text.isNotEmpty ||
          _deskripsiCtrl.text.isNotEmpty ||
          _selectedProkerId != null ||
          _selectedFasilitasId != null ||
          _selectedFiles.isNotEmpty;
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
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'Batalkan Input Logbook?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Perubahan ini akan terhapus jika Anda keluar dari halaman ini.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Lanjutkan Edit',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
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
          title: Text(
            _isPastReport ? 'Input Logbook (Masa Lampau)' : 'Input Logbook Harian',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          backgroundColor: _isPastReport ? AppColors.warningOrange.withOpacity(0.1) : Colors.white,
          foregroundColor: _isPastReport ? AppColors.warningOrange : AppColors.textPrimary,
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
                _buildHeaderBanner(),
                const SizedBox(height: 16),

                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: SwitchListTile(
                    title: const Text(
                      'Mode Laporan Masa Lampau',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: const Text(
                      'Aktifkan jika laporan sudah lewat batas toleransi waktu',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    value: _isPastReport,
                    activeColor: AppColors.warningOrange,
                    onChanged: (val) {
                      setState(() {
                        _isPastReport = val;
                      });
                    },
                  ),
                ),
                const SizedBox(height: 16),

                _buildSectionCard(
                  title: 'Data Aktivitas',
                  icon: Icons.article_rounded,
                  children: [
                    const Text(
                      'Tanggal Kegiatan',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _tanggalCtrl,
                      readOnly: true,
                      onTap: _selectDate,
                      decoration: _inputDecoration('YYYY-MM-DD').copyWith(
                        suffixIcon: const Icon(
                          Icons.calendar_month_rounded,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Waktu Mulai',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _waktuMulaiCtrl,
                                readOnly: true,
                                onTap: () => _selectTime(true),
                                decoration: _inputDecoration('08:00').copyWith(
                                  suffixIcon: const Icon(
                                    Icons.access_time_rounded,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                                validator: (val) => val == null || val.isEmpty
                                    ? 'Wajib dipilih'
                                    : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Waktu Selesai',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _waktuSelesaiCtrl,
                                readOnly: true,
                                onTap: () => _selectTime(false),
                                decoration: _inputDecoration('16:00').copyWith(
                                  suffixIcon: const Icon(
                                    Icons.access_time_rounded,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                                validator: (val) => val == null || val.isEmpty
                                    ? 'Wajib dipilih'
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Lokasi / Tempat',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _lokasiCtrl,
                      decoration: _inputDecoration(
                        'Cth: RW 05 / Kelurahan / Lapangan',
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Wajib diisi' : null,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

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
                    prokerState.when(
                      loading: () => const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primaryGreen,
                        ),
                      ),
                      error: (e, _) => Text(
                        e.toString(),
                        style: const TextStyle(color: AppColors.dangerRed),
                      ),
                      data: (list) {
                        final approvedProker = list.where((p) {
                          return p['status'] == 'APPROVED' ||
                              p['statusUsulan'] == 'APPROVED';
                        }).toList();

                        return DropdownButtonFormField<String>(
                          isExpanded: true,
                          initialValue: _selectedProkerId,
                          decoration: _inputDecoration(
                            'Pilih Proker (Jika ada)...',
                          ),
                          items: approvedProker
                              .map(
                                (p) => DropdownMenuItem(
                                  value: p['id'].toString(),
                                  child: Text(
                                    p['judul'],
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: (val) =>
                              setState(() => _selectedProkerId = val),
                        );
                      },
                    ),

                    const SizedBox(height: 16),
                    const Text(
                      'Fasilitas Warga Terkait',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Consumer(
                      builder: (ctx, ref, _) {
                        final fasState = ref.watch(fasilitasWargaListProvider);
                        return fasState.when(
                          loading: () => const LinearProgressIndicator(
                            color: AppColors.primaryGreen,
                          ),
                          error: (e, _) => Text(
                            e.toString(),
                            style: const TextStyle(color: AppColors.dangerRed),
                          ),
                          data: (list) {
                            return DropdownButtonFormField<String>(
                              isExpanded: true,
                              initialValue: _selectedFasilitasId,
                              decoration: _inputDecoration(
                                'Pilih Fasilitas (Jika ada)...',
                              ),
                              items: list
                                  .map(
                                    (f) => DropdownMenuItem(
                                      value: f['id'].toString(),
                                      child: Text(
                                        f['nama'] ?? '-',
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (val) =>
                                  setState(() => _selectedFasilitasId = val),
                            );
                          },
                        );
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                _buildSectionCard(
                  title: 'Uraian & Dokumentasi',
                  icon: Icons.edit_note_rounded,
                  children: [
                    const Text(
                      'Uraian Aktivitas & Hasil',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _deskripsiCtrl,
                      maxLines: 4,
                      decoration: _inputDecoration(
                        'Ceritakan secara singkat apa yang dilakukan dan bagaimana hasilnya...',
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Dokumentasi Kegiatan (Wajib) *',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (_selectedFiles.isNotEmpty)
                          Text(
                            '${_selectedFiles.length} file dipilih',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_selectedFiles.isEmpty)
                      InkWell(
                        onTap: _showPickerOptions,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          height: 140,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: AppColors.primaryGreen.withValues(
                                alpha: 0.5,
                              ),
                              width: 1.5,
                              style: BorderStyle.solid,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            color: AppColors.primaryGreen.withValues(
                              alpha: 0.05,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.primaryGreen.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                child: const Icon(
                                  Icons.add_photo_alternate_rounded,
                                  size: 32,
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Pilih / Ambil Foto atau PDF',
                                style: TextStyle(
                                  color: AppColors.primaryGreen,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Mendukung multi-foto & dokumen PDF',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            height: 120,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: _selectedFiles.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: 10),
                              itemBuilder: (context, idx) {
                                final file = _selectedFiles[idx];
                                final isPdf = file.path.toLowerCase().endsWith(
                                  '.pdf',
                                );
                                return Stack(
                                  children: [
                                    Container(
                                      width: 110,
                                      height: 120,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: AppColors.border,
                                        ),
                                        color: Colors.grey[100],
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(9),
                                        child: isPdf
                                            ? Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  const Icon(
                                                    Icons
                                                        .picture_as_pdf_rounded,
                                                    size: 36,
                                                    color: AppColors.dangerRed,
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Padding(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 4,
                                                        ),
                                                    child: Text(
                                                      file.path.split('/').last,
                                                      maxLines: 2,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      textAlign:
                                                          TextAlign.center,
                                                      style: const TextStyle(
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              )
                                            : Image.file(
                                                file,
                                                fit: BoxFit.cover,
                                                width: 110,
                                                height: 120,
                                              ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 4,
                                      right: 4,
                                      child: GestureDetector(
                                        onTap: () => _removeFile(idx),
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: Colors.black54,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.close_rounded,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: _showPickerOptions,
                            icon: const Icon(
                              Icons.add_circle_outline_rounded,
                              size: 18,
                            ),
                            label: const Text('Tambah Foto / Dokumen Lainnya'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primaryGreen,
                              side: const BorderSide(
                                color: AppColors.primaryGreen,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),

                const SizedBox(height: 32),

                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send_rounded, size: 20),
                            SizedBox(width: 10),
                            Text(
                              'Kirim Logbook Harian',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primaryGreen.withValues(alpha: 0.3),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.primaryGreen,
            size: 24,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Catat Aktivitas Harian',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Laporan harian ini akan menjadi dasar penilaian kinerja individu maupun kelompok oleh DPL Anda.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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
        borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.dangerRed),
      ),
    );
  }
}
