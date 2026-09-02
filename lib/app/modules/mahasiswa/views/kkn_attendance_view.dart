import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

import '../controllers/kkn_location_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../controllers/kkn_map_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../data/models/group_zone_models.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/models/user_entity.dart';

class KknAttendanceView extends ConsumerStatefulWidget {
  const KknAttendanceView({super.key});

  @override
  ConsumerState<KknAttendanceView> createState() => _KknAttendanceViewState();
}

class _KknAttendanceViewState extends ConsumerState<KknAttendanceView>
    with WidgetsBindingObserver {
  final TextEditingController _rtRwCtrl = TextEditingController();
  final TextEditingController _kodeZonaCtrl = TextEditingController(text: '');
  String _selectedKelurahan = '';
  bool _showDetail = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Load durasi persisten dulu sebelum fetch agar tidak ke-reset ke 0
      await ref.read(kknLocationProvider.notifier).checkActiveSchedule();
      await ref.read(kknLocationProvider.notifier).fetchKegiatanAktif();

      final user = ref.read(authProvider).user;
      if (user != null) {
        _rtRwCtrl.text = user.rw.isNotEmpty ? user.rw : '';
        if (user.kelurahan.isNotEmpty) {
          _selectedKelurahan = user.kelurahan;
        }
      }
      ref.read(kelompokKknProvider.notifier).fetchKelompok();

      // Jika tracking masih aktif saat halaman dibuka, langsung tampilkan detail
      final kknState = ref.read(kknLocationProvider);
      if (kknState.isTracking &&
          kknState.activeActivity != null &&
          !kknState.isSuccessAttendance) {
        if (mounted) setState(() => _showDetail = true);
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (!mounted) return;
      ref.read(kknLocationProvider.notifier).forceLocationUpdate(context);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _rtRwCtrl.dispose();
    _kodeZonaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(kknLocationProvider);
    final locationNotifier = ref.read(kknLocationProvider.notifier);

    return PopScope(
      canPop: !_showDetail,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_showDetail) {
          setState(() => _showDetail = false);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          title: const Text(
            'Presensi KKN',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 18,
              color: AppColors.textPrimary,
            ),
          ),
          backgroundColor: Colors.white,
          shadowColor: Colors.black12,
          surfaceTintColor: Colors.transparent,
          iconTheme: const IconThemeData(color: AppColors.textPrimary),
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_rounded,
              color: AppColors.textPrimary,
            ),
            onPressed: () {
              if (_showDetail) {
                setState(() => _showDetail = false);
              } else {
                Navigator.pop(context);
              }
            },
          ),
          actions: [
            IconButton(
              icon: const Icon(
                Icons.refresh_rounded,
                color: AppColors.textPrimary,
              ),
              tooltip: 'Perbarui Lokasi GPS',
              onPressed: () async {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Memperbarui koordinat GPS & wilayah...'),
                    duration: Duration(seconds: 1),
                  ),
                );
                await locationNotifier.forceLocationUpdate(context);
              },
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            await locationNotifier.forceLocationUpdate(context);
            ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
          },
          color: AppColors.primaryGreen,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(AppDimensions.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (!_showDetail) _buildMapSection(),
                  if (!_showDetail) const SizedBox(height: 16),
                  _buildAttendanceDetail(locationState, locationNotifier),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Tampilkan Bottom Sheet untuk memilih Posko sebelum memulai kegiatan.
  /// Mengembalikan [PoskoItem] yang dipilih, atau [null] jika dibatalkan.
  Future<PoskoItem?> _showPilihPoskoSheet(List<PoskoItem> poskoList) async {
    // Jika hanya ada 1 posko, langsung kembalikan tanpa perlu memilih
    if (poskoList.length == 1) return poskoList.first;

    PoskoItem? selected = poskoList.firstWhere(
      (p) => p.isUtama,
      orElse: () => poskoList.first,
    );

    return await showModalBottomSheet<PoskoItem>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.home_work_rounded,
                        color: AppColors.primaryGreen,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pilih Lokasi Tugas',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Sesuaikan dengan posko penugasan Anda',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                // Daftar posko
                ...poskoList.map((posko) {
                  final isSelected = selected?.id == posko.id;
                  final isUtama = posko.isUtama || posko.type == 'POSKO_UTAMA';
                  return GestureDetector(
                    onTap: () => setSheetState(() => selected = posko),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primaryGreen.withValues(alpha: 0.08)
                            : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primaryGreen
                              : Colors.grey.shade200,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          // Radio indicator
                          Container(
                            width: 22, height: 22,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primaryGreen
                                    : Colors.grey.shade400,
                                width: 2,
                              ),
                            ),
                            child: isSelected
                                ? Center(
                                    child: Container(
                                      width: 12, height: 12,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: AppColors.primaryGreen,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 14),
                          // Icon posko
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (isUtama
                                  ? AppColors.primaryGreen
                                  : Colors.blue)
                                  .withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isUtama ? Icons.home_work_rounded : Icons.home_rounded,
                              color: isUtama ? AppColors.primaryGreen : Colors.blue,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Detail
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        posko.nama,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected
                                              ? AppColors.primaryGreen
                                              : AppColors.textPrimary,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isUtama) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryGreen.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Text(
                                          'Utama',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: AppColors.primaryGreen,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.location_on_outlined,
                                      size: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                    const SizedBox(width: 3),
                                    Flexible(
                                      child: Text(
                                        posko.alamat.isNotEmpty ? posko.alamat : 'Lokasi posko',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textSecondary,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'R: ${posko.radius}m',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isSelected
                                            ? AppColors.primaryGreen
                                            : Colors.grey,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                // Tombol Mulai
                ElevatedButton.icon(
                  onPressed: selected != null
                      ? () => Navigator.of(ctx).pop(selected)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.play_circle_rounded, size: 20),
                  label: Text(
                    selected != null
                        ? 'Mulai di ${selected!.nama}'
                        : 'Pilih Posko Terlebih Dahulu',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _showAbsenDialog(
    KknLocationState state,
    KknLocationNotifier notifier,
  ) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    final kelompokState = ref.read(kelompokKknProvider);
    final kelompokName = kelompokState.kelompok?.groupName.isNotEmpty == true
        ? kelompokState.kelompok!.groupName
        : (user.kelompokName.isNotEmpty ? user.kelompokName : '-');
    final dplName = kelompokState.kelompok?.dosenPembimbing.isNotEmpty == true
        ? kelompokState.kelompok!.dosenPembimbing
        : (user.dplName.isNotEmpty ? user.dplName : '-');
    final namaKegiatan =
        state.activeActivity?['namaKegiatan'] ??
        state.activeActivity?['nama'] ??
        '-';

    File? fotoFile;
    final picker = ImagePicker();
    bool isLoading = false;
    final deskripsiCtrl = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {

          Future<void> pickImage(ImageSource source) async {
            final picked = await picker.pickImage(
              source: source,
              imageQuality: 70,
              maxWidth: 1280,
            );
            if (picked != null) {
              setModalState(() => fotoFile = File(picked.path));
            }
          }

          void showPhotoPicker() {
            showModalBottomSheet(
              context: context,
              backgroundColor: Colors.white,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              builder: (pickerCtx) {
                return SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          leading: const Icon(Icons.camera_alt, color: AppColors.primaryGreen),
                          title: const Text('Ambil dari Kamera', style: TextStyle(fontWeight: FontWeight.w500)),
                          onTap: () {
                            Navigator.pop(pickerCtx);
                            pickImage(ImageSource.camera);
                          },
                        ),
                        ListTile(
                          leading: const Icon(Icons.photo_library, color: AppColors.primaryGreen),
                          title: const Text('Pilih dari Galeri', style: TextStyle(fontWeight: FontWeight.w500)),
                          onTap: () {
                            Navigator.pop(pickerCtx);
                            pickImage(ImageSource.gallery);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          }

          Future<void> submit() async {
            if (fotoFile == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Foto dokumentasi wajib diisi.'),
                  backgroundColor: AppColors.dangerRed,
                ),
              );
              return;
            }
            final deskripsi = deskripsiCtrl.text.trim();
            if (deskripsi.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Deskripsi kegiatan wajib diisi.'),
                  backgroundColor: AppColors.dangerRed,
                ),
              );
              return;
            }
            setModalState(() => isLoading = true);
            Navigator.pop(ctx);
            final success = await notifier.recordAttendance(
              method: 'GPS_VALIDATED',
              kodeZona: _kodeZonaCtrl.text.trim(),
              rw: _rtRwCtrl.text.trim(),
              kelurahan: _selectedKelurahan,
              deskripsiKegiatan: deskripsi,
              fotoPath: fotoFile!.path,
            );
            if (mounted) {
              ScaffoldMessenger.of(context).clearSnackBars();
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Presensi Selesai Kegiatan berhasil!'),
                    backgroundColor: AppColors.primaryGreen,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              } else {
                final err = ref.read(kknLocationProvider).error ??
                    'Gagal melakukan presensi. Periksa GPS & koneksi internet.';
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(err),
                    backgroundColor: AppColors.dangerRed,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            }
          }

          final durasiMenit = state.inZoneDurationSeconds ~/ 60;
          final durasiDetik = state.inZoneDurationSeconds % 60;
          final waktu = DateTime.now().toLocal().toString().substring(0, 16);

          return SingleChildScrollView(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Selesai Kegiatan',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      _buildInfoRow('Kegiatan', namaKegiatan),
                      const SizedBox(height: 6),
                      _buildInfoRow('Waktu', waktu),
                      const SizedBox(height: 6),
                      _buildInfoRow('Nama', user.name),
                      const SizedBox(height: 6),
                      _buildInfoRow('NIM', user.nim.isNotEmpty ? user.nim : '-'),
                      const SizedBox(height: 6),
                      _buildInfoRow('Kelompok', kelompokName),
                      const SizedBox(height: 6),
                      _buildInfoRow('DPL', dplName),
                      const SizedBox(height: 6),
                      _buildInfoRow(
                        'Durasi di Zona',
                        '$durasiMenit mnt $durasiDetik dtk',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Foto Dokumentasi *',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (fotoFile != null) ...[
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          fotoFile!,
                          height: 160,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: () => setModalState(() => fotoFile = null),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
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
                  ),
                ] else
                  InkWell(
                    onTap: showPhotoPicker,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.05),
                        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.cloud_upload_rounded,
                              color: AppColors.primaryGreen,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Unggah foto kegiatan',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: AppColors.primaryGreen,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Ketuk untuk mengambil/memilih foto\nFormat JPG, PNG (Maks. 5MB)',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                const Text(
                  'Deskripsi Kegiatan *',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: deskripsiCtrl,
                  maxLength: 500,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Ceritakan kegiatan yang telah dilakukan...',
                    hintStyle: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textHint,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.primaryGreen),
                    ),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Selesaikan Kegiatan',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const Text(': ', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }



  Widget _buildDashedDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final boxWidth = constraints.constrainWidth();
          const dashWidth = 4.0;
          const dashHeight = 1.0;
          final dashCount = (boxWidth / (2 * dashWidth)).floor();
          return Flex(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            direction: Axis.horizontal,
            children: List.generate(dashCount, (_) {
              return SizedBox(
                width: dashWidth,
                height: dashHeight,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Colors.grey.shade300),
                ),
              );
            }),
          );
        },
      ),
    );
  }

  Widget _buildIconDetailRow({
    required IconData icon,
    required String title,
    required String value,
    Widget? trailing,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primaryGreen.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primaryGreen, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _buildBoxDetail(IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primaryGreen, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapSection() {
    final mapState = ref.watch(kknMapProvider);
    final locationState = ref.watch(kknLocationProvider);

    if (mapState.isLoading) {
      return const SizedBox(
        height: 250,
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      );
    }

    if (mapState.error != null) {
      return Container(
        height: 250,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'Gagal memuat peta: ${mapState.error}',
            style: const TextStyle(color: AppColors.dangerRed),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    final wilayah = mapState.wilayahKelompok;
    if (wilayah == null) {
      return Container(
        height: 250,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: Text(
            'Wilayah kelompok belum diatur',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    LatLng? poskoLatLng;
    if (wilayah.posko != null) {
      poskoLatLng = LatLng(
        wilayah.posko!['latitude']!,
        wilayah.posko!['longitude']!,
      );
    }

    // Kumpulkan Polygon Points
    List<LatLng> polygonPoints = [];
    if (mapState.groupZone?.autoZone.isActive == true && mapState.groupZone?.autoZone.polygon != null) {
      polygonPoints = mapState.groupZone!.autoZone.polygon!;
    } else if (wilayah.tipeArea == 'POLYGON' && wilayah.polygonKoordinat != null) {
      polygonPoints = wilayah.polygonKoordinat!
          .map((c) => LatLng(c['lat']!, c['lng']!))
          .toList();
    }

    // Kumpulkan Posko List
    List<CircleMarker> circleMarkers = [];
    List<Marker> poskoMarkers = [];
    
    if (mapState.groupZone != null && mapState.groupZone!.poskoList.isNotEmpty) {
      for (final posko in mapState.groupZone!.poskoList) {
        final point = LatLng(posko.latitude, posko.longitude);
        
        circleMarkers.add(CircleMarker(
          point: point,
          radius: posko.radius.toDouble(),
          useRadiusInMeter: true,
          color: posko.type == 'POSKO_UTAMA' 
              ? AppColors.primaryGreen.withValues(alpha: 0.2)
              : Colors.blue.withValues(alpha: 0.2),
          borderColor: posko.type == 'POSKO_UTAMA' ? AppColors.primaryGreen : Colors.blue,
          borderStrokeWidth: 2,
        ));
        
        poskoMarkers.add(Marker(
          point: point,
          width: 40,
          height: 40,
          child: Icon(
            posko.type == 'POSKO_UTAMA' ? Icons.home_work_rounded : Icons.home,
            color: posko.type == 'POSKO_UTAMA' ? AppColors.primaryGreen : Colors.blue,
            size: 32,
          ),
        ));
      }
    } else {
      // Fallback ke legacy posko jika data groupZone gagal di-load
      if (poskoLatLng != null) {
        if (wilayah.tipeArea == 'RADIUS' && wilayah.radiusMeters != null) {
          circleMarkers.add(CircleMarker(
            point: poskoLatLng,
            radius: wilayah.radiusMeters!,
            useRadiusInMeter: true,
            color: AppColors.primaryGreen.withValues(alpha: 0.2),
            borderColor: AppColors.primaryGreen,
            borderStrokeWidth: 2,
          ));
        }
        poskoMarkers.add(Marker(
          point: poskoLatLng,
          width: 40,
          height: 40,
          child: const Icon(
            Icons.home_work_rounded,
            color: AppColors.primaryGreen,
            size: 32,
          ),
        ));
      }
    }

    LatLng center = poskoLatLng ??
        (polygonPoints.isNotEmpty
            ? polygonPoints.first
            : const LatLng(-6.914744, 107.609810));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Wilayah Kegiatan KKN',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            if (wilayah.namaKelompok.isNotEmpty) ...[
              Builder(
                builder: (context) {
                  final kelompokState = ref.watch(kelompokKknProvider);
                  final user = ref.watch(authProvider).user;
                  final dplName = kelompokState.kelompok?.dosenPembimbing.isNotEmpty == true
                      ? kelompokState.kelompok!.dosenPembimbing
                      : (user?.dplName.isNotEmpty == true ? user!.dplName : '-');

                  return Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            wilayah.namaKelompok,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.right,
                          ),
                          if (dplName != '-') ...[
                            const SizedBox(height: 2),
                            Text(
                              'DPL: $dplName',
                              style: TextStyle(
                                fontSize: 9,
                                color: AppColors.primaryGreen.withValues(alpha: 0.8),
                                fontWeight: FontWeight.w600,
                              ),
                              textAlign: TextAlign.right,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 250,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: center,
                initialZoom: 15.0,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c'],
                  userAgentPackageName: 'com.makerindo.berseka',
                ),
                if (polygonPoints.isNotEmpty)
                  PolygonLayer(
                    polygons: [
                      Polygon(
                        points: polygonPoints,
                        color: AppColors.primaryGreen.withValues(alpha: 0.2),
                        borderStrokeWidth: 2,
                        borderColor: AppColors.primaryGreen,
                        isFilled: true,
                      ),
                    ],
                  ),
                if (circleMarkers.isNotEmpty)
                  CircleLayer(
                    circles: circleMarkers,
                  ),
                MarkerLayer(
                  markers: [
                    ...poskoMarkers,
                    if (locationState.currentPosition != null)
                      Marker(
                        point: LatLng(
                          locationState.currentPosition!.latitude,
                          locationState.currentPosition!.longitude,
                        ),
                        width: 30,
                        height: 30,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.blueAccent,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 4,
                              )
                            ],
                          ),
                          child: const Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceDetail(
    KknLocationState state,
    KknLocationNotifier notifier,
  ) {
    if (state.isLoadingKegiatan) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      );
    }

    if (state.kegiatanList.isEmpty && state.activeActivity == null) {
      return Card(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            children: [
              Icon(Icons.event_busy_rounded, color: Colors.grey, size: 56),
              SizedBox(height: 12),
              Text(
                'Tidak Ada Kegiatan KKN',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Hari ini tidak ada kegiatan KKN aktif atau kegiatan belum diaktifkan oleh Dosen Pembimbing Lapangan (DPL).',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    if (!_showDetail) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Kegiatan KKN Hari Ini',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          if (state.error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.dangerRed.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.dangerRed,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      state.error!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.dangerRed,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ...(() {
            final authUser = ref.watch(authProvider).user;
            final kelompokState = ref.watch(kelompokKknProvider);
            final isDpl = authUser?.role == UserRole.dpl;
            bool isKetua = false;
            if (authUser != null && kelompokState.kelompok != null) {
              final me = kelompokState.kelompok!.members.firstWhere(
                (m) => m.userId == authUser.id || m.nim == authUser.nim,
                orElse: () => const KelompokMemberData(
                  userId: '',
                  nim: '',
                  name: '',
                  jurusan: '',
                  fakultas: '',
                  individualPoints: 0,
                  isLeader: false,
                  statusPenugasanRw: '',
                ),
              );
              isKetua = me.isLeader;
            }
            final isLeaderOrDpl = isDpl || isKetua;

            return state.kegiatanList.map((kegiatan) {
              return KegiatanKknCard(
                kegiatan: kegiatan,
                isLeaderOrDpl: isLeaderOrDpl,
                onSkip: (id, alasan) async {
                  final error = await ref
                      .read(kknLocationProvider.notifier)
                      .skipKegiatan(id, alasan: alasan);
                  if (mounted) {
                    if (error != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(error),
                          backgroundColor: AppColors.dangerRed,
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Kegiatan berhasil ditandai sebagai Tidak Ada Kegiatan.',
                          ),
                          backgroundColor: AppColors.primaryGreen,
                        ),
                      );
                    }
                  }
                },
                onMulai: (id) async {
                final statusAktifSekarang =
                    (kegiatan['statusKehadiran'] ??
                            kegiatan['attendanceStatus'] ??
                            '')
                        .toString()
                        .toUpperCase();

                // Cek kegiatan LAIN yang sedang BERLANGSUNG
                final activeId =
                    state.activeActivity?['id']?.toString() ??
                    state.activeActivity?['scheduleId']?.toString();
                final statusAktifLain =
                    (state.activeActivity?['statusKehadiran'] ??
                            state.activeActivity?['attendanceStatus'] ??
                            '')
                        .toString()
                        .toUpperCase();
                final isDifferentActive =
                    state.activeActivity != null &&
                    activeId != null &&
                    activeId != id &&
                    (statusAktifLain == 'BERLANGSUNG' || statusAktifLain == 'TERJEDA') &&
                    !state.isSuccessAttendance;

                if (isDifferentActive) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Anda masih memiliki kegiatan KKN lain yang aktif. Silakan keluar dari kegiatan sebelumnya terlebih dahulu!',
                        ),
                        backgroundColor: AppColors.dangerRed,
                      ),
                    );
                  }
                  return;
                }

                // ── PILIH POSKO ──────────────────────────────────────────────
                // Tampilkan bottom sheet pilih posko HANYA saat sesi baru (bukan resume).
                // Saat BERLANGSUNG/TERJEDA, langsung resume tanpa pilih posko ulang.
                Map<String, dynamic>? selectedPoskoMap;
                final isResuming = statusAktifSekarang == 'BERLANGSUNG' ||
                    statusAktifSekarang == 'TERJEDA';

                if (!isResuming) {
                  final mapState = ref.read(kknMapProvider);
                  List<PoskoItem> poskoList = List.from(mapState.groupZone?.poskoList ?? []);
                  if (poskoList.isEmpty) {
                    final currentKegiatan = state.kegiatanList.firstWhere(
                      (k) => k['id']?.toString() == id || k['scheduleId']?.toString() == id,
                      orElse: () => <String, dynamic>{},
                    );
                    final rawPoskoList = currentKegiatan['poskoList'] as List<dynamic>?;
                    if (rawPoskoList != null && rawPoskoList.isNotEmpty) {
                      poskoList = rawPoskoList
                          .map((e) => PoskoItem.fromJson(Map<String, dynamic>.from(e as Map)))
                          .toList();
                    }
                  }

                  if (poskoList.isNotEmpty) {
                    if (!mounted) return;
                    final chosen = await _showPilihPoskoSheet(poskoList);
                    // Jika user menutup sheet tanpa memilih, batalkan
                    if (chosen == null) return;
                    selectedPoskoMap = {
                      'id': chosen.id,
                      'nama': chosen.nama,
                      'alamat': chosen.alamat,
                      'latitude': chosen.latitude,
                      'longitude': chosen.longitude,
                      'radius': chosen.radius,
                      'type': chosen.type,
                    };
                  }
                }
                // ─────────────────────────────────────────────────────────────

                final result = await notifier.mulaiKegiatan(
                  id,
                  selectedPosko: selectedPoskoMap,
                );
                if (result == null) {
                  if (mounted) {
                    ref.read(authProvider.notifier).fetchProfile();
                    final poskoName = selectedPoskoMap?['nama']?.toString();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          statusAktifSekarang == 'TERJEDA'
                            ? 'Sesi berhasil dilanjutkan.'
                            : statusAktifSekarang == 'BERLANGSUNG'
                                ? 'Sinkronisasi sesi aktif berhasil.'
                                : poskoName != null
                                    ? '+10 Poin! Kegiatan dimulai di $poskoName.'
                                    : '+10 Poin berhasil didapatkan dari Presensi Masuk!',
                        ),
                        backgroundColor: AppColors.primaryGreen,
                      ),
                    );
                    setState(() => _showDetail = true);
                  }
                } else if (mounted && result != 'CONFLICT') {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result),
                      backgroundColor: AppColors.dangerRed,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
            );
          }).toList();
        })(),
        ],
      );
    }

    final pos = state.currentPosition;
    final lat = pos?.latitude.toStringAsFixed(5) ?? '-';
    final lng = pos?.longitude.toStringAsFixed(5) ?? '-';
    final isGpsActive = state.isTracking;

    final durasiMenit = state.inZoneDurationSeconds ~/ 60;
    final durasiDetik = state.inZoneDurationSeconds % 60;
    final targetMenit = state.targetDurationMinutes;
    final remainingMenit = targetMenit - durasiMenit;

    final bool isDisabled =
        state.zoneResetWarning != null &&
        (state.zoneResetWarning!.toLowerCase().contains('izin') ||
            state.zoneResetWarning!.toLowerCase().contains('sakit'));

    final bool isAlpa =
        state.zoneResetWarning != null &&
        state.zoneResetWarning!.toLowerCase().contains('tanpa keterangan') &&
        !state.isSuccessAttendance;
    final bool isSuccess = state.isSuccessAttendance;

    final act = state.selectedKegiatan ?? state.activeActivity;
    // Normalize: hapus suffix WIB/WITA, coba semua field yang ada
    final String rawTimeLabel = act?['time']?.toString().isNotEmpty == true
        ? act!['time'].toString()
        : act?['jamKegiatan']?.toString().isNotEmpty == true
        ? act!['jamKegiatan'].toString()
        : (act?['jamMulai'] != null && act?['jamSelesai'] != null
              ? '${act!["jamMulai"]} - ${act["jamSelesai"]}'
              : '');
    final String timeLabel = rawTimeLabel
        .replaceAll(RegExp(r'\s*(WIB|WITA|WIT)\s*', caseSensitive: false), '')
        .replaceAllMapped(RegExp(r'(\d{2})\.(\d{2})'), (m) => '${m[1]}:${m[2]}')
        .trim();

    Widget content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            SizedBox(width: 4),
            SizedBox(width: 8),
            Text(
              'Detail Kegiatan',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        if (state.smartZoneStatus != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.auto_awesome,
                  color: AppColors.primaryGreen,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Smart Zone Aktif',
                        style: TextStyle(
                          color: AppColors.primaryGreen,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Terdeteksi di area: ${state.smartZoneStatus!['detectedZoneName'] ?? 'Zona KKN'}',
                        style: TextStyle(
                          color: AppColors.primaryGreen.withValues(alpha: 0.8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        if (state.outOfZoneSeconds > 0)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.5),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.warning_amber_rounded,
                  color: AppColors.dangerRed,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Anda berada di luar Area! Toleransi sisa: ${300 - state.outOfZoneSeconds} detik sebelum sesi dibatalkan.',
                    style: const TextStyle(
                      color: AppColors.dangerRed,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: AppColors.dangerRed,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    state.error!,
                    style: const TextStyle(
                      color: AppColors.dangerRed,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (state.error!.toLowerCase().contains('izin') ||
                    state.error!.toLowerCase().contains('ditolak'))
                  TextButton(
                    onPressed: () => openAppSettings(),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text(
                      'Pengaturan',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.dangerRed,
                      ),
                    ),
                  )
                else
                  TextButton(
                    onPressed: () => notifier.forceLocationUpdate(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text(
                      'Coba Lagi',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.dangerRed,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],



        Card(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: AppColors.primaryGreen,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'GPS Tracking',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              'Lokasi sedang dipantau',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isGpsActive
                            ? AppColors.primaryGreen.withValues(alpha: 0.1)
                            : Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isGpsActive
                                  ? AppColors.primaryGreen
                                  : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isGpsActive ? 'AKTIF' : 'NON-AKTIF',
                            style: TextStyle(
                              color: isGpsActive
                                  ? AppColors.primaryGreen
                                  : Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.my_location_rounded,
                  title: 'Posisi Anda',
                  value: pos != null ? '$lat, $lng' : '-',
                ),
                _buildDashedDivider(),
                if (state.selectedPoskoName != null) ...[
                  // Banner zona posko yang dipilih
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primaryGreen.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          state.selectedPoskoType == 'POSKO_UTAMA'
                              ? Icons.home_work_rounded
                              : Icons.home_rounded,
                          color: AppColors.primaryGreen,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Zona Tracking Aktif',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              Text(
                                state.selectedPoskoName!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (state.selectedPoskoType == 'POSKO_UTAMA')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Utama',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.primaryGreen,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _buildIconDetailRow(
                  icon: Icons.location_on_rounded,
                  title: 'Target Lokasi',
                  value: act != null
                      ? (act['address'] ??
                            act['targetLokasi'] ??
                            act['lokasi']?['alamat'] ??
                            act['location'] ??
                            '-')
                      : '-',
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildBoxDetail(
                        Icons.radar,
                        'Radius Toleransi',
                        act != null
                            ? '${act['radius'] ?? act['radiusMeter'] ?? 100} Meter'
                            : '-',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildBoxDetail(
                        Icons.access_time_rounded,
                        'Jam Kegiatan',
                        timeLabel.isNotEmpty
                            ? timeLabel.toUpperCase()
                            : (act != null ? '08:00 - 16:00' : '-'),
                      ),
                    ),
                  ],
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.groups_rounded,
                  title: 'Nama Kegiatan',
                  value: act != null
                      ? (act['namaKegiatan'] ??
                            act['zoneName'] ??
                            act['title'] ??
                            '-')
                      : '-',
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.timer_outlined,
                  title: 'Durasi Kegiatan',
                  value: act != null ? '$targetMenit Menit' : '-',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        if (act == null || act.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.1),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.5)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.grey,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.info_outline_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tidak ada jadwal aktif saat ini',
                        style: TextStyle(
                          color: Colors.grey,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Jadwal kegiatan KKN belum tersedia atau lokasi belum diset.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else if (isSuccess)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.12),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.4),
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Presensi Kehadiran Terverifikasi',
                        style: TextStyle(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Status kehadiran Anda telah berhasil dicatat & disinkronkan ke server.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else if ((state.zoneResetWarning != null && state.zoneResetWarning!.isNotEmpty && !isSuccess) || 
                 (!isAlpa && !isDisabled && !state.isEligibleForAttendance))
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: state.isInsideRadius && state.zoneResetWarning == null
                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                  : (isAlpa || (!state.isInsideRadius && state.zoneResetWarning == null)
                      ? AppColors.dangerRed.withValues(alpha: 0.1)
                      : Colors.orange.withValues(alpha: 0.1)),
              border: Border.all(
                color: state.isInsideRadius && state.zoneResetWarning == null
                    ? AppColors.primaryGreen.withValues(alpha: 0.5)
                    : (isAlpa || (!state.isInsideRadius && state.zoneResetWarning == null)
                        ? AppColors.dangerRed.withValues(alpha: 0.5)
                        : Colors.orange.withValues(alpha: 0.5)),
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: state.isInsideRadius && state.zoneResetWarning == null
                        ? AppColors.primaryGreen
                        : (isAlpa || (!state.isInsideRadius && state.zoneResetWarning == null)
                            ? AppColors.dangerRed
                            : Colors.orange),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    state.isInsideRadius && state.zoneResetWarning == null
                        ? Icons.check_rounded
                        : (isAlpa || (!state.isInsideRadius && state.zoneResetWarning == null)
                            ? Icons.close_rounded
                            : Icons.info_outline_rounded),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        (state.zoneResetWarning != null && state.zoneResetWarning!.isNotEmpty)
                            ? (isAlpa || isDisabled ? 'Sesi Dibatalkan' : 'Peringatan Zona KKN')
                            : (state.isInsideRadius
                                ? 'Kamu berada di dalam radius lokasi'
                                : 'Kamu berada di luar radius lokasi'),
                        style: TextStyle(
                          color: state.isInsideRadius && state.zoneResetWarning == null
                              ? AppColors.primaryGreen
                              : (isAlpa || (!state.isInsideRadius && state.zoneResetWarning == null)
                                  ? AppColors.dangerRed
                                  : Colors.orange[800]),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        (state.zoneResetWarning != null && state.zoneResetWarning!.isNotEmpty)
                            ? state.zoneResetWarning!
                            : (state.isInsideRadius
                                ? 'Sinyal GPS stabil dan lokasi terdeteksi.'
                                : 'Pergerakan absensi dihentikan sementara.'),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        if (act != null && act.isNotEmpty) ...[
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.05),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.5)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.timer_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Durasi Terdeteksi di Area',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '$durasiMenit mnt $durasiDetik dtk',
                                style: const TextStyle(
                                  color: Colors.orange,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '/ $targetMenit mnt',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${targetMenit > 0 ? ((durasiMenit / targetMenit) * 100).toStringAsFixed(1) : 0}%',
                        style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                LinearProgressIndicator(
                  value: targetMenit > 0
                      ? (durasiMenit / targetMenit).clamp(0.0, 1.0)
                      : 0,
                  backgroundColor: Colors.grey[300],
                  color: isSuccess ? AppColors.primaryGreen : Colors.orange,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
                const SizedBox(height: 12),
                Text(
                  isSuccess
                      ? 'Waktu terpenuhi! Presensi Anda resmi terdaftar.'
                      : (remainingMenit > 0
                            ? 'Waktu tersisa: $remainingMenit menit lagi sebelum tombol absen terbuka.'
                            : 'Waktu terpenuhi! Tombol absen sudah terbuka.'),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed:
                  (state.isEligibleForAttendance && !isSuccess && !isAlpa)
                  ? () async {
                      await _showAbsenDialog(state, notifier);
                    }
                  : null,
              icon: Icon(
                isSuccess
                    ? Icons.check_circle_rounded
                    : (isAlpa
                          ? Icons.cancel_rounded
                          : Icons.location_on_rounded),
                color: Colors.white,
                size: 20,
              ),
              label: Text(
                isSuccess
                    ? 'Presensi Selesai (Hadir)'
                    : (isAlpa
                          ? 'Tanpa Keterangan (Waktu Habis)'
                          : 'Selesai Kegiatan (Presensi Pulang)'),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.white,
                ),
              ),
              style:
                  ElevatedButton.styleFrom(
                    backgroundColor: isSuccess
                        ? AppColors.primaryGreen
                        : (isAlpa ? AppColors.dangerRed : Colors.grey[300]),
                    disabledBackgroundColor: isSuccess
                        ? AppColors.primaryGreen
                        : (isAlpa ? AppColors.dangerRed : Colors.grey[300]),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ).copyWith(
                    backgroundColor: WidgetStateProperty.resolveWith((states) {
                      if (isSuccess) return AppColors.primaryGreen;
                      if (isAlpa) return AppColors.dangerRed;
                      if (states.contains(WidgetState.disabled)) {
                        return Colors.grey[300];
                      }
                      return AppColors.primaryGreen; // Active color
                    }),
                  ),
            ),
          ),
          const SizedBox(height: 8),
          if (!state.isEligibleForAttendance && !isSuccess && !isAlpa)
            Text(
              targetMenit >= 60
                  ? 'Presensi baru dapat dilakukan setelah Anda berada di lokasi kegiatan selama ${targetMenit ~/ 60} jam tanpa putus.'
                  : 'Presensi baru dapat dilakukan setelah durasi kehadiran mencapai minimum $targetMenit menit.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: AppColors.dangerRed),
            ),
          const SizedBox(height: 16),
          if (!isSuccess && !isAlpa && (state.activeActivity?['statusKehadiran']?.toString().toUpperCase() == 'TERJEDA' || state.activeActivity?['attendanceStatus']?.toString().toUpperCase() == 'TERJEDA'))
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final result = await notifier.mulaiKegiatan(state.activeActivity!['id'].toString());
                  if (mounted) {
                    if (result == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Sesi berhasil dilanjutkan.'),
                          backgroundColor: AppColors.primaryGreen,
                        ),
                      );
                    } else if (result != 'CONFLICT') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(result),
                          backgroundColor: AppColors.dangerRed,
                        ),
                      );
                    }
                  }
                },
                icon: const Icon(Icons.play_arrow_rounded, color: Colors.white),
                label: const Text(
                  'Lanjutkan Sesi',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber.shade700,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          if (!isSuccess && !isAlpa && state.isTracking)
            StopTrackingButton(
              onStop: (String alasan) async {
                final isSuccess = await notifier.jedaKegiatan(alasan);
                if (mounted) {
                  setState(() => _showDetail = false);
                  ref.read(authProvider.notifier).fetchProfile();

                  ScaffoldMessenger.of(context).clearSnackBars();
                  if (isSuccess) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Kegiatan berhasil dijeda sementara.'),
                        backgroundColor: AppColors.primary,
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Gagal menjeda kegiatan.'),
                        backgroundColor: AppColors.dangerRed,
                      ),
                    );
                  }
                }
              },
            ),
        ],
        SizedBox(height: MediaQuery.of(context).padding.bottom + 40),
      ],
    );

    if (isDisabled) {
      return AbsorbPointer(
        absorbing: true,
        child: ColorFiltered(
          colorFilter: const ColorFilter.matrix([
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ]),
          child: content,
        ),
      );
    }

    return content;
  }
}

