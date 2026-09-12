import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/values/app_colors.dart';
import '../../routes/app_routes.dart';
import '../auth/controllers/auth_controller.dart';
import '../../core/values/app_config.dart';
import '../scan/controllers/scan_controller.dart';
import '../mahasiswa/controllers/mahasiswa_controller.dart';
import '../../core/widgets/profile_photo_cropper_view.dart';

import '../../data/models/user_entity.dart';
import '../../data/models/bin_entity.dart';

/// Halaman profil — sesuai desain:
/// Header biru, avatar rumah dalam lingkaran, nama+RW, Data RT, Tempat Sampah Saya, Keluar.
class ProfilView extends ConsumerStatefulWidget {
  const ProfilView({super.key});

  @override
  ConsumerState<ProfilView> createState() => _ProfilViewState();
}

class _ProfilViewState extends ConsumerState<ProfilView> {
  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(authProvider.notifier).fetchProfile();
    });
  }

  void _showAvatarOptions() {
    final user = ref.read(authProvider).user;
    final hasPhoto =
        (_profileImage != null) ||
        (user?.fotoProfil != null && user!.fotoProfil!.isNotEmpty);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Text(
                      'Foto Profil',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Row(
                  children: [
                    Text(
                      'Pilih sumber foto atau sesuaikan foto profil Anda',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildAvatarActionTile(
                  icon: Icons.photo_camera_rounded,
                  title: 'Ambil Foto dari Kamera',
                  subtitle: 'Gunakan kamera perangkat untuk mengambil foto',
                  iconColor: AppColors.primaryGreen,
                  bgColor: AppColors.primaryGreen.withValues(alpha: 0.1),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),
                const SizedBox(height: 10),
                _buildAvatarActionTile(
                  icon: Icons.photo_library_rounded,
                  title: 'Pilih dari Galeri',
                  subtitle: 'Pilih foto yang tersimpan di galeri perangkat',
                  iconColor: AppColors.primaryGreen,
                  bgColor: AppColors.primaryGreen.withValues(alpha: 0.1),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.gallery);
                  },
                ),
                if (hasPhoto) ...[
                  const SizedBox(height: 10),
                  _buildAvatarActionTile(
                    icon: Icons.delete_outline_rounded,
                    title: 'Hapus Foto Profil',
                    subtitle: 'Kembali menggunakan avatar/inisial nama default',
                    iconColor: AppColors.dangerRed,
                    bgColor: AppColors.dangerRed.withValues(alpha: 0.08),
                    isDanger: true,
                    onTap: () {
                      Navigator.pop(ctx);
                      _confirmDeletePhoto();
                    },
                  ),
                ],
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAvatarActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color iconColor,
    required Color bgColor,
    required VoidCallback onTap,
    bool isDanger = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDanger
                ? AppColors.dangerRed.withValues(alpha: 0.25)
                : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDanger ? AppColors.dangerRed : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: isDanger ? AppColors.dangerRed : AppColors.textHint,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source);
    if (picked != null && mounted) {
      // ── Buka Fitur Crop Foto Interaktif ──
      final croppedFile = await ProfilePhotoCropperView.crop(
        context,
        imageFile: File(picked.path),
      );
      if (croppedFile == null || !mounted) return;

      setState(() => _profileImage = croppedFile);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
              SizedBox(width: 12),
              Text('Mengunggah foto profil...'),
            ],
          ),
          duration: Duration(seconds: 2),
        ),
      );

      final success = await ref
          .read(authProvider.notifier)
          .uploadAvatar(croppedFile.path);
      if (mounted) {
        if (success) {
          ref.read(authProvider.notifier).fetchProfile();
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil diperbarui!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        } else {
          final error =
              ref.read(authProvider).errorCode ?? 'Gagal mengunggah foto';
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Upload gagal: $error'),
              backgroundColor: AppColors.dangerRed,
            ),
          );
        }
      }
    }
  }

  Future<void> _confirmDeletePhoto() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.delete_outline_rounded,
                color: AppColors.dangerRed,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Hapus Foto Profil?',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        content: const Text(
          'Foto profil Anda akan dihapus dan avatar akan kembali menggunakan inisial nama Anda.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
        ),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Batal',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final success = await ref.read(authProvider.notifier).deleteAvatar();
      if (mounted) {
        if (success) {
          setState(() => _profileImage = null);
          ref.read(authProvider.notifier).fetchProfile();
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil dihapus!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gagal menghapus foto profil.'),
              backgroundColor: AppColors.dangerRed,
            ),
          );
        }
      }
    }
  }

  Widget _buildAvatarImage(String? fotoPath) {
    if (fotoPath == null || fotoPath.isEmpty) {
      return const Icon(
        Icons.person_rounded,
        color: AppColors.primaryGreen,
        size: 54,
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => const Icon(
          Icons.person_rounded,
          color: AppColors.primaryGreen,
          size: 54,
        ),
      );
    }
    if (fotoPath.startsWith('/') ||
        fotoPath.startsWith('file://') ||
        fotoPath.contains(':\\') ||
        fotoPath.contains(':/')) {
      final cleanPath = fotoPath.startsWith('file://')
          ? fotoPath.replaceFirst('file://', '')
          : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }
    return CachedNetworkImage(
      imageUrl: AppConfig.getImageUrl(fotoPath),
      fit: BoxFit.cover,
      errorWidget: (_, __, ___) => const Icon(
        Icons.person_rounded,
        color: AppColors.primaryGreen,
        size: 54,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(authProvider);
    final user = userAsync.user;
    final binsAsync = ref.watch(binsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Profil'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ─── Header avatar ─────────────────────────────────────────
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.only(bottom: 24, top: 12),
              child: Column(
                children: [
                  // Avatar dengan GestureDetector untuk upload foto
                  GestureDetector(
                    onTap: _showAvatarOptions,
                    child: Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        Container(
                          width: 116,
                          height: 116,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                            color: AppColors.backgroundCanvas,
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _buildAvatarImage(
                            _profileImage?.path ?? user?.fotoProfil,
                          ),
                        ),
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryGreen.withValues(
                                  alpha: 0.4,
                                ),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user != null ? user.name : 'Warga',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      user?.role == UserRole.mahasiswaKkn
                          ? 'MAHASISWA KKN • ${user?.kelompokName.isNotEmpty == true ? user!.kelompokName : (user?.rw.isNotEmpty == true ? "RW ${user!.rw}" : "Aktif")}'
                          : (user?.formattedRw.isNotEmpty == true && user?.formattedRw != '-'
                              ? 'WARGA • RW ${user!.formattedRw}'
                              : 'WARGA BERSEKA'),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryGreen,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── Data Rumah Tangga ──────────────────────────────
                  _sectionLabel(
                    user?.role == UserRole.mahasiswaKkn
                        ? 'DATA MAHASISWA KKN'
                        : 'DATA RUMAH TANGGA',
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        _InfoTile(
                          Icons.person_outline_rounded,
                          'Nama Lengkap',
                          user?.name ?? '-',
                          bold: true,
                        ),
                        _divider(),
                        if (user?.role == UserRole.warga) ...[
                          _InfoTile(
                            Icons.family_restroom_rounded,
                            'Jumlah Anggota Keluarga',
                            '${user?.familySize ?? 1} Orang',
                          ),
                          _divider(),
                        ],
                        if (user?.role == UserRole.mahasiswaKkn) ...[
                          _InfoTile(
                            Icons.school_outlined,
                            'NIM',
                            (ref
                                        .watch(mahasiswaControllerProvider)
                                        .dashboard
                                        ?.nim
                                        .isNotEmpty ==
                                    true)
                                ? ref
                                      .watch(mahasiswaControllerProvider)
                                      .dashboard!
                                      .nim
                                : (user?.nim.isNotEmpty == true
                                      ? user!.nim
                                      : '-'),
                            bold: true,
                          ),
                          _divider(),
                          _InfoTile(
                            Icons.account_balance_outlined,
                            'Program Studi',
                            (user?.prodi != null &&
                                    user!.prodi.isNotEmpty &&
                                    user.prodi != '-')
                                ? user.prodi
                                : (ref
                                              .watch(
                                                mahasiswaControllerProvider,
                                              )
                                              .dashboard
                                              ?.jurusan
                                              .isNotEmpty ==
                                          true
                                      ? ref
                                            .watch(mahasiswaControllerProvider)
                                            .dashboard!
                                            .jurusan
                                      : '-'),
                            bold: true,
                          ),
                          _divider(),
                          _InfoTile(
                            Icons.school_rounded,
                            'Jenjang Studi',
                            user?.jenjangPendidikan != null &&
                                    user!.jenjangPendidikan.isNotEmpty
                                ? user.jenjangPendidikan
                                : '-',
                            bold: true,
                          ),
                          _divider(),
                        ],
                        _InfoTile(
                          Icons.phone_iphone_rounded,
                          'No. Telepon',
                          user?.phone != null && user!.phone.isNotEmpty
                              ? user.phone
                              : '-',
                          bold: true,
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.map_rounded,
                          'Provinsi',
                          user?.provinsi != null && user!.provinsi.isNotEmpty
                              ? user.provinsi
                              : '-',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.location_city_rounded,
                          'Kota/Kabupaten',
                          user?.kota != null && user!.kota.isNotEmpty
                              ? user.kota
                              : '-',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.map_rounded,
                          'Kecamatan',
                          user?.kecamatan != null && user!.kecamatan.isNotEmpty
                              ? user.kecamatan
                                    .replaceAll(
                                      RegExp(
                                        r'^(?:Kec\.|Kecamatan)\s+',
                                        caseSensitive: false,
                                      ),
                                      '',
                                    )
                                    .trim()
                              : '-',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.map_outlined,
                          'Kelurahan',
                          (user?.kelurahan != null &&
                                  user!.kelurahan.isNotEmpty &&
                                  user.kelurahan != '-')
                              ? user.kelurahan
                                    .replaceAll(
                                      RegExp(
                                        r'^(?:Kel\.|Kelurahan|Desa)\s+',
                                        caseSensitive: false,
                                      ),
                                      '',
                                    )
                                    .trim()
                              : '-',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.location_city_rounded,
                          user?.role == UserRole.mahasiswaKkn
                              ? 'RW Dampingan'
                              : 'RW',
                          (user?.rw != null &&
                                  user!.rw.isNotEmpty &&
                                  user.rw != '-')
                              ? user.formattedRw
                              : '-',
                        ),
                        _divider(),
                        if (user?.role == UserRole.warga) ...[
                          _InfoTile(
                            Icons.school_outlined,
                            'Mahasiswa Pendamping',
                            user?.pendampingName != null &&
                                    user!.pendampingName!.isNotEmpty
                                ? user.pendampingName!
                                : '-',
                          ),
                          _divider(),
                        ],
                        if (user?.role != UserRole.mahasiswaKkn) ...[
                          _InfoTile(
                            Icons.home_outlined,
                            'Alamat Lengkap',
                            user?.address != null && user!.address.isNotEmpty
                                ? user.address
                                      .replaceAll(
                                        RegExp(
                                          r',\s*(?:Kec\.|Kecamatan)\s+.*$',
                                          caseSensitive: false,
                                        ),
                                        '',
                                      )
                                      .trim()
                                : '-',
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ─── Tempat Sampah Saya ──────────────────────────────────────
                  if (user?.role != UserRole.mahasiswaKkn) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [_sectionLabel('TEMPAT SAMPAH SAYA')],
                    ),
                    const SizedBox(height: 8),
                    binsAsync.when(
                      skipLoadingOnReload: true,
                      data: (bins) => GestureDetector(
                        onTap: () => Navigator.of(
                          context,
                        ).pushNamed(AppRoutes.kelolaBin),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.delete_outline,
                                color: AppColors.primaryGreen,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  bins.isEmpty
                                      ? 'Belum ada tempat sampah terdaftar.'
                                      : '${bins.length} Tempat Sampah Terdaftar (Ketuk untuk kelola)',
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right_rounded,
                                color: AppColors.textHint,
                              ),
                            ],
                          ),
                        ),
                      ),
                      loading: () => const SizedBox(
                        height: 60,
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 28),
                  ],

                  // ─── Menu Actions ───────────────────────────────────
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        if (user?.role == UserRole.mahasiswaKkn) ...[
                          _MenuTile(
                            icon: Icons.manage_accounts_rounded,
                            iconColor: AppColors.primaryGreen,
                            iconBgColor: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            label: 'Edit Profil Mahasiswa',
                            onTap: () => Navigator.of(
                              context,
                            ).pushNamed(AppRoutes.editProfilMahasiswa),
                          ),
                          const Divider(height: 1, indent: 56),
                        ],
                        if (user?.role == UserRole.warga) ...[
                          // Tambah Tempat Sampah Baru
                          _MenuTile(
                            icon: Icons.qr_code_scanner_rounded,
                            iconColor: AppColors.primaryGreen,
                            iconBgColor: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            label: 'Tambah Tempat Sampah Baru',
                            onTap: () {
                              final bins = ref.read(binsProvider).value ?? [];
                              final hasOrganic = bins.any(
                                (b) =>
                                    b.binType == WasteType.organic && b.isActive,
                              );
                              final hasNonOrganic = bins.any(
                                (b) =>
                                    b.binType == WasteType.nonOrganic &&
                                    b.isActive,
                              );
                              if (hasOrganic && !hasNonOrganic) {
                                Navigator.of(context).pushNamed(
                                  AppRoutes.ukurKapasitas,
                                  arguments: {'targetType': 'non_organic'},
                                );
                              } else if (!hasOrganic && hasNonOrganic) {
                                Navigator.of(context).pushNamed(
                                  AppRoutes.ukurKapasitas,
                                  arguments: {'targetType': 'organic'},
                                );
                              } else if (hasOrganic && hasNonOrganic) {
                                Navigator.of(context).pushNamed(AppRoutes.kelolaBin);
                              } else {
                                Navigator.of(context).pushNamed(
                                  AppRoutes.ukurKapasitas,
                                  arguments: {'targetType': 'both'},
                                );
                              }
                            },
                          ),
                          const Divider(height: 1, indent: 56),
                        ],
                        if (user?.role == UserRole.mahasiswaKkn) ...[
                          // Form Evaluasi & Masukan Pengguna (Google Form)
                          _MenuTile(
                            icon: Icons.rate_review_outlined,
                            iconColor: AppColors.primaryGreen,
                            iconBgColor: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            label: 'Kuesioner Evaluasi & Feedback',
                            onTap: () async {
                              final Uri url = Uri.parse(
                                'https://docs.google.com/forms/d/e/1FAIpQLSdj1kGx4TalUlrefeHvU7LGrsfK2hgAGJYBK0mBL69O8_h5lQ/viewform?usp=sharing&ouid=100074849759690894073',
                              );
                              if (await canLaunchUrl(url)) {
                                await launchUrl(
                                  url,
                                  mode: LaunchMode.externalApplication,
                                );
                              } else {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Tidak dapat membuka tautan kuesioner.',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                          ),
                          const Divider(height: 1, indent: 56),
                        ],

                        // Tentang Aplikasi
                        _MenuTile(
                          icon: Icons.info_outline_rounded,
                          iconColor: AppColors.primaryGreen,
                          iconBgColor: AppColors.primaryGreen.withValues(
                            alpha: 0.1,
                          ),
                          label: 'Tentang Aplikasi',
                          onTap: () => Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.tentang),
                        ),

                        // Ganti Kata Sandi (Khusus Warga)
                        if (user?.role == UserRole.warga) ...[
                          _MenuTile(
                            icon: Icons.lock_reset_rounded,
                            iconColor: AppColors.primaryGreen,
                            iconBgColor: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            label: 'Ganti Kata Sandi',
                            onTap: () => Navigator.of(
                              context,
                            ).pushNamed(AppRoutes.wargaGantiPassword),
                          ),
                        ],
                        // Keluar
                        _MenuTile(
                          icon: Icons.logout_rounded,
                          iconColor: AppColors.dangerRed,
                          iconBgColor: AppColors.dangerRed.withValues(
                            alpha: 0.1,
                          ),
                          label: 'Keluar',
                          onTap: () => _confirmLogout(context, ref),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                Navigator.of(
                  context,
                ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.dangerRed),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

Widget _sectionLabel(String text) => Text(
  text,
  style: const TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
  ),
);

Widget _divider() => const Divider(height: 1, indent: 52);

class _InfoTile extends StatelessWidget {
  const _InfoTile(this.icon, this.label, this.value, {this.bold = true});

  final IconData icon;
  final String label;
  final String value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.backgroundCanvas,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 1),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
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
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textHint,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
