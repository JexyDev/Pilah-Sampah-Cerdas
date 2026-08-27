import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../controllers/fasilitas_kkn_controller.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../auth/controllers/auth_controller.dart';

import 'package:flutter/services.dart';

class RegisterFasilitasView extends ConsumerStatefulWidget {
  const RegisterFasilitasView({super.key});

  @override
  ConsumerState<RegisterFasilitasView> createState() =>
      _RegisterFasilitasViewState();
}

class _RegisterFasilitasViewState extends ConsumerState<RegisterFasilitasView> {
  final _formKey = GlobalKey<FormState>();
  final _namaController = TextEditingController();
  final _picController = TextEditingController();
  final _kontakController = TextEditingController();
  final _kapasitasController = TextEditingController();
  final _alamatController = TextEditingController();
  final MapController _mapController = MapController();
  
  String _kapasitasUnit = 'Kg';

  String? _selectedJenis;
  String? _photoPath;
  LatLng? _selectedLocation;
  bool _isGettingLocation = false;

  @override
  void initState() {
    super.initState();
    // Fetch master data jenis fasilitas dari backend
    Future.microtask(() {
      ref.read(fasilitasKknProvider.notifier).fetchJenisFasilitas();
    });
  }

  @override
  void dispose() {
    _namaController.dispose();
    _picController.dispose();
    _kontakController.dispose();
    _kapasitasController.dispose();
    _alamatController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();

    // Tampilkan pilihan Camera atau Gallery
    final ImageSource? source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(
                Icons.camera_alt_rounded,
                color: AppColors.primaryGreen,
              ),
              title: const Text('Ambil dari Kamera'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library_rounded,
                color: AppColors.primaryGreen,
              ),
              title: const Text('Pilih dari Galeri'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final file = await picker.pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1080,
      maxHeight: 1080,
    );
    if (file != null) setState(() => _photoPath = file.path);
  }

