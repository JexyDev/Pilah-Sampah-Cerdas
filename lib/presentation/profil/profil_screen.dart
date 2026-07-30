import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
<<<<<<<< HEAD:apps/mobile/lib/presentation/profil/profil_screen.dart
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../../domain/entities/bin_entity.dart';
import '../providers/auth_provider.dart';
import '../../config/app_config.dart';
import '../providers/bin_provider.dart';

/// Halaman profil — sesuai desain:
/// Header biru, avatar rumah dalam lingkaran, nama+RT/RW, Data RT, Tong Saya, Keluar.
class ProfilScreen extends ConsumerStatefulWidget {
  const ProfilScreen({super.key});

  @override
  ConsumerState<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends ConsumerState<ProfilScreen> {
========
import '../../core/values/app_colors.dart';
import '../../routes/app_routes.dart';
import '../../data/models/bin_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../../core/values/app_config.dart';
import '../scan/controllers/scan_controller.dart';
import '../../data/models/user_entity.dart';

/// Halaman profil — sesuai desain:
/// Header biru, avatar rumah dalam lingkaran, nama+RT/RW, Data RT, Tong Saya, Keluar.
class ProfilView extends ConsumerStatefulWidget {
  const ProfilView({super.key});

  @override
  ConsumerState<ProfilView> createState() => _ProfilViewState();
}

class _ProfilViewState extends ConsumerState<ProfilView> {
>>>>>>>> origin/mobile:lib/app/modules/profil/profil_view.dart
  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(authProvider.notifier).fetchProfile();
    });
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _profileImage = File(picked.path));
      
      if (!mounted) return;
      
      final success = await ref.read(authProvider.notifier).uploadAvatar(picked.path);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil diperbarui!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        } else {
          final error = ref.read(authProvider).errorCode ?? 'Gagal mengunggah foto';
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

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(authProvider);
    final user = userAsync.user;
    final binsAsync = ref.watch(binsProvider);
    
    final hasOrganic = binsAsync.value?.any((b) => b.binType == WasteType.organic) ?? false;
    final hasAnorganic = binsAsync.value?.any((b) => b.binType == WasteType.nonOrganic) ?? false;

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
              padding: const EdgeInsets.only(bottom: 28),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  // Avatar rumah dalam lingkaran double
                  // Avatar dengan GestureDetector untuk upload foto
                  GestureDetector(
                    onTap: _pickImage,
                    child: Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.border, width: 3),
                            color: AppColors.backgroundCanvas,
                            image: _profileImage != null
                                ? DecorationImage(
                                    image: FileImage(_profileImage!),
                                    fit: BoxFit.cover,
                                  )
                                : (user?.fotoProfil != null && user!.fotoProfil!.isNotEmpty
                                    ? DecorationImage(
                                        image: NetworkImage(
                                          user.fotoProfil!.startsWith('http')
                                              ? user.fotoProfil!
                                              : '${AppConfig.baseUrl}${user.fotoProfil}',
                                        ),
                                        fit: BoxFit.cover,
                                      )
                                    : null),
                          ),
                          child: _profileImage == null && (user?.fotoProfil == null || user!.fotoProfil!.isEmpty)
                              ? const Icon(
                                  Icons.person_rounded,
                                  color: AppColors.primaryGreen,
                                  size: 48,
                                )
                              : null,
                        ),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user != null 
                        ? (user.role == UserRole.mahasiswaKkn ? user.name : 'Keluarga ${user.name}') 
                        : 'Keluarga Warga',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      user?.rtRw ?? 'RT 04 / RW 02',
                      style: const TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
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
                  _sectionLabel(user?.role == UserRole.mahasiswaKkn ? 'DATA MAHASISWA KKN' : 'DATA RUMAH TANGGA'),
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
                          user?.role == UserRole.mahasiswaKkn ? 'Nama Lengkap' : 'Kepala Keluarga',
                          user?.name ?? '-',
                          bold: true,
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.location_on_outlined,
                          'Wilayah',
                          user?.rtRw != null && user!.rtRw.isNotEmpty
                              ? '${user.rtRw}, Kel. ${user.kelurahan}'
                              : 'Belum diatur',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.phone_iphone_rounded,
                          'No. Telepon',
                          user?.phone != null && user!.phone.isNotEmpty ? user.phone : '-',
                        ),
                        _divider(),
                        _InfoTile(
                          Icons.badge_outlined,
                          'ID Akun',
                          user?.id.substring(0, 8).toUpperCase() ?? '-',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ─── Tong Saya ──────────────────────────────────────
<<<<<<<< HEAD:apps/mobile/lib/presentation/profil/profil_screen.dart
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _sectionLabel('TONG SAYA'),
                      if (!(hasOrganic && hasAnorganic))
                        TextButton(
                          onPressed: () => Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.ukurKapasitas),
                          child: const Text(
                            'Kelola',
                            style: TextStyle(
                              color: AppColors.primaryGreen,
                              fontSize: 13,
                            ),
                          ),
                        ),
