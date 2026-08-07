import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_residu_controller.dart';

class PetugasResiduProfilView extends ConsumerStatefulWidget {
  const PetugasResiduProfilView({super.key});

  @override
  ConsumerState<PetugasResiduProfilView> createState() => _PetugasResiduProfilViewState();
}

class _PetugasResiduProfilViewState extends ConsumerState<PetugasResiduProfilView> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;
  File? _localImage;

  Future<void> _pickAndUploadImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
      if (image != null) {
        setState(() {
          _localImage = File(image.path);
          _isUploading = true;
        });
        
        final success = await ref.read(authProvider.notifier).uploadAvatar(image.path);
        
        if (mounted) {
          setState(() => _isUploading = false);
          if (success) {
            ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Foto profil berhasil diperbarui!'), backgroundColor: AppColors.primaryGreen),
            );
          } else {
            ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Gagal mengunggah foto.'), backgroundColor: AppColors.dangerRed),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Widget _buildAvatar(String? fotoPath, String name) {
    if (_localImage != null) {
      return Image.file(_localImage!, fit: BoxFit.cover, width: 80, height: 80);
    }
    
    if (fotoPath == null || fotoPath.isEmpty) {
      return Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'P',
          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
        ),
      );
    }

    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        width: 80,
        height: 80,
        errorWidget: (_, __, ___) => Center(
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : 'P',
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
          ),
        ),
      );
    }

    if (fotoPath.startsWith('/') || fotoPath.startsWith('file://') || fotoPath.contains(':\\')) {
      final cleanPath = fotoPath.startsWith('file://') ? fotoPath.replaceFirst('file://', '') : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover, width: 80, height: 80);
      }
    }

    return CachedNetworkImage(
      imageUrl: '${AppConfig.baseUrl}$fotoPath',
      fit: BoxFit.cover,
      width: 80,
      height: 80,
      errorWidget: (_, __, ___) => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'P',
          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
        ),
      ),
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Keluar Akun'),
        content: const Text('Apakah Anda yakin ingin keluar dari akun Petugas Residu?'),
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
                Navigator.of(context).pushNamedAndRemoveUntil(
                  AppRoutes.login,
                  (route) => false,
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.dangerRed),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasResiduControllerProvider);
    final dashboard = state.dashboard;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Profil & Pengaturan',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primaryGreen,
        elevation: 2,
        shadowColor: Colors.black12,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Column(
          children: [
            // Avatar Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: _isUploading ? null : _pickAndUploadImage,
                    child: Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _isUploading
                              ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                              : _buildAvatar(user?.fotoProfil, user?.name ?? 'Petugas'),
                        ),
                        if (!_isUploading)
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: AppColors.primaryGreen,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 14),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'Petugas Residu',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'PETUGAS RESIDU RT/RW',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // Informasi Detail Akun
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  _infoTile(
                    Icons.badge_outlined,
                    'ID Petugas',
                    dashboard?.petugasId ?? user?.id.substring(0, 8).toUpperCase() ?? 'PTR-001',
                  ),
                  const Divider(height: 1, indent: 56),
                  _infoTile(
                    Icons.map_rounded,
                    'Kecamatan',
                    user?.kecamatan.isNotEmpty == true ? 'Kec. ${user!.kecamatan}' : 'Kec. Coblong',
                  ),
                  const Divider(height: 1, indent: 56),
                  _infoTile(
                    Icons.map_outlined,
                    'Kelurahan',
                    user?.kelurahan.isNotEmpty == true ? 'Kel. ${user!.kelurahan}' : 'Kel. Bojongsoang',
                  ),
                  const Divider(height: 1, indent: 56),
                  _infoTile(
                    Icons.location_city_rounded,
                    'RW Penugasan',
                    user?.rw.isNotEmpty == true ? 'RW ${user!.rw}' : 'RW 02',
                    bold: true,
                  ),
                  const Divider(height: 1, indent: 56),
                  _infoTile(
                    Icons.home_outlined,
                    'RT Penugasan',
                    user?.rt.isNotEmpty == true ? 'RT ${user!.rt}' : 'RT 01',
                  ),
                  const Divider(height: 1, indent: 56),
                  _infoTile(
                    Icons.phone_iphone_rounded,
                    'No. Telepon',
                    user?.phone.isNotEmpty == true ? user!.phone : '-',
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // Menu Pengaturan & Keamanan
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  // Ganti Password khusus Petugas Residu
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.lock_reset_rounded, color: AppColors.primaryGreen, size: 20),
                    ),
                    title: const Text('Ganti Kata Sandi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: const Text('Ubah kata sandi akun Petugas Residu', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
                    onTap: () => Navigator.pushNamed(context, AppRoutes.petugasResiduGantiPassword),
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
                      child: const Icon(Icons.info_outline_rounded, color: AppColors.primaryBlue, size: 20),
                    ),
                    title: const Text('Tentang Aplikasi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
                    onTap: () => Navigator.pushNamed(context, AppRoutes.tentang),
                  ),
                  const Divider(height: 1, indent: 56),

                  // Keluar
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.dangerRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.logout_rounded, color: AppColors.dangerRed, size: 20),
                    ),
                    title: const Text('Keluar Akun', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.dangerRed)),
                    onTap: _confirmLogout,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.xl),

            const Center(
              child: Text(
                '© 2026 TrashCare • Modul Petugas Residu',
                style: TextStyle(fontSize: 11, color: AppColors.textHint),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value, {bool bold = false}) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary, size: 22),
      title: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
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