class KegiatanKknCard extends StatelessWidget {
  final Map<String, dynamic> kegiatan;
  final Function(String) onMulai;
  final Function(String, String?)? onSkip;
  final bool isLeaderOrDpl;

  const KegiatanKknCard({
    super.key,
    required this.kegiatan,
    required this.onMulai,
    this.onSkip,
    this.isLeaderOrDpl = false,
  });

  @override
  Widget build(BuildContext context) {
    final isAktif =
        (kegiatan['status'] ?? '').toString().toUpperCase() == 'AKTIF';
    final String? statusKehadiran = kegiatan['statusKehadiran']
        ?.toString()
        .toUpperCase();
    final bool canStart =
        isAktif &&
        statusKehadiran != 'TIDAK_ADA_KEGIATAN' &&
        (statusKehadiran == null ||
            statusKehadiran == 'BERLANGSUNG' ||
            statusKehadiran == 'DI_ZONA' ||
            statusKehadiran == 'DALAM_RADIUS');

    final jamMulai = kegiatan['jamMulai'] ?? '-';
    final jamSelesai = kegiatan['jamSelesai'] ?? '-';
    final durasiWajib = kegiatan['durasiWajibMenit'] ?? 120;
    final lokasi = kegiatan['lokasi'] != null
        ? (kegiatan['lokasi']['alamat'] ?? kegiatan['lokasi']['address'] ?? '-')
        : '-';
    final String? keteranganSkip = kegiatan['keteranganSkip']?.toString();

    String statusText;
    Color badgeColor;
    Color textColor;
    String buttonText;

    if (statusKehadiran == 'HADIR_MEMENUHI') {
      statusText = '✅ HADIR & MEMENUHI';
      badgeColor = Colors.green.withValues(alpha: 0.1);
      textColor = Colors.green;
      buttonText = 'Sesi Selesai (Memenuhi)';
    } else if (statusKehadiran == 'HADIR_TIDAK_MEMENUHI') {
      statusText = '⚠️ HADIR (TIDAK MEMENUHI)';
      badgeColor = Colors.orange.shade700.withValues(alpha: 0.1);
      textColor = Colors.orange.shade700;
      buttonText = 'Sesi Selesai (Tidak Memenuhi)';
    } else if (statusKehadiran == 'HADIR') {
      statusText = '✅ HADIR';
      badgeColor = AppColors.primaryGreen.withValues(alpha: 0.1);
      textColor = AppColors.primaryGreen;
      buttonText = 'Sudah Hadir';
    } else if (statusKehadiran == 'BERLANGSUNG') {
      statusText = '⏱️ BERLANGSUNG';
      badgeColor = Colors.orange.withValues(alpha: 0.1);
      textColor = AppColors.primaryGreen;
      buttonText = 'Lihat Sesi Aktif';
    } else if (statusKehadiran == 'TERJEDA') {
      statusText = '⏸️ TERJEDA';
      badgeColor = Colors.grey.withValues(alpha: 0.1);
      textColor = Colors.grey.shade700;
      buttonText = 'Lanjutkan Sesi';
    } else if (statusKehadiran == 'DI_ZONA' ||
        statusKehadiran == 'DALAM_RADIUS') {
      statusText = '🟢 DI DALAM ZONA';
      badgeColor = AppColors.primaryGreen.withValues(alpha: 0.1);
      textColor = AppColors.primaryGreen;
      buttonText = 'Mulai Kegiatan (Presensi Masuk)';
    } else if (statusKehadiran == 'SELESAI') {
      statusText = '🏁 SELESAI';
      badgeColor = Colors.blue.withValues(alpha: 0.1);
      textColor = Colors.blue;
      buttonText = 'Sesi Selesai';
    } else if (statusKehadiran == 'SELESAI_TELAT') {
      statusText = '⚠️ SELESAI (DURASI KURANG)';
      badgeColor = Colors.deepOrange.withValues(alpha: 0.1);
      textColor = Colors.deepOrange;
      buttonText = 'Selesai Lebih Cepat';
    } else if (statusKehadiran == 'LEPAS_RADIUS') {
      statusText = '❌ LEPAS RADIUS';
      badgeColor = AppColors.dangerRed.withValues(alpha: 0.1);
      textColor = AppColors.dangerRed;
      buttonText = 'Kehadiran Digagalkan';
    } else if (statusKehadiran == 'IZIN' || statusKehadiran == 'SAKIT') {
      statusText = '📝 $statusKehadiran';
      badgeColor = Colors.amber.withValues(alpha: 0.1);
      textColor = Colors.amber.shade800;
      buttonText = 'Izin / Sakit';
    } else if (statusKehadiran == 'TIDAK_ADA_KEGIATAN') {
      statusText = '⚪ TIDAK ADA KEGIATAN';
      badgeColor = Colors.grey.shade200;
      textColor = Colors.grey.shade800;
      buttonText = 'Tidak Ada Kegiatan';
    } else if (statusKehadiran == 'ALPA' ||
        statusKehadiran == 'TANPA_KETERANGAN') {
      statusText = '⚠️ TANPA KETERANGAN';
      badgeColor = AppColors.dangerRed.withValues(alpha: 0.1);
      textColor = AppColors.dangerRed;
      buttonText = 'Alpa (Tanpa Keterangan)';
    } else {
      statusText = isAktif ? '🟢 AKTIF' : '🔵 AKAN DATANG';
      badgeColor = isAktif
          ? AppColors.primaryGreen.withValues(alpha: 0.1)
          : Colors.blue.withValues(alpha: 0.1);
      textColor = isAktif ? AppColors.primaryGreen : Colors.blue;
      buttonText = isAktif
          ? 'Mulai Kegiatan (Presensi Masuk)'
          : 'Mendatang (Belum Masuk Waktu)';
    }

    final bool canLeaderSkip = isLeaderOrDpl &&
        onSkip != null &&
        statusKehadiran != 'TIDAK_ADA_KEGIATAN' &&
        statusKehadiran != 'BERLANGSUNG' &&
        statusKehadiran != 'TERJEDA' &&
        statusKehadiran != 'HADIR_MEMENUHI' &&
        statusKehadiran != 'HADIR_TIDAK_MEMENUHI' &&
        statusKehadiran != 'HADIR' &&
        statusKehadiran != 'SELESAI' &&
        statusKehadiran != 'SELESAI_TELAT';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              kegiatan['namaKegiatan'] ?? 'Kegiatan KKN',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            _buildPopupRow('Lokasi', lokasi.toString()),
            const SizedBox(height: 4),
            _buildPopupRow(
              'Tanggal',
              (kegiatan['tanggal']?.toString() ?? '-')
                  .split('-')
                  .reversed
                  .join('-'),
            ),
            const SizedBox(height: 4),
            _buildPopupRow('Waktu', '$jamMulai - $jamSelesai'),
            const SizedBox(height: 4),
            _buildPopupRow('Durasi Wajib', '$durasiWajib menit'),
            if (keteranganSkip != null && keteranganSkip.isNotEmpty) ...[
              const SizedBox(height: 4),
              _buildPopupRow('Keterangan', keteranganSkip),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      if (statusKehadiran == 'TIDAK_ADA_KEGIATAN' ||
                          statusKehadiran == 'HADIR' ||
                          statusKehadiran == 'HADIR_MEMENUHI' ||
                          statusKehadiran == 'HADIR_TIDAK_MEMENUHI' ||
                          statusKehadiran == 'SELESAI' ||
                          statusKehadiran == 'SELESAI_TELAT' ||
                          statusKehadiran == 'ALPA' ||
                          statusKehadiran == 'TANPA_KETERANGAN') {
                        // Fitur Lihat Riwayat telah dipindah ke halaman History
                        return;
                      } else if (statusKehadiran == 'BERLANGSUNG') {
                        onMulai(kegiatan['id'].toString()); // Parent akan menangani fallback jika BERLANGSUNG
                      } else {
                        onMulai(kegiatan['id'].toString());
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: statusKehadiran == 'TERJEDA'
                          ? Colors.amber.shade700
                          : (canStart &&
                                  statusKehadiran != 'TIDAK_ADA_KEGIATAN' &&
                                  statusKehadiran != 'HADIR' &&
                                  statusKehadiran != 'HADIR_MEMENUHI' &&
                                  statusKehadiran != 'HADIR_TIDAK_MEMENUHI' &&
                                  statusKehadiran != 'SELESAI' &&
                                  statusKehadiran != 'SELESAI_TELAT' &&
                                  statusKehadiran != 'ALPA' &&
                                  statusKehadiran != 'TANPA_KETERANGAN')
                              ? AppColors.primaryGreen
                              : Colors.grey.shade400,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      buttonText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Tampilkan alasan tombol disabled agar user tidak bingung
                  if (!canStart) ...[
                    const SizedBox(height: 6),
                    Text(
                      statusKehadiran == 'TIDAK_ADA_KEGIATAN'
                          ? (keteranganSkip != null && keteranganSkip.isNotEmpty
                              ? 'Tidak ada kegiatan: $keteranganSkip'
                              : 'Kegiatan ini ditandai Tidak Ada Kegiatan oleh DPL / Ketua.')
                          : statusKehadiran == 'HADIR' ||
                                  statusKehadiran == 'HADIR_MEMENUHI' ||
                                  statusKehadiran == 'SELESAI'
                              ? 'Anda sudah tercatat hadir pada kegiatan ini.'
                              : statusKehadiran == 'HADIR_TIDAK_MEMENUHI' ||
                                    statusKehadiran == 'SELESAI_TELAT'
                              ? 'Sesi berakhir (durasi kurang dari target).'
                              : (statusKehadiran == 'ALPA' ||
                                    statusKehadiran == 'TANPA_KETERANGAN')
                              ? 'Waktu kegiatan telah berakhir. Status: Tanpa Keterangan.'
                              : statusKehadiran == 'IZIN' ||
                                    statusKehadiran == 'SAKIT'
                              ? 'Anda memiliki pengajuan $statusKehadiran yang aktif.'
                              : !isAktif
                              ? 'Kegiatan belum dimulai sesuai jadwal.'
                              : 'Tombol tidak tersedia saat ini.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  if (canLeaderSkip) ...[
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () => _showSkipConfirmationDialog(context),
                      icon: Icon(Icons.event_busy_rounded, size: 16, color: Colors.grey.shade700),
                      label: Text(
                        'Tandai: Tidak Ada Kegiatan',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey.shade800,
                        side: BorderSide(color: Colors.grey.shade400),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSkipConfirmationDialog(BuildContext context) {
    final TextEditingController alasanController = TextEditingController(
      text: 'Tidak ada kegiatan pada hari ini',
    );

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.event_busy_rounded, color: Colors.orange),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Tandai Tidak Ada Kegiatan?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Seluruh anggota kelompok pada jadwal ini akan mendapatkan status "Tidak Ada Kegiatan" dan tidak diwajibkan hadir.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: alasanController,
              decoration: const InputDecoration(
                labelText: 'Alasan / Keterangan (Opsional)',
                hintText: 'Cth: Hari libur kegiatan posko',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogCtx).pop();
              final scheduleId = kegiatan['id']?.toString() ??
                  kegiatan['scheduleId']?.toString() ??
                  '';
              if (scheduleId.isNotEmpty && onSkip != null) {
                onSkip!(scheduleId, alasanController.text.trim());
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('Ya, Tandai'),
          ),
        ],
      ),
    );
  }

  Widget _buildPopupRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class StopTrackingButton extends StatelessWidget {
  final Function(String) onStop;

  const StopTrackingButton({super.key, required this.onStop});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: () {
          final TextEditingController alasanCtrl = TextEditingController();
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Jeda Kegiatan'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Silakan masukkan alasan Anda menjeda atau keluar sementara dari kegiatan.',
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: alasanCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Alasan Jeda',
                      hintText: 'Misal: Baterai habis, izin ke kampus...',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Batal'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final alasan = alasanCtrl.text.trim();
                    if (alasan.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Alasan tidak boleh kosong.'),
                        ),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    onStop(alasan);
                  },
                  child: const Text('Jeda'),
                ),
              ],
            ),
          );
        },
        icon: const Icon(Icons.pause_circle_filled, color: AppColors.primary),
        label: const Text(
          'Keluar Sementara (Jeda)',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
