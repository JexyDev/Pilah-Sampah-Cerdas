import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/thousands_formatter.dart';
import '../../../data/providers/repository_providers.dart';

final unharvestedLogbooksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final repo = ref.watch(kknRepositoryProvider);
  return repo.getUnharvestedLogbooks();
});

class CatatPanenView extends ConsumerStatefulWidget {
  const CatatPanenView({super.key});

  @override
  ConsumerState<CatatPanenView> createState() => _CatatPanenViewState();
}

class _CatatPanenViewState extends ConsumerState<CatatPanenView> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedPemanfaatanId;
  final _beratOutputCtrl = TextEditingController();
  final _nilaiEkonomiCtrl = TextEditingController();
  File? _selectedImage;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPemanfaatanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Laporan Kegiatan terlebih dahulu.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitPanenHasil({
        'pemanfaatanId': _selectedPemanfaatanId,
        'beratOutputKg': double.tryParse(_beratOutputCtrl.text.trim().replaceAll('.', '')) ?? 0,
        'nilaiEkonomiRp': double.tryParse(_nilaiEkonomiCtrl.text.trim().replaceAll('.', '')) ?? 0,
      }, imagePath: _selectedImage?.path);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil mencatat hasil!')));
        ref.invalidate(unharvestedLogbooksProvider);
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
  Widget build(BuildContext context) {
    final unharvestedState = ref.watch(unharvestedLogbooksProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Catat Hasil', style: TextStyle(fontSize: 18)),
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
              
              const Text('Pilih Laporan (Sumber Hasil)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              unharvestedState.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text(e.toString()),
                data: (list) {
                  if (list.isEmpty) {
                    return const Text('Tidak ada laporan kegiatan yang belum dicatat hasilnya.', style: TextStyle(color: AppColors.dangerRed));
                  }
                  return _buildBottomSheetDropdown(
                    hint: 'Pilih Laporan...',
                    title: 'Pilih Laporan Kegiatan',
                    selectedValue: _selectedPemanfaatanId,
                    items: list.map((p) => {
                      'id': p['id'].toString(),
                      'label': "${p['program'] ?? ''} - ${p['teknologi'] ?? ''}",
                      'icon': Icons.assignment_rounded,
                    }).toList(),
                    onSelected: (val) => setState(() => _selectedPemanfaatanId = val),
                  );
                },
              ),
              const SizedBox(height: 16),

              const Text('Berat Hasil Jadi (Output)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _beratOutputCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsFormatter()],
                decoration: const InputDecoration(border: OutlineInputBorder(), suffixText: 'Kg', hintText: 'Contoh: 5'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Estimasi Nilai Ekonomi (Rp)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nilaiEkonomiCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsFormatter()],
                decoration: const InputDecoration(border: OutlineInputBorder(), prefixText: 'Rp ', hintText: 'Contoh: 50.000'),
                validator: (val) => val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              const Text('Foto Hasil', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(8),
                    color: AppColors.backgroundCanvas,
                  ),
                  child: _selectedImage != null
                      ? ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(_selectedImage!, fit: BoxFit.cover))
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, size: 40, color: AppColors.textSecondary),
                            SizedBox(height: 8),
                            Text('Ambil / Pilih Foto', style: TextStyle(color: AppColors.textSecondary)),
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
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan Panen', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
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
                                    item['icon'] ?? Icons.assignment_rounded,
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
            decoration: InputDecoration(
              border: const OutlineInputBorder(),
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
}
