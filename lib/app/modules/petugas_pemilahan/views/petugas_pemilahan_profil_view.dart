import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../core/widgets/profile_photo_cropper_view.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';

class PetugasPemilahanProfilView extends ConsumerStatefulWidget {
  const PetugasPemilahanProfilView({super.key});

  @override
  ConsumerState<PetugasPemilahanProfilView> createState() =>
      _PetugasPemilahanProfilViewState();
}

class _PetugasPemilahanProfilViewState
    extends ConsumerState<PetugasPemilahanProfilView> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;
  File? _localImage;

  void _showAvatarOptions() {
    final user = ref.read(authProvider).user;
    final hasPhoto =
        (_localImage != null) ||
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
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null && mounted) {
        final croppedFile = await ProfilePhotoCropperView.crop(
          context,
          imageFile: File(image.path),
        );
        if (croppedFile == null || !mounted) return;

        setState(() {
          _localImage = croppedFile;
          _isUploading = true;
        });

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
          setState(() => _isUploading = false);
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
                ref.read(authProvider).errorCode ?? 'Gagal mengunggah foto.';
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
    } catch (e) {
      if (mounted) setState(() => _isUploading = false);
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
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      setState(() => _isUploading = true);
      final success = await ref.read(authProvider.notifier).deleteAvatar();
      if (mounted) {
        setState(() {
          _localImage = null;
          _isUploading = false;
        });
        if (success) {
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

  Widget _buildAvatar(String? fotoPath) {
    if (_localImage != null) {
      return Image.file(_localImage!, fit: BoxFit.cover);
    }

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

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Keluar Akun'),
        content: const Text(
          'Apakah Anda yakin ingin keluar dari akun Petugas Pemilahan?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authProvider.notifier).logout();
              if (mounted) {
                Navigator.of(
                  context,
                ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.maroonRed),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';
    final kelurahan = user?.kelurahan.isNotEmpty == true
        ? user!.kelurahan
            .replaceAll(
              RegExp(r'^(?:Kel\.|Kelurahan|Desa)\s+', caseSensitive: false),
              '',
            )
            .trim()
        : '-';

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
                  GestureDetector(
                    onTap: _isUploading ? null : _showAvatarOptions,
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
                          child: _isUploading
                              ? const Center(
                                  child: CircularProgressIndicator(
                                    color: AppColors.primaryGreen,
                                  ),
                                )
                              : _buildAvatar(
                                  _localImage?.path ?? user?.fotoProfil,
                                ),
                        ),
                        if (!_isUploading)
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
                    user != null ? user.name : 'Petugas Pemilahan',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primaryGreen.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Text(
                      (rw != '-' && kelurahan != '-')
                          ? 'PETUGAS PEMILAHAN • RW $rw, KEL. $kelurahan'
                          : (rw != '-'
                              ? 'PETUGAS PEMILAHAN • RW $rw'
                              : 'PETUGAS PEMILAHAN'),
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
                  // ─── Data Petugas Pemilahan ──────────────────────────────
                  _sectionLabel('DATA PETUGAS PEMILAHAN'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        _infoTile(
                          Icons.person_outline_rounded,
                          'Nama Lengkap',
                          user?.name ?? '-',
                          bold: true,
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.phone_iphone_rounded,
                          'No. Telepon',
                          user != null &&
                                  user.phone.toString() != 'null' &&
                                  user.phone.toString().isNotEmpty
                              ? user.phone
                              : '-',
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.map_rounded,
                          'Provinsi',
                          user != null &&
                                  user.provinsi.toString() != 'null' &&
                                  user.provinsi.toString().isNotEmpty
                              ? user.provinsi
                              : '-',
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.location_city_rounded,
                          'Kota/Kabupaten',
                          user != null &&
                                  user.kota.toString() != 'null' &&
                                  user.kota.toString().isNotEmpty
                              ? user.kota
                              : '-',
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.map_rounded,
                          'Kecamatan',
                          user != null &&
                                  user.kecamatan.toString() != 'null' &&
                                  user.kecamatan.toString().isNotEmpty
                              ? user.kecamatan
                              : '-',
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.map_outlined,
                          'Kelurahan',
                          user != null &&
                                  user.kelurahan.toString() != 'null' &&
                                  user.kelurahan.toString().isNotEmpty
                              ? user.kelurahan
                              : '-',
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.location_city_rounded,
                          'RW Penugasan',
                          user != null &&
                                  user.rw.toString() != 'null' &&
                                  user.rw.toString().isNotEmpty
                              ? user.rw
                              : '-',
                          bold: true,
                        ),
                        const Divider(height: 1, indent: 56),
                        _infoTile(
                          Icons.home_outlined,
                          'Alamat Lengkap',
                          user != null &&
                                  user.address.toString() != 'null' &&
                                  user.address.toString().isNotEmpty
                              ? user.address
                              : '-',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ─── Menu Pengaturan & Keamanan ────────────────────────
                  _sectionLabel('PENGATURAN & KEAMANAN'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        // Ganti Password khusus Petugas Pemilahan
                        ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.lock_reset_rounded,
                              color: AppColors.primaryGreen,
                              size: 20,
                            ),
                          ),
                          title: const Text(
                            'Ganti Kata Sandi',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          subtitle: const Text(
                            'Ubah kata sandi akun Petugas Pemilahan',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          trailing: const Icon(
                            Icons.chevron_right_rounded,
                            color: AppColors.textHint,
                          ),
                          onTap: () => Navigator.pushNamed(
                            context,
                            AppRoutes.petugasPemilahanGantiPassword,
                          ),
                        ),
                        const Divider(height: 1, indent: 56),

                        // Tentang Aplikasi
                        ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primaryBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.info_outline_rounded,
                              color: AppColors.primaryBlue,
                              size: 20,
                            ),
                          ),
                          title: const Text(
                            'Tentang Aplikasi',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          trailing: const Icon(
                            Icons.chevron_right_rounded,
                            color: AppColors.textHint,
                          ),
                          onTap: () =>
                              Navigator.pushNamed(context, AppRoutes.tentang),
                        ),
                        const Divider(height: 1, indent: 56),

                        // Keluar
                        ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.maroonRed.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.logout_rounded,
                              color: AppColors.maroonRed,
                              size: 20,
                            ),
                          ),
                          title: const Text(
                            'Keluar Akun',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: AppColors.maroonRed,
                            ),
                          ),
                          onTap: _confirmLogout,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppDimensions.xl),

                  const Center(
                    child: Column(
                      children: [
                        Text(
                          '© 2026 Universitas Komputer Indonesia',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Versi 1.0.0 • Petugas Pemilahan',
                          style: TextStyle(fontSize: 10, color: AppColors.textHint),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: AppColors.textSecondary,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _infoTile(
    IconData icon,
    String label,
    String value, {
    bool bold = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary, size: 22),
      title: Text(
        label,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      subtitle: Text(
        value,
        style: TextStyle(
          fontSize: 14,
          fontWeight: bold ? FontWeight.bold : FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}
