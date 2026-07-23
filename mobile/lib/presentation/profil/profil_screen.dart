/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../../domain/entities/bin_entity.dart';
import '../providers/auth_provider.dart';
import '../providers/bin_provider.dart';

/// Halaman profil — sesuai desain:
/// Header biru, avatar rumah dalam lingkaran, nama+RT/RW, Data RT, Tong Saya, Keluar.
class ProfilScreen extends ConsumerStatefulWidget {
  const ProfilScreen({super.key});

  @override
  ConsumerState<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends ConsumerState<ProfilScreen> {
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
      // TODO-SYNC: panggil repository untuk upload foto profil ke backend
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
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
                                : null,
                          ),
                          child: _profileImage == null
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
                    user != null ? 'Keluarga ${user.name}' : 'Keluarga Warga',
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
                  _sectionLabel('DATA RUMAH TANGGA'),
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
                          'Kepala Keluarga',
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
                          Icons.credit_card_outlined,
                          'NIK',
                          user?.nik ?? '-',
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _sectionLabel('TONG SAYA'),
                      TextButton(
                        onPressed: () => Navigator.of(
                          context,
                        ).pushNamed(AppRoutes.aktivasiBin),
                        child: const Text(
                          'Kelola',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  binsAsync.when(
                    data: (bins) => bins.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Center(
                              child: Text(
                                'Belum ada tong terdaftar.',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          )
                        : Row(
                            children: bins
                                .map(
                                  (bin) => Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 4),
                                      child: _BinCard(bin: bin),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                    loading: () => const SizedBox(
                      height: 60,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                  ),

                  const SizedBox(height: 28),

                  // ─── Menu Actions ───────────────────────────────────
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        // Aktivasi Tong Baru
                        _MenuTile(
                          icon: Icons.qr_code_scanner_rounded,
                          iconColor: AppColors.primaryGreen,
                          iconBgColor: AppColors.primaryGreen.withValues(
                            alpha: 0.1,
                          ),
                          label: 'Aktivasi Tong Baru',
                          onTap: () => Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.aktivasiBin),
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
                      '© 2026 TrashCare\n© 2026 PT Makerindo. Developed by PT Makerindo.',
                      textAlign: TextAlign.center,
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
                Navigator.of(context).pushReplacementNamed(AppRoutes.login);
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

class _BinCard extends StatelessWidget {
  const _BinCard({required this.bin});
  final BinEntity bin;

  @override
  Widget build(BuildContext context) {
    final bool isOrganic = bin.binType == WasteType.organic;
    final Color color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.delete_rounded, color: color, size: 18),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: bin.isCritical
                      ? AppColors.dangerRed
                      : AppColors.primaryGreen,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            bin.binType.displayName,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          Text(
            bin.qrSerial.length > 12
                ? bin.qrSerial.substring(0, 12)
                : bin.qrSerial,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Text(
                'Status: ',
                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              Text(
                bin.isActive ? 'AKTIF' : 'NON-AKTIF',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: bin.isActive
                      ? AppColors.primaryGreen
                      : AppColors.dangerRed,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
