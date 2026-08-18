giimport 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/posko_kkn_controller.dart';
import 'package:permission_handler/permission_handler.dart';

class RegisterPoskoView extends ConsumerStatefulWidget {
  const RegisterPoskoView({super.key});

  @override
  ConsumerState<RegisterPoskoView> createState() => _RegisterPoskoViewState();
}

class _RegisterPoskoViewState extends ConsumerState<RegisterPoskoView> {
  final _formKey = GlobalKey<FormState>();
  final _namaController = TextEditingController();
  final _alamatController = TextEditingController();
  
  String? _photoPath;
  Position? _currentPosition;
  bool _isGettingLocation = false;

  @override
  void dispose() {
    _namaController.dispose();
    _alamatController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 1080,
      maxHeight: 1080,
    );
    if (file != null) {
      setState(() => _photoPath = file.path);
    }
  }

  Future<void> _getLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Layanan lokasi tidak aktif.');
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Izin lokasi ditolak.');
        }
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Izin lokasi ditolak permanen.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      
      setState(() {
        _currentPosition = position;
      });
    } catch (e) {
      if (mounted) {
        final errText = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errText), 
            backgroundColor: AppColors.dangerRed,
            action: (errText.toLowerCase().contains('izin') || errText.toLowerCase().contains('ditolak')) 
              ? SnackBarAction(
                  label: 'Pengaturan',
                  textColor: Colors.white,
                  onPressed: () => openAppSettings(),
                )
              : null,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGettingLocation = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harap ambil koordinat lokasi posko.'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }

    final success = await ref.read(poskoKknProvider.notifier).registerPosko(
      latitude: _currentPosition!.latitude,
      longitude: _currentPosition!.longitude,
      nama: _namaController.text,
      alamat: _alamatController.text,
      imagePath: _photoPath,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Berhasil mendaftarkan posko KKN!'), backgroundColor: AppColors.primaryGreen),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(poskoKknProvider);
    
    // Check if error
    if (state.error != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(state.error!), backgroundColor: AppColors.dangerRed),
        );
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daftar Posko KKN', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.textPrimary)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      backgroundColor: AppColors.backgroundCanvas,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Nama Posko', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _namaController,
                decoration: InputDecoration(
                  hintText: 'Cth: Posko KKN Kelompok 12 Dago',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: AppDimensions.md),

              const Text('Alamat Lengkap', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _alamatController,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Cth: Jl. Dago Asri No. 12, RT 03 / RW 08',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: AppDimensions.md),
              
              const Text('Koordinat GPS Posko', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _currentPosition == null ? AppColors.warningYellow : AppColors.primaryGreen),
                ),
                child: Column(
                  children: [
                    if (_currentPosition != null) ...[
                      const Icon(Icons.location_on_rounded, color: AppColors.primaryGreen, size: 32),
                      const SizedBox(height: 8),
                      Text('Lat: ${_currentPosition!.latitude}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text('Lng: ${_currentPosition!.longitude}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                    ] else ...[
                      const Icon(Icons.location_off_rounded, color: AppColors.textHint, size: 32),
                      const SizedBox(height: 8),
                      const Text('Koordinat belum diatur', style: TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 12),
                    ],
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isGettingLocation ? null : _getLocation,
                        icon: _isGettingLocation ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.my_location_rounded),
                        label: Text(_currentPosition == null ? 'Dapatkan Lokasi Saat Ini' : 'Perbarui Lokasi'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.md),

              const Text('Foto Posko (Opsional)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
                  ),
                  child: _photoPath != null
                      ? Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(File(_photoPath!), fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                            ),
                            Positioned(
                              top: 8, right: 8,
                              child: GestureDetector(
                                onTap: () => setState(() => _photoPath = null),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, color: Colors.white, size: 16),
                                ),
                              ),
                            )
                          ],
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_outlined, size: 40, color: AppColors.textHint),
                            SizedBox(height: 8),
                            Text('Ketuk untuk unggah foto posko', style: TextStyle(color: AppColors.textHint)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: AppDimensions.xxl),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: state.isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: state.isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Daftarkan Posko', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              SizedBox(height: MediaQuery.of(context).padding.bottom + 40),
            ],
          ),
        ),
      ),
    );
  }
}
