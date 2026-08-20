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
import '../controllers/mahasiswa_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import 'package:permission_handler/permission_handler.dart';

class RegisterFasilitasView extends ConsumerStatefulWidget {
  const RegisterFasilitasView({super.key});

  @override
  ConsumerState<RegisterFasilitasView> createState() => _RegisterFasilitasViewState();
}

class _RegisterFasilitasViewState extends ConsumerState<RegisterFasilitasView> {
  final _formKey = GlobalKey<FormState>();
  final _namaController = TextEditingController();
  final MapController _mapController = MapController();

  String? _selectedUserId;
  WargaDampingan? _selectedWarga;
  String _selectedJenis = 'rumah_maggot';
  String? _photoPath;
  LatLng? _selectedLocation;
  bool _isGettingLocation = false;

  @override
  void dispose() {
    _namaController.dispose();
    _mapController.dispose();
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
        if (permission == LocationPermission.denied) throw Exception('Izin lokasi ditolak.');
      }
      if (permission == LocationPermission.deniedForever) throw Exception('Izin lokasi ditolak permanen.');

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
    if (_selectedUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harap pilih warga penanggung jawab.'), backgroundColor: AppColors.warningYellow),
      );
      return;
    }
    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harap ambil koordinat lokasi fasilitas.'), backgroundColor: AppColors.warningYellow),
      );
      return;
    }
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto fasilitas wajib diunggah.'), backgroundColor: AppColors.warningYellow),
      );
      return;
    }

    final success = await ref.read(fasilitasKknProvider.notifier).registerFasilitas(
      userId: _selectedUserId!,
      nama: _namaController.text,
      jenis: _selectedJenis,
      latitude: _selectedLocation!.latitude,
      longitude: _selectedLocation!.longitude,
      imagePath: _photoPath!,
      alamat: _selectedWarga?.address,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Berhasil mendaftarkan fasilitas warga! (+5 Poin)'), backgroundColor: AppColors.primaryGreen),
      );
      Navigator.pop(context);
    } else if (mounted) {
      final errorMsg = ref.read(fasilitasKknProvider).error ?? 'Gagal mendaftarkan fasilitas warga';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg), backgroundColor: AppColors.dangerRed),
      );
    }
  }

  // ── Bottom Sheet: Pilih Warga ─────────────────────────────────────────────
  void _showWargaBottomSheet(List<WargaDampingan> wargaList) {
    String searchQuery = '';
    final searchController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheetState) {
          // Group by RW
          final filtered = wargaList.where((w) {
            final q = searchQuery.toLowerCase();
            return w.wargaName.toLowerCase().contains(q) || w.rw.toLowerCase().contains(q);
          }).toList();

          final Map<String, List<WargaDampingan>> grouped = {};
          for (final w in filtered) {
            final key = w.rw.isNotEmpty ? w.rw : 'Lainnya';
            grouped.putIfAbsent(key, () => []).add(w);
          }

          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle
                const SizedBox(height: 12),
                Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(height: 16),
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      const Text(
                        'Pilih Penanggung Jawab (Warga)',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Search
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: TextField(
                    controller: searchController,
                    onChanged: (v) => setSheetState(() => searchQuery = v),
                    decoration: InputDecoration(
                      hintText: 'Cari nama warga atau RW...',
                      hintStyle: const TextStyle(fontSize: 14, color: AppColors.textHint),
                      prefixIcon: const Icon(Icons.search, color: AppColors.textHint, size: 20),
                      suffixIcon: searchQuery.isNotEmpty
                          ? GestureDetector(
                              onTap: () {
                                searchController.clear();
                                setSheetState(() => searchQuery = '');
                              },
                              child: const Icon(Icons.cancel_rounded, color: AppColors.textHint, size: 20),
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF5F7FA),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Count
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Text(
                        'Menampilkan ${filtered.length} warga',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Divider(height: 1),
                // List
                ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.5),
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.only(bottom: 24),
                    children: grouped.entries.map((entry) {
                      final rwLabel = entry.key;
                      final members = entry.value;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: double.infinity,
                            color: const Color(0xFFF5F7FA),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            child: Row(
                              children: [
                                Text(
                                  rwLabel,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryGreen,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${members.length}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ...members.map((w) {
                            final isSelected = _selectedUserId == w.wargaId;
                            return InkWell(
                              onTap: () {
                                setState(() {
                                  _selectedUserId = w.wargaId;
                                  _selectedWarga = w;
                                });
                                Navigator.pop(ctx);
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 36, height: 36,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE8F5E9),
                                        borderRadius: BorderRadius.circular(18),
                                      ),
                                      child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            w.wargaName,
                                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                          ),
                                          const Text(
                                            'Warga',
                                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                    isSelected
                                        ? Container(
                                            width: 24, height: 24,
                                            decoration: const BoxDecoration(color: AppColors.primaryGreen, shape: BoxShape.circle),
                                            child: const Icon(Icons.check, color: Colors.white, size: 16),
                                          )
                                        : Container(
                                            width: 24, height: 24,
                                            decoration: BoxDecoration(
                                              border: Border.all(color: Colors.grey.shade400),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  // ── Bottom Sheet: Pilih Jenis ─────────────────────────────────────────────
  void _showJenisBottomSheet(List<JenisFasilitasModel> jenisList) {
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
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        const Text('Pilih Jenis Fasilitas', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  // Scrollable list
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.only(bottom: 32),
                      children: jenisList.map((item) {
                        final isSelected = _selectedJenis == item.key;
                        return InkWell(
                          onTap: () {
                            setState(() => _selectedJenis = item.key);
                            Navigator.pop(ctx);
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            child: Row(
                              children: [
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFFE8F5E9) : const Color(0xFFF5F7FA),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(Icons.eco_rounded, size: 22, color: isSelected ? AppColors.primaryGreen : AppColors.textHint),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.nama,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                          color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                                        ),
                                      ),
                                      if (item.deskripsi != null && item.deskripsi!.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          item.deskripsi!,
                                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  Container(
                                    width: 24, height: 24,
                                    decoration: const BoxDecoration(color: AppColors.primaryGreen, shape: BoxShape.circle),
                                    child: const Icon(Icons.check, color: Colors.white, size: 16),
                                  )
                                else
                                  Container(
                                    width: 24, height: 24,
                                    decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade400), shape: BoxShape.circle),
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
    final mahasiswaState = ref.watch(mahasiswaControllerProvider);
    final currentUser = ref.watch(authProvider).user;

    // Filter warga sesuai wilayah mahasiswa yang sedang login:
    // Prioritas 1: cocokkan mahasiswaId (warga yang langsung didampingi mahasiswa ini)
    // Prioritas 2 (fallback): cocokkan kelurahan yang sama
    final myId = currentUser?.id ?? '';
    final myKelurahan = (currentUser?.kelurahan ?? '').toLowerCase().trim();

    List<WargaDampingan> wargaList;
    if (myId.isNotEmpty) {
      // Prioritas 1: warga yang didampingi langsung
      final byMahasiswa = mahasiswaState.wargaList
          .where((w) => w.role == 'WARGA' && w.mahasiswaId == myId)
          .toList();
      if (byMahasiswa.isNotEmpty) {
        wargaList = byMahasiswa;
      } else if (myKelurahan.isNotEmpty) {
        // Fallback: semua warga di kelurahan yang sama
        wargaList = mahasiswaState.wargaList
            .where((w) =>
                w.role == 'WARGA' &&
                w.kelurahan.toLowerCase().trim() == myKelurahan)
            .toList();
      } else {
        wargaList = mahasiswaState.wargaList.where((w) => w.role == 'WARGA').toList();
      }
    } else {
      wargaList = mahasiswaState.wargaList.where((w) => w.role == 'WARGA').toList();
    }

    final jenisList = state.jenisList.isNotEmpty
        ? state.jenisList
        : const [
            JenisFasilitasModel(id: 1, key: 'rumah_maggot', nama: 'Rumah Maggot', deskripsi: 'Fasilitas pengolahan sampah organik menggunakan larva BSF'),
            JenisFasilitasModel(id: 2, key: 'loseda', nama: 'Loseda', deskripsi: 'Lubang sedalam 1 meter untuk pengomposan langsung'),
            JenisFasilitasModel(id: 3, key: 'bata_terawang', nama: 'Bata Terawang', deskripsi: 'Komposter aerobik menggunakan susunan bata berongga'),
            JenisFasilitasModel(id: 4, key: 'bank_sampah', nama: 'Bank Sampah', deskripsi: 'Tempat pengumpulan sampah anorganik bernilai ekonomi'),
            JenisFasilitasModel(id: 5, key: 'buruan_sae', nama: 'Buruan Sae', deskripsi: 'Program pengelolaan pekarangan untuk ketahanan pangan'),
            JenisFasilitasModel(id: 6, key: 'poc', nama: 'Pupuk Organik Cair (POC)', deskripsi: 'Fasilitas pembuatan pupuk cair dari sampah organik'),
            JenisFasilitasModel(id: 7, key: 'tps', nama: 'TPS', deskripsi: 'Tempat Pembuangan Sampah sementara'),
            JenisFasilitasModel(id: 8, key: 'posko_kkn', nama: 'Posko KKN', deskripsi: 'Posko / kantor kelurahan'),
          ];

    final currentSelectedJenis = jenisList.firstWhere(
      (j) => j.key == _selectedJenis,
      orElse: () => jenisList.first,
    );

    return Scaffold(
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
                          child: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
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
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  // Decorative illustration
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Icon(Icons.house_rounded, size: 52, color: AppColors.primaryGreen),
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
                    // ── Penanggung Jawab ─────────────────────────────────────
                    const _SectionLabel(
                      icon: Icons.person_rounded,
                      label: 'Penanggung Jawab (Warga)',
                    ),
                    const SizedBox(height: 8),
                    _WargaPickerField(
                      selected: _selectedWarga,
                      onTap: () => _showWargaBottomSheet(wargaList),
                      hasError: _selectedUserId == null && _formKey.currentState != null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Jenis Fasilitas ─────────────────────────────────────
                    const _SectionLabel(icon: Icons.local_offer_rounded, label: 'Jenis Fasilitas'),
                    const SizedBox(height: 8),
                    _JenisPickerField(
                      selectedKey: _selectedJenis,
                      label: currentSelectedJenis.nama,
                      onTap: () => _showJenisBottomSheet(jenisList),
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Nama Fasilitas ───────────────────────────────────────
                    const _SectionLabel(icon: Icons.business_rounded, label: 'Nama Fasilitas'),
                    const SizedBox(height: 8),
                    _StyledTextField(
                      controller: _namaController,
                      hintText: 'Contoh: Rumah Maggot Berkah RT 03',
                      validator: (val) => (val == null || val.isEmpty) ? 'Nama fasilitas wajib diisi' : null,
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Koordinat GPS ────────────────────────────────────────
                    const _SectionLabel(icon: Icons.location_on_rounded, label: 'Koordinat GPS Fasilitas'),
                    const SizedBox(height: 4),
                    const Text(
                      'Tentukan lokasi fasilitas pada peta dengan menempatkan pin di posisi yang tepat.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
                              initialCenter: _selectedLocation ?? const LatLng(-6.914744, 107.609810),
                              initialZoom: 15.0,
                              onTap: (tapPosition, point) {
                                setState(() {
                                  _selectedLocation = point;
                                });
                              },
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.makerindo.pilahsampah',
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
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _isGettingLocation
                                          ? const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                                            )
                                          : const Icon(Icons.my_location_rounded, size: 18, color: AppColors.primaryGreen),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'Lokasi Saya',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
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
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: [
                                      BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2)),
                                    ],
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _namaController.text.isNotEmpty ? _namaController.text : 'Lokasi Terpilih',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.textPrimary),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${_selectedLocation!.latitude.toStringAsFixed(6)}, ${_selectedLocation!.longitude.toStringAsFixed(6)}',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
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
                    // ── Legenda Peta ─────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.map_rounded, size: 18, color: AppColors.primaryGreen),
                              SizedBox(width: 8),
                              Text('Legenda Peta', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                            ],
                          ),
                          SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    Icon(Icons.location_on, size: 24, color: AppColors.primaryGreen),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('Lokasi Fasilitas', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                          Text('Posisi fasilitas yang Anda tandai', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Row(
                                  children: [
                                    Icon(Icons.home_work_rounded, size: 24, color: Colors.deepPurple),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('Lokasi Posko', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                          Text('Posko/Kantor Kelurahan', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ── Foto Fasilitas ───────────────────────────────────────
                    const _SectionLabel(icon: Icons.camera_alt_rounded, label: 'Foto Fasilitas (Wajib) *'),
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
                            color: AppColors.primaryGreen.withValues(alpha: 0.5),
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
                                      onTap: () => setState(() => _photoPath = null),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                                        child: const Icon(Icons.close, color: Colors.white, size: 16),
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
                                    child: const Icon(Icons.cloud_upload_rounded, color: AppColors.primaryGreen, size: 28),
                                  ),
                                  const SizedBox(height: 10),
                                  const Text(
                                    'Unggah foto fasilitas',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryGreen),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Ketuk untuk memilih foto dari galeri',
                                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                  const Text(
                                    'Format JPG, PNG (Maks. 5MB)',
                                    style: TextStyle(fontSize: 11, color: AppColors.textHint),
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
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.save_alt_rounded, size: 20),
                        label: Text(
                          state.isLoading ? 'Memproses...' : 'Daftarkan Fasilitas',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Footer info ──────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified_rounded, color: AppColors.primaryGreen, size: 18),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Data fasilitas yang Anda daftarkan akan digunakan untuk pemantauan dan pengelolaan sampah yang lebih baik.',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: MediaQuery.of(context).padding.bottom + 40),
                  ],
                ),
              ),
            ),
          ),
        ],
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
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }
}

class _StyledTextField extends StatelessWidget {
  const _StyledTextField({
    required this.controller,
    required this.hintText,
    this.validator,
  });
  final TextEditingController controller;
  final String hintText;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      decoration: InputDecoration(
        hintText: hintText,
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
      ),
    );
  }
}

// ─── Custom Picker Field: Warga ────────────────────────────────────────────────
class _WargaPickerField extends StatelessWidget {
  const _WargaPickerField({
    required this.selected,
    required this.onTap,
    this.hasError = false,
  });
  final WargaDampingan? selected;
  final VoidCallback onTap;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected != null ? AppColors.primaryGreen : Colors.grey.shade300,
            width: selected != null ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: selected == null
                  ? const Text(
                      'Pilih warga',
                      style: TextStyle(fontSize: 14, color: AppColors.textHint),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          selected!.wargaName,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                        Text(
                          '${selected!.rw}${selected!.kelurahan.isNotEmpty ? ' • ${selected!.kelurahan}' : ''}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
          ],
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
  });
  final String selectedKey;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