  Future<void> _getLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw Exception('Layanan lokasi tidak aktif.');

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
      final newLoc = LatLng(position.latitude, position.longitude);
      setState(() {
        _selectedLocation = newLoc;
      });
      _mapController.move(newLoc, 17.0);
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
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap lengkapi semua field yang wajib diisi.'),
          backgroundColor: AppColors.warningYellow,
        ),
      );
      return;
    }
    if (_selectedJenis == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap pilih jenis fasilitas.'),
          backgroundColor: AppColors.warningYellow,
        ),
      );
      return;
    }
    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap tentukan titik koordinat GPS lokasi fasilitas.'),
          backgroundColor: AppColors.warningYellow,
        ),
      );
      return;
    }
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap lampirkan foto fasilitas.'),
          backgroundColor: AppColors.warningYellow,
        ),
      );
      return;
    }

    final user = ref.read(authProvider).user;
    final targetRwId = int.tryParse(user?.rw ?? '') ?? 0;
    final safeKapasitas = int.tryParse(_kapasitasController.text.trim()) ?? 0;

    final success = await ref
        .read(fasilitasKknProvider.notifier)
        .registerFasilitas(
          nama: _namaController.text.trim(),
          pic: _picController.text.trim(),
          kontak: _kontakController.text.trim(),
          kapasitas: safeKapasitas,
          alamat: _alamatController.text.trim(),
          rwId: targetRwId,
          jenis: _selectedJenis!,
          latitude: _selectedLocation!.latitude,
          longitude: _selectedLocation!.longitude,
          imagePath: _photoPath!,
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Berhasil mendaftarkan fasilitas warga!'),
          backgroundColor: AppColors.primaryGreen,
        ),
      );
      Navigator.pop(context, true);
    }
  }

  // ── Bottom Sheet: Pilih Jenis ─────────────────────────────────────────────
  void _showJenisBottomSheet(List<JenisFasilitas> jenisList) {
    // Filter: jangan tampilkan posko_kkn di pilihan jenis fasilitas
    final filteredList = jenisList.where((j) => j.key != 'posko_kkn').toList();

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
                  // Handle + header (tidak ikut scroll)
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
                          'Pilih Jenis Fasilitas',
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
                  // Scrollable list (dari API)
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.only(bottom: 32),
                      children: filteredList.map((jenis) {
                        final isSelected = _selectedJenis == jenis.key;
                        return InkWell(
                          onTap: () {
                            setState(() => _selectedJenis = jenis.key);
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
                                  child:
                                      jenis.iconUrl != null &&
                                          jenis.iconUrl!.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          child: Image.network(
                                            jenis.iconUrl!,
                                            width: 36,
                                            height: 36,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => Icon(
                                              Icons.eco_rounded,
                                              size: 20,
                                              color: isSelected
                                                  ? AppColors.primaryGreen
                                                  : AppColors.textHint,
                                            ),
                                          ),
                                        )
                                      : Icon(
                                          Icons.eco_rounded,
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
                                        jenis.nama,
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
                                      if (jenis.deskripsi != null &&
                                          jenis.deskripsi!.isNotEmpty)
                                        Text(
                                          jenis.deskripsi!,
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

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fasilitasKknProvider);

    ref.listen<FasilitasKknState>(fasilitasKknProvider, (previous, next) {
      if (next.error != null && (previous?.error != next.error)) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    });

    bool hasUnsavedChanges() {
      return _namaController.text.isNotEmpty ||
             _picController.text.isNotEmpty ||
             _kontakController.text.isNotEmpty ||
             _kapasitasController.text.isNotEmpty ||
             _alamatController.text.isNotEmpty ||
             _selectedJenis != null ||
             _photoPath != null ||
             _selectedLocation != null;
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
              title: const Text('Batalkan Pendaftaran?', style: TextStyle(fontWeight: FontWeight.bold)),
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
      body: CustomScrollView(
        slivers: [
          // ─── Header ──────────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              width: double.infinity,
              color: Colors.white,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                left: 20,
                right: 20,
                bottom: 20,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Back button + Title
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Icon(
                            Icons.arrow_back,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Daftar Fasilitas Warga',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Lengkapi informasi fasilitas untuk\nmemudahkan pemantauan',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ─── Form ─────────────────────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(AppDimensions.lg),
            sliver: SliverToBoxAdapter(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Jenis Fasilitas ─────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.local_offer_rounded,
                      label: 'Jenis Fasilitas',
                    ),
                    const SizedBox(height: 8),
                    Builder(
                      builder: (_) {
                        final jenisList = state.jenisFasilitasList;
                        final selectedJenisObj = _selectedJenis != null
                            ? jenisList
                                  .where((j) => j.key == _selectedJenis)
                                  .firstOrNull
                            : null;
                        return _JenisPickerField(
                          selectedKey: _selectedJenis,
                          label:
                              selectedJenisObj?.nama ?? 'Pilih jenis fasilitas',
                          isLoading: state.isLoadingJenis,
                          onTap: () => _showJenisBottomSheet(jenisList),
                        );
                      },
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Nama Fasilitas ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.business_rounded,
                      label: 'Nama Fasilitas',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _namaController,
                      hintText: 'Masukkan Nama Fasilitas',
                      validator: (val) => (val == null || val.isEmpty)
                          ? 'Nama fasilitas wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── PIC Fasilitas (Warga) ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.person_rounded,
                      label: 'PIC (Penanggung Jawab Warga)',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _picController,
                      hintText:
                          'Nama Warga / Pengelola Fasilitas (cth: Ibu Siti)',
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Nama PIC / Pengelola Warga wajib diisi';
                        }
                        if (val.trim().length < 3) {
                          return 'Nama PIC minimal 3 karakter';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Kontak PIC ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.phone_rounded,
                      label: 'Kontak PIC',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _kontakController,
                      hintText: 'Masukkan Nomor Telepon PIC',
                      keyboardType: TextInputType.phone,
                      validator: (val) => (val == null || val.isEmpty)
                          ? 'Kontak wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Kapasitas Fasilitas ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.people_rounded,
                      label: 'Kapasitas',
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 2,
                          child: _StyledTextField(
                            controller: _kapasitasController,
                            hintText: 'Masukkan Kapasitas',
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(7),
                            ],
                            validator: (val) => (val == null || val.isEmpty)
                                ? 'Wajib diisi'
                                : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 1,
                          child: Container(
                            height: 54,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _kapasitasUnit,
                                isExpanded: true,
                                icon: const Icon(Icons.arrow_drop_down, color: AppColors.primaryGreen),
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                                items: ['Kg', 'Liter', 'Orang', 'Unit']
                                    .map((e) => DropdownMenuItem(
                                          value: e,
                                          child: Text(e),
                                        ))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _kapasitasUnit = val);
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Alamat Lengkap ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.map_rounded,
                      label: 'Alamat Lengkap',
                    ),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _alamatController,
                      hintText: 'Masukkan Alamat Lengkap',
                      maxLines: 3,
                      validator: (val) => (val == null || val.isEmpty)
                          ? 'Alamat wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Koordinat GPS ────────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.location_on_rounded,
                      label: 'Koordinat GPS Fasilitas',
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Tentukan lokasi fasilitas pada peta dengan menempatkan pin di posisi yang tepat.',
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
                                        Icons.location_on,
                                        size: 24,
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
                              top: 20,
                              left: 0,
                              right: 0,
                              child: Center(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(
                                          alpha: 0.1,
                                        ),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _namaController.text.isNotEmpty
                                            ? _namaController.text
                                            : 'Lokasi Terpilih',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${_selectedLocation!.latitude.toStringAsFixed(6)}, ${_selectedLocation!.longitude.toStringAsFixed(6)}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // ── Legenda Peta (Dinamis dari API) ─────────────────────
                    Builder(
                      builder: (_) {
                        final jenisList = state.jenisFasilitasList;
                        if (jenisList.isEmpty) {
                          return const SizedBox.shrink();
                        }
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(
                                    Icons.map_rounded,
                                    size: 18,
                                    color: AppColors.primaryGreen,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Legenda Peta',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 12,
                                runSpacing: 10,
                                children: jenisList.map((jenis) {
                                  return SizedBox(
                                    width:
                                        (MediaQuery.of(context).size.width -
                                            40 -
                                            32 -
                                            12) /
                                        2, // 2 kolom
                                    child: Row(
                                      children: [
                                        if (jenis.iconUrl != null &&
                                            jenis.iconUrl!.isNotEmpty)
                                          Image.network(
                                            jenis.iconUrl!,
                                            width: 22,
                                            height: 22,
                                            errorBuilder: (_, __, ___) =>
                                                const Icon(
                                                  Icons.location_on,
                                                  size: 22,
                                                  color: AppColors.primaryGreen,
                                                ),
                                          )
                                        else
                                          Icon(
                                            jenis.key == 'posko_kkn'
                                                ? Icons.home_work_rounded
                                                : Icons.location_on,
                                            size: 22,
                                            color: jenis.key == 'posko_kkn'
                                                ? Colors.deepPurple
                                                : AppColors.primaryGreen,
                                          ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            jenis.nama,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w500,
                                              fontSize: 11,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Foto Fasilitas ───────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.camera_alt_rounded,
                      label: 'Foto Fasilitas',
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 160,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.primaryGreen.withValues(
                              alpha: 0.5,
                            ),
                            width: 1,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: _photoPath != null
                            ? Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.file(
                                      File(_photoPath!),
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                      height: double.infinity,
                                    ),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: GestureDetector(
                                      onTap: () =>
                                          setState(() => _photoPath = null),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: AppColors.dangerRed,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.close,
                                          color: Colors.white,
                                          size: 16,
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
                                    width: 52,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8F5E9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.cloud_upload_rounded,
                                      color: AppColors.primaryGreen,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  const Text(
                                    'Unggah foto fasilitas',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: AppColors.primaryGreen,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Ketuk untuk mengambil/memilih foto',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const Text(
                                    'Format JPG, PNG (Maks. 5MB)',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textHint,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // ── Tombol Submit ────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: state.isLoading ? null : _submit,
                        icon: state.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.save_alt_rounded, size: 20),
                        label: Text(
                          state.isLoading
                              ? 'Memproses...'
                              : 'Daftarkan Fasilitas',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Footer info ──────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.verified_rounded,
                            color: AppColors.primaryGreen,
                            size: 18,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Data fasilitas yang Anda daftarkan akan digunakan untuk pemantauan dan pengelolaan sampah yang lebih baik.',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: MediaQuery.of(context).padding.bottom + 40,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    ),
    );
  }
}

// ─── Reusable Widgets ──────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 16, color: AppColors.primaryGreen),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _StyledTextField extends StatelessWidget {
  const _StyledTextField({
    required this.controller,
    required this.hintText,
    this.validator,
    this.keyboardType,
    this.inputFormatters,
    this.maxLines = 1,
  });
  final TextEditingController controller;
  final String hintText;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
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
          borderSide: const BorderSide(
            color: AppColors.primaryGreen,
            width: 1.5,
          ),
        ),
      ),
    );
  }
}

// ─── Custom Picker Field: Jenis ────────────────────────────────────────────────
class _JenisPickerField extends StatelessWidget {
  const _JenisPickerField({
    required this.selectedKey,
    required this.label,
    required this.onTap,
    this.isLoading = false,
  });
  final String? selectedKey;
  final String label;
  final VoidCallback onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
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
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.eco_rounded,
                color: AppColors.primaryGreen,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: selectedKey == null
                      ? AppColors.textHint
                      : AppColors.textPrimary,
                ),
              ),
            ),
            if (isLoading)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primaryGreen,
                ),
              )
            else
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: AppColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }
}
