import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/posko_kkn_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';

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
  LatLng? _selectedLocation;
  bool _isGettingLocation = false;
  bool _isEditMode = false;
  bool _hasTriggeredAutoGps = false;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final posko = ref.read(poskoKknProvider).poskoResponse?.posko;
      if (posko == null && !_hasTriggeredAutoGps) {
        _hasTriggeredAutoGps = true;
        _getLocation();
      }
    });
  }

  @override
  void dispose() {
    _namaController.dispose();
    _alamatController.dispose();
    super.dispose();
  }

  void _showImagePickerSource() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Pilih Sumber Foto',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              ListTile(
                leading: const Icon(
                  Icons.camera_alt_rounded,
                  color: AppColors.primaryGreen,
                ),
                title: const Text('Kamera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.photo_library_rounded,
                  color: AppColors.primaryBlue,
                ),
                title: const Text('Galeri'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: source,
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
        _selectedLocation = LatLng(position.latitude, position.longitude);
        _mapController.move(_selectedLocation!, 15.0);
      });
    } catch (e) {
      if (mounted) {
        final errText = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errText),
            backgroundColor: AppColors.dangerRed,
            action:
                (errText.toLowerCase().contains('izin') ||
                    errText.toLowerCase().contains('ditolak'))
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

    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap tentukan lokasi posko dari GPS atau peta.'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    if (!_isEditMode && _photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap lampirkan foto posko tampak depan.'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    bool success = false;
    if (_isEditMode) {
      success = await ref.read(poskoKknProvider.notifier).updatePosko(
            latitude: _selectedLocation!.latitude,
            longitude: _selectedLocation!.longitude,
            nama: _namaController.text.trim(),
            alamat: _alamatController.text.trim(),
            imagePath: _photoPath,
          );
    } else {
      success = await ref.read(poskoKknProvider.notifier).registerPosko(
            latitude: _selectedLocation!.latitude,
            longitude: _selectedLocation!.longitude,
            nama: _namaController.text.trim(),
            alamat: _alamatController.text.trim(),
            imagePath: _photoPath!,
          );
    }

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEditMode
                ? 'Berhasil memperbarui data posko KKN!'
                : 'Berhasil mendaftarkan posko KKN!',
          ),
          backgroundColor: AppColors.primaryGreen,
        ),
      );
      setState(() => _isEditMode = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(poskoKknProvider);

    // Check if error
    if (state.error != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(state.error!),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      });
    }

    final hasExistingPosko = state.poskoResponse?.posko != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _isEditMode
              ? 'Pembaruan Posko KKN'
              : (hasExistingPosko ? 'Detail Posko KKN' : 'Daftar Posko KKN'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          if (_isEditMode && hasExistingPosko)
            TextButton(
              onPressed: () => setState(() => _isEditMode = false),
              child: const Text('Batal', style: TextStyle(color: AppColors.dangerRed)),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade200, height: 1),
        ),
      ),
      backgroundColor: AppColors.backgroundCanvas,
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            )
          : (hasExistingPosko && !_isEditMode)
          ? _buildPoskoStatus(context, state.poskoResponse!.posko!)
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppDimensions.lg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _SectionLabel(
                      icon: Icons.business_rounded,
                      label: 'Nama Posko',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _namaController,
                      hintText: 'Cth: Posko KKN Kelompok 12 Dago',
                      validator: (val) => (val == null || val.isEmpty)
                          ? 'Nama posko wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    const _SectionLabel(
                      icon: Icons.map_rounded,
                      label: 'Alamat Lengkap',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _alamatController,
                      maxLines: 2,
                      hintText: 'Cth: Jl. Dago Asri No. 12, RT 03 / RW 08',
                      validator: (val) => (val == null || val.isEmpty)
                          ? 'Alamat lengkap wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    const _SectionLabel(
                      icon: Icons.location_on_rounded,
                      label: 'Koordinat GPS Posko',
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Tentukan lokasi posko pada peta dengan menempatkan pin di posisi yang tepat.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      height: 250,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter:
                                  _selectedLocation ??
                                  const LatLng(-6.914744, 107.609810),
                              initialZoom: 15.0,
                              onTap: (tapPosition, point) {
                                setState(() {
                                  _selectedLocation = point;
                                });
                              },
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName:
                                    'com.makerindo.pilahsampah',
                              ),
                              if (_selectedLocation != null)
                                MarkerLayer(
                                  markers: [
                                    Marker(
                                      point: _selectedLocation!,
                                      width: 36,
                                      height: 36,
                                      child: const Icon(
                                        Icons.home_work_rounded,
                                        size: 28,
                                        color: AppColors.primaryGreen,
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                          // Floating "Lokasi Saya" button
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              elevation: 2,
                              child: InkWell(
                                onTap: _isGettingLocation ? null : _getLocation,
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _isGettingLocation
                                          ? const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: AppColors.primaryGreen,
                                              ),
                                            )
                                          : const Icon(
                                              Icons.my_location_rounded,
                                              size: 18,
                                              color: AppColors.primaryGreen,
                                            ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'Lokasi Saya',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // Label coordinate overlay
                          if (_selectedLocation != null)
                            Positioned(
                              bottom: 12,
                              left: 12,
                              right: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.05,
                                      ),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.pin_drop_rounded,
                                      size: 16,
                                      color: AppColors.primaryGreen,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        '${_selectedLocation!.latitude.toStringAsFixed(5)}, ${_selectedLocation!.longitude.toStringAsFixed(5)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppDimensions.md),

                    const _SectionLabel(
                      icon: Icons.camera_alt_rounded,
                      label: 'Foto Posko',
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Ambil foto langsung dari kamera atau unggah dari galeri.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: _showImagePickerSource,
                      child: Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _photoPath != null
                                ? AppColors.primaryGreen
                                : AppColors.border,
                            width: _photoPath != null ? 2 : 1,
                          ),
                        ),
                        child: _photoPath != null
                            ? Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(14),
                                    child: Image.file(
                                      File(_photoPath!),
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                      height: double.infinity,
                                    ),
                                  ),
                                  Positioned(
                                    top: 12,
                                    right: 12,
                                    child: GestureDetector(
                                      onTap: () =>
                                          setState(() => _photoPath = null),
                                      child: Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(
                                            alpha: 0.6,
                                          ),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.close,
                                          color: Colors.white,
                                          size: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryGreen.withValues(
                                        alpha: 0.1,
                                      ),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.add_a_photo_rounded,
                                      size: 32,
                                      color: AppColors.primaryGreen,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'Ketuk untuk menambah foto',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Format JPG/PNG',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: state.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: state.isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Kirim Pendaftaran Posko',
                                style: TextStyle(
                                  fontSize: 16,
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

  Widget _buildPoskoStatus(BuildContext context, PoskoKknData posko) {
    final kelompokState = ref.watch(kelompokKknProvider);
    final kelompokData = kelompokState.kelompok;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Badge Terverifikasi
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.primaryGreen.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.verified_rounded,
                    color: AppColors.primaryGreen,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    posko.statusApproval == 'APPROVED'
                        ? 'Terverifikasi Resmi'
                        : 'Menunggu Verifikasi',
                    style: const TextStyle(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    posko.nama.isNotEmpty ? posko.nama : 'Posko KKN',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    kelompokData?.groupName ?? 'Kelompok KKN',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(),
                  ),

                  const Row(
                    children: [
                      Icon(
                        Icons.location_on_rounded,
                        color: AppColors.primaryGreen,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Alamat Lengkap',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    posko.alamat,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Row(
                    children: [
                      Icon(
                        Icons.pin_drop_rounded,
                        color: AppColors.primaryBlue,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Koordinat GPS',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundCanvas,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${posko.latitude}, ${posko.longitude}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.copy_rounded,
                            size: 18,
                            color: AppColors.textSecondary,
                          ),
                          onPressed: () {
                            Clipboard.setData(
                              ClipboardData(
                                text: '${posko.latitude},${posko.longitude}',
                              ),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Koordinat disalin!'),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.map_rounded, size: 18),
                      label: const Text('Buka di Google Maps'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryBlue,
                        side: const BorderSide(color: AppColors.primaryBlue),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: () async {
                        final url = Uri.parse(
                          'https://www.google.com/maps/search/?api=1&query=${posko.latitude},${posko.longitude}',
                        );
                        if (await canLaunchUrl(url)) {
                          await launchUrl(
                            url,
                            mode: LaunchMode.externalApplication,
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (kelompokData != null && kelompokData.dosenPembimbing != '-') ...[
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.school_rounded,
                          color: AppColors.warningYellow,
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Dosen Pembimbing (DPL)',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      kelompokData.dosenPembimbing,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (kelompokData.dplNip != '-') ...[
                      const SizedBox(height: 4),
                      Text(
                        'NIP: ${kelompokData.dplNip}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    if (kelompokData.dplPhone != '-') ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          icon: Image.asset(
                            'assets/icons/ic_whatsapp.png',
                            width: 18,
                            height: 18,
                            errorBuilder: (c, e, s) =>
                                const Icon(Icons.chat, size: 18),
                          ),
                          label: const Text('Hubungi via WhatsApp'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF25D366),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          onPressed: () async {
                            final rawPhone = kelompokData.dplPhone;
                            final cleanPhone = rawPhone
                                .replaceAll(RegExp(r'[^0-9]'), '')
                                .replaceFirst(RegExp(r'^0'), '62');
                            final waUrl = Uri.parse(
                              'https://wa.me/$cleanPhone',
                            );
                            if (await canLaunchUrl(waUrl)) {
                              await launchUrl(
                                waUrl,
                                mode: LaunchMode.externalApplication,
                              );
                            }
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
          if (ref.watch(poskoKknProvider).poskoResponse?.isUserLeader == true) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.edit_location_alt_rounded, size: 20),
                label: const Text(
                  'Perbarui Data & Lokasi Posko',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryGreen,
                  side: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  setState(() {
                    _isEditMode = true;
                    _namaController.text = posko.nama;
                    _alamatController.text = posko.alamat;
                    _selectedLocation = LatLng(posko.latitude, posko.longitude);
                    _photoPath = null;
                  });
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SectionLabel({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primaryGreen),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _StyledTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final String? Function(String?)? validator;
  final int maxLines;

  const _StyledTextField({
    required this.controller,
    required this.hintText,
    this.validator,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      validator: validator,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
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
          borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dangerRed, width: 2),
        ),
      ),
    );
  }
}
