import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../providers/repository_providers.dart';

class TimbanganResiduScreen extends ConsumerStatefulWidget {
  const TimbanganResiduScreen({super.key});

  @override
  ConsumerState<TimbanganResiduScreen> createState() => _TimbanganResiduScreenState();
}

class _TimbanganResiduScreenState extends ConsumerState<TimbanganResiduScreen> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  
  List<Map<String, dynamic>> _areas = [];
  String? _selectedAreaId;
  String? _photoPath;
  bool _isLoadingAreas = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAreas();
  }

  @override
  void dispose() {
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _loadAreas() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/areas/rt-rw');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? [];
        setState(() {
          _areas = data.map((e) => {
            'id': e['id'].toString(),
            'name': e['name'].toString(),
          }).toList();
          _isLoadingAreas = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Gagal memuat daftar wilayah RT/RW';
        _isLoadingAreas = false;
      });
    }
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (file != null) {
        setState(() {
          _photoPath = file.path;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: AppColors.dangerRed),
      );
    }
  }

  Future<void> _submitLog() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto bukti timbangan residu wajib diunggah!'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final formData = FormData.fromMap({
        'rtRwId': _selectedAreaId,
        'beratKg': _weightController.text.trim(),
        'image': await MultipartFile.fromFile(
          _photoPath!,
          filename: 'residu_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        '/transactions/residu',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Setoran residu agregat berhasil dicatat!'), backgroundColor: AppColors.primaryGreen),
          );
          Navigator.of(context).pop(true);
        }
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? 'Gagal mencatat setoran residu';
      setState(() {
        _errorMessage = msg;
        _isSubmitting = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Terjadi kesalahan sistem: $e';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Input Timbangan Residu', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoadingAreas
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppDimensions.md),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(AppDimensions.sm),
                        margin: const EdgeInsets.only(bottom: AppDimensions.md),
                        decoration: BoxDecoration(
                          color: AppColors.dangerRed.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.dangerRed),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.w600),
                        ),
                      ),
                    
                    // Wilayah RT/RW
                    const Text('Wilayah RT/RW Penjemputan', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    const SizedBox(height: AppDimensions.xs),
                    DropdownButtonFormField<String>(
                      value: _selectedAreaId,
                      hint: const Text('Pilih RT / RW'),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      items: _areas.map((area) {
                        return DropdownMenuItem<String>(
                          value: area['id'],
                          child: Text(area['name']),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedAreaId = val),
                      validator: (val) => val == null ? 'Wilayah RT/RW wajib dipilih' : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // Berat (Kg)
                    const Text('Berat Aktual Residu (Kg)', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    const SizedBox(height: AppDimensions.xs),
                    TextFormField(
                      controller: _weightController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))],
                      decoration: InputDecoration(
                        hintText: 'Contoh: 12.5',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        suffixText: 'Kg',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Berat residu wajib diisi';
                        final double? weight = double.tryParse(val);
                        if (weight == null || weight <= 0) return 'Masukkan berat yang valid (> 0)';
                        return null;
                      },
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // Foto Bukti
                    const Text('Foto Bukti Timbangan', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    const SizedBox(height: AppDimensions.xs),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border, width: 1.5),
                        ),
                        child: _photoPath != null
                            ? Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(14),
                                    child: Image.file(File(_photoPath!), fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                                  ),
                                  Positioned(
                                    right: 8,
                                    top: 8,
                                    child: CircleAvatar(
                                      backgroundColor: Colors.black.withValues(alpha: 0.5),
                                      child: IconButton(
                                        icon: const Icon(Icons.edit, color: Colors.white),
                                        onPressed: _pickImage,
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.camera_alt_rounded, size: 48, color: AppColors.primaryGreen),
                                  const SizedBox(height: 8),
                                  Text('Ambil Foto Timbangan Fisik', style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.8), fontWeight: FontWeight.w600)),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: AppDimensions.lg),

                    // Tombol Submit
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitLog,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Simpan Data Timbangan', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
