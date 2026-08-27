import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/utils/thousands_formatter.dart';

import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../riwayat/controllers/riwayat_controller.dart' show pointHistoryProvider;
import '../controllers/mahasiswa_notifikasi_controller.dart';
import 'riwayat_program_kerja_view.dart'; // import provider untuk dropdown program kerja

final fasilitasWargaListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getFasilitasWarga();
});

class LogbookPemanfaatanView extends ConsumerStatefulWidget {
  const LogbookPemanfaatanView({super.key});

  @override
  ConsumerState<LogbookPemanfaatanView> createState() => _LogbookPemanfaatanViewState();
}

class _LogbookPemanfaatanViewState extends ConsumerState<LogbookPemanfaatanView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedProkerId;
  String? _selectedFasilitasId;
  
  final List<String> _teknologiList = [
    'Kompos Organik (Buruan Sae)',
    'Maggot BSF',
    'Pupuk Organik Cair (POC)',
    'Bank Sampah Anorganik',
    'Loseda (Lorong Sisa Dapur)',
    'Bata Terawang',
    'Kompos Keranjang Takakura',
    'Daur Ulang Anorganik Lainnya',
  ];
  String? _selectedTeknologi = 'Kompos Organik (Buruan Sae)';

  final _bahanBakuCtrl = TextEditingController();
  final _beratInputCtrl = TextEditingController();
  File? _selectedImage;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.rear,
      imageQuality: 70,
    );
    if (picked != null) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProkerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Program Kerja terlebih dahulu.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      // Dummy coords for context
      const double latitude = 0.0;
      const double longitude = 0.0;

      await repo.submitLogbookPemanfaatan({
        'programKerjaId': _selectedProkerId,
        if (_selectedFasilitasId != null) 'fasilitasId': _selectedFasilitasId,
        'teknologi': _selectedTeknologi ?? 'Kompos Organik (Buruan Sae)',
        'bahanBaku': _bahanBakuCtrl.text.trim(),
        'beratInputKg': double.tryParse(_beratInputCtrl.text.trim().replaceAll('.', '')) ?? 0,
        'latitude': latitude,
        'longitude': longitude,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        // 1. Tampilkan Notifikasi Latar Belakang (Push Notification Local)
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
          title: 'Kegiatan Berhasil Dicatat! 🎉',
          body: 'Laporan kegiatan/aksi KKN Anda telah disubmit dan mendapatkan poin KKN.',
          color: AppColors.primaryGreen,
          payload: 'ROUTE_POIN',
        );

        // 2. Invalidate Data Poin dan Notifikasi agar langsung update
        ref.invalidate(pointHistoryProvider);
        ref.invalidate(mahasiswaNotificationsProvider);

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Berhasil mencatat aksi harian!'),
          backgroundColor: AppColors.success,
        ));
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
    _bahanBakuCtrl.dispose();
    _beratInputCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final prokerState = ref.watch(programKerjaListProvider);
    bool hasUnsavedChanges() {
      return _selectedProkerId != null ||
             _selectedFasilitasId != null ||
             _bahanBakuCtrl.text.isNotEmpty ||
             _beratInputCtrl.text.isNotEmpty ||
             _selectedImage != null;
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
              title: const Text('Batalkan Input Laporan?', style: TextStyle(fontWeight: FontWeight.bold)),
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
        title: const Text('Laporan Kegiatan Pemanfaatan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
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
              _buildHeaderBanner(),
              const SizedBox(height: 16),
              
              _buildSectionCard(
                title: 'Data Program',
                icon: Icons.assignment_rounded,
                children: [
                  const Text('Pilih Program (Hanya yang di-ACC)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  prokerState.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
                    error: (e, _) => Text(e.toString(), style: const TextStyle(color: AppColors.dangerRed)),
                    data: (list) {
                      final approvedProker = list.where((p) {
                        final isApproved = p['status'] == 'APPROVED' || p['statusUsulan'] == 'APPROVED';
                        
                        // Check if expired
                        bool isExpired = false;
                        final rawWaktu = p['waktuPelaksanaan'] ?? p['waktu_pelaksanaan'] ?? '';
                        if (rawWaktu.toString().isNotEmpty) {
                          final RegExp dateRegex = RegExp(r'\d{4}-\d{2}-\d{2}');
                          final matches = dateRegex.allMatches(rawWaktu.toString());
                          if (matches.isNotEmpty) {
                            final lastMatch = matches.last.group(0)!;
                            final endDate = DateTime.tryParse(lastMatch);
                            if (endDate != null && DateTime.now().isAfter(endDate.add(const Duration(days: 1)))) {
                              isExpired = true;
                            }
                          }
                        }
                        
                        return isApproved && !isExpired;
                      }).toList();
                      if (approvedProker.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.dangerRed.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
                          ),
                          child: const Text(
                            'Belum ada Program Kerja yang disetujui DPL.',
                            style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
                          ),
                        );
                      }
                      return _buildBottomSheetDropdown(
                        hint: 'Pilih Proker...',
                        title: 'Pilih Program Kerja',
                        selectedValue: _selectedProkerId,
                        items: approvedProker.map((p) => {
                          'id': p['id'].toString(),
                          'label': p['judul'],
                          'icon': Icons.assignment_rounded,
                        }).toList(),
                        onSelected: (val) => setState(() => _selectedProkerId = val),
                      );
                    },
                  ),

                  const SizedBox(height: 16),
                  const Text('Pilih Fasilitas Warga (Opsional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Consumer(
                    builder: (ctx, ref, _) {
                      final fasState = ref.watch(fasilitasWargaListProvider);
                      return fasState.when(
                        loading: () => const LinearProgressIndicator(color: AppColors.primaryGreen),
                        error: (e, _) => Text(e.toString(), style: const TextStyle(color: AppColors.dangerRed)),
                        data: (list) {
                          if (list.isEmpty) {
                            return const Text('Tidak ada fasilitas warga di RW ini.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontStyle: FontStyle.italic));
                          }
                          return _buildBottomSheetDropdown(
                            hint: 'Pilih Fasilitas...',
                            title: 'Fasilitas Warga',
                            selectedValue: _selectedFasilitasId,
                            items: list.map((f) => {
                              'id': f['id'].toString(),
                              'label': f['nama'] ?? '-',
                              'icon': Icons.business_rounded,
                            }).toList(),
                            onSelected: (val) => setState(() => _selectedFasilitasId = val),
                            isRequired: false,
                          );
                        }
                      );
                  }),
                ],
              ),

              const SizedBox(height: 16),

              _buildSectionCard(
                title: 'Detail Kegiatan',
                icon: Icons.tune_rounded,
                children: [
                  const Text('Teknologi / Metode Pengolahan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  _buildBottomSheetDropdown(
                    hint: 'Pilih Jenis Pengolahan',
                    title: 'Metode Pengolahan',
                    selectedValue: _selectedTeknologi,
                    items: _teknologiList.map((tek) => {
                      'id': tek,
                      'label': tek,
                      'icon': Icons.science_rounded,
                    }).toList(),
                    onSelected: (val) => setState(() => _selectedTeknologi = val),
                  ),
                  const SizedBox(height: 16),

                  const Text('Bahan Baku Utama', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _bahanBakuCtrl,
                    decoration: _inputDecoration('Contoh: Sisa Makanan Warga'),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),

                  const Text('Berat Sampah Masuk (Input)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _beratInputCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [ThousandsFormatter()],
                    decoration: _inputDecoration('').copyWith(suffixText: 'Kg'),
                    validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              _buildSectionCard(
                title: 'Dokumentasi',
                icon: Icons.camera_alt_rounded,
                children: [
                  const Text('Foto Dokumentasi Aksi (Opsional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _pickImage,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5), width: 1.5, style: BorderStyle.solid),
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.primaryGreen.withValues(alpha: 0.05),
                      ),
                      child: _selectedImage != null
                          ? ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.file(_selectedImage!, fit: BoxFit.cover, width: double.infinity))
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3))),
                                  child: const Icon(Icons.add_a_photo_rounded, size: 32, color: AppColors.primaryGreen),
                                ),
                                  const SizedBox(height: 12),
                                  const Text('Ambil Foto Kegiatan (Kamera Langsung)', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w600, fontSize: 13)),
                                ],
                            ),
                    ),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded, size: 20),
                          SizedBox(width: 10),
                          Text('Simpan Laporan & Dapatkan Poin', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
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
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.stars_rounded, color: AppColors.warningOrange, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Lapor Kegiatan = Poin',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 14),
                ),
                SizedBox(height: 4),
                Text(
                  'Setiap laporan pemanfaatan sampah yang kamu simpan akan menambahkan poin kontribusi KKN.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
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
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
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

  void _showBottomSheetSelection({
    required String title,
    required List<Map<String, dynamic>> items,
    required String? selectedValue,
    required ValueChanged<String> onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
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
                        Text(
                          title,
                          style: const TextStyle(
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
                      children: items.map((item) {
                        final isSelected = selectedValue == item['id'];
                        return InkWell(
                          onTap: () {
                            onSelected(item['id']);
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
                                    color: isSelected ? const Color(0xFFE8F5E9) : const Color(0xFFF5F7FA),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    item['icon'] ?? Icons.check_circle_outline,
                                    size: 20,
                                    color: isSelected ? AppColors.primaryGreen : AppColors.textHint,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    item['label'],
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                      color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  Container(
                                    width: 24,
                                    height: 24,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primaryGreen,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.check,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                  )
                                else
                                  Container(
                                    width: 24,
                                    height: 24,
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

  Widget _buildBottomSheetDropdown({
    required String hint,
    required String title,
    required String? selectedValue,
    required List<Map<String, dynamic>> items,
    required ValueChanged<String> onSelected,
    bool isRequired = true,
  }) {
    String? selectedLabel;
    if (selectedValue != null) {
      final matches = items.where((e) => e['id'] == selectedValue).toList();
      if (matches.isNotEmpty) {
        selectedLabel = matches.first['label'] as String?;
      } else {
        selectedLabel = selectedValue;
      }
    }

    return FormField<String>(
      initialValue: selectedValue,
      validator: (val) => isRequired && selectedValue == null ? 'Wajib dipilih' : null,
      builder: (state) {
        return InkWell(
          onTap: () {
            _showBottomSheetSelection(
              title: title,
              items: items,
              selectedValue: selectedValue,
              onSelected: (val) {
                onSelected(val);
                state.didChange(val);
              },
            );
          },
          child: InputDecorator(
            decoration: _inputDecoration(hint).copyWith(
              errorText: state.errorText,
              suffixIcon: const Icon(Icons.arrow_drop_down, color: AppColors.textSecondary),
            ),
            child: Text(
              selectedLabel ?? hint,
              style: TextStyle(
                fontSize: 14,
                color: selectedLabel != null ? AppColors.textPrimary : AppColors.textHint,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        );
      },
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