========
                  if (user?.role != UserRole.mahasiswaKkn) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _sectionLabel('TONG SAYA'),
>>>>>>>> origin/mobile:lib/app/modules/profil/profil_view.dart
                    ],
                  ),
                  const SizedBox(height: 8),
                  binsAsync.when(
                    data: (bins) => GestureDetector(
                      onTap: () => Navigator.of(context).pushNamed(AppRoutes.kelolaBin),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.delete_outline, color: AppColors.primaryGreen),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                bins.isEmpty ? 'Belum ada tong terdaftar.' : '${bins.length} Tong Terdaftar (Ketuk untuk kelola)',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
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
<<<<<<<< HEAD:apps/mobile/lib/presentation/profil/profil_screen.dart
                        // Aktivasi Tong Baru
                        if (!(hasOrganic && hasAnorganic))
========
                        if (user?.role != UserRole.mahasiswaKkn) ...[
                          // Tambah Tong Baru
>>>>>>>> origin/mobile:lib/app/modules/profil/profil_view.dart
                          _MenuTile(
                            icon: Icons.qr_code_scanner_rounded,
                            iconColor: AppColors.primaryGreen,
                            iconBgColor: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
<<<<<<<< HEAD:apps/mobile/lib/presentation/profil/profil_screen.dart
                            label: 'Aktivasi Tong Baru',
                            onTap: () => Navigator.of(
                              context,
                            ).pushNamed(AppRoutes.ukurKapasitas),
                          ),
                        if (!(hasOrganic && hasAnorganic))
                          const Divider(height: 1, indent: 56),
                        // Ajukan Pengosongan Tong
                        _MenuTile(
                          icon: Icons.restore_rounded,
                          iconColor: AppColors.warningOrange,
                          iconBgColor: AppColors.warningOrange.withValues(
                            alpha: 0.1,
                          ),
                          label: 'Ajukan Pengosongan Tong',
                          onTap: () => Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.resetBin),
========
                            label: 'Tambah Tong Baru',
                            onTap: () => Navigator.of(
                              context,
                            ).pushNamed(AppRoutes.ukurKapasitas),
                          ),
                          const Divider(height: 1, indent: 56),
                          // Ajukan Pengosongan Tong
                          _MenuTile(
                            icon: Icons.restore_rounded,
                            iconColor: AppColors.warningOrange,
                            iconBgColor: AppColors.warningOrange.withValues(
                              alpha: 0.1,
                            ),
                            label: 'Ajukan Pengosongan Tong',
                            onTap: () => Navigator.of(
                              context,
                            ).pushNamed(AppRoutes.resetBin),
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
>>>>>>>> origin/mobile:lib/app/modules/profil/profil_view.dart
                        ),
                        const Divider(height: 1, indent: 56),
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
                        const Divider(height: 1, indent: 56),
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
                  const Center(
                    child: Text(
                      '© 2026 TrashCare',
                      style: TextStyle(fontSize: 11, color: AppColors.textHint),
                    ),
                  ),
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
  const _InfoTile(this.icon, this.label, this.value, {this.bold = false});

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
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: bold ? FontWeight.w600 : FontWeight.w400,
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
