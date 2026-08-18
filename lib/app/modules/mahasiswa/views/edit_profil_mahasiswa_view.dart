import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_controller.dart';

class EditProfilMahasiswaView extends ConsumerStatefulWidget {
  const EditProfilMahasiswaView({super.key});

  @override
  ConsumerState<EditProfilMahasiswaView> createState() => _EditProfilMahasiswaViewState();
}

class _EditProfilMahasiswaViewState extends ConsumerState<EditProfilMahasiswaView> {
  final _passwordFormKey = GlobalKey<FormState>();

  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  bool _isSubmittingPassword = false;
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isPasswordSectionExpanded = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) {
      setState(() => _profileImage = File(picked.path));
      final success = await ref.read(authProvider.notifier).uploadAvatar(picked.path);
      if (mounted) {
        if (success) {
          ref.read(authProvider.notifier).fetchProfile();
          ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil diperbarui!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gagal mengunggah foto profil.'),
              backgroundColor: AppColors.dangerRed,
            ),
          );
        }
      }
    }
  }

  Future<void> _submitChangePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    setState(() => _isSubmittingPassword = true);

    final oldPassword = _oldPasswordController.text;
    final newPassword = _newPasswordController.text;

    final success = await ref.read(authProvider.notifier).changePassword(
          oldPassword: oldPassword,
          newPassword: newPassword,
        );

    setState(() => _isSubmittingPassword = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Kata sandi berhasil diperbarui!'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        _oldPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        setState(() => _isPasswordSectionExpanded = false);
      } else {
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengubah kata sandi. Periksa kata sandi lama Anda.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final mhsData = ref.watch(mahasiswaControllerProvider).dashboard;

    final userNim = user?.nim.isNotEmpty == true ? user!.nim : (mhsData?.nim.isNotEmpty == true ? mhsData!.nim : '-');
    final userProdi = user?.prodi.isNotEmpty == true ? user!.prodi : (user?.jurusan.isNotEmpty == true ? user!.jurusan : (mhsData?.jurusan.isNotEmpty == true ? mhsData!.jurusan : '-'));
    final kelurahan = user?.kelurahan.isNotEmpty == true ? user!.kelurahan.replaceAll(RegExp(r'^(?:Kel\.|Kelurahan|Desa)\s+', caseSensitive: false), '').trim() : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Edit Profil Mahasiswa',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Column(
          children: [
            // ── 1. Avatar Upload Card ────────────────────────────────
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
                    onTap: _pickImage,
                    child: Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 44,
                          backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.15),
                          backgroundImage: _profileImage != null
                              ? FileImage(_profileImage!)
                              : (user?.fotoProfil != null && user!.fotoProfil!.isNotEmpty
                                  ? NetworkImage(user.fotoProfil!) as ImageProvider
                                  : null),
                          child: (_profileImage == null && (user?.fotoProfil == null || user!.fotoProfil!.isEmpty))
                              ? Text(
                                  user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'M',
                                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                                )
                              : null,
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    user?.name ?? '-',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                    if (userNim.isNotEmpty)
                      Text(
                        userNim,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // ── 2. Read-Only Academic & Assignment Section ────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.lock_outline_rounded, color: AppColors.textHint, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'DATA AKADEMIK & PENUGASAN (READ-ONLY)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                    _buildReadOnlyField('NIM', userNim.isNotEmpty ? userNim : '-'),
                    _buildReadOnlyField('Program Studi', userProdi.isNotEmpty ? userProdi : '-'),
                    _buildReadOnlyField('Jenjang Studi', (user?.jenjangPendidikan != null && user!.jenjangPendidikan.isNotEmpty) ? user.jenjangPendidikan : '-'),

                  _buildReadOnlyField('Kelurahan Dampingan', kelurahan.isNotEmpty ? kelurahan : '-'),
                  _buildReadOnlyField('RW Dampingan', rw.isNotEmpty ? rw : '-'),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlueLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: AppColors.primaryBlueDark, size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Data akademik & wilayah penugasan bersifat resmi. Perubahan data wajib diajukan melalui Admin KKN / DPL.',
                            style: TextStyle(fontSize: 11, color: AppColors.primaryBlueDark, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // ── 3. Embedded Submenu Ganti Password ────────────────────
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: ExpansionTile(
                initiallyExpanded: _isPasswordSectionExpanded,
                onExpansionChanged: (exp) => setState(() => _isPasswordSectionExpanded = exp),
                leading: const Icon(Icons.lock_reset_rounded, color: AppColors.primaryGreen),
                title: const Text('Ganti Kata Sandi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: const Text('Kelola keamanan kata sandi akun', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Form(
                      key: _passwordFormKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Kata Sandi Saat Ini', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _oldPasswordController,
                            obscureText: _obscureOld,
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primaryGreen),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureOld ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppColors.textHint),
                                onPressed: () => setState(() => _obscureOld = !_obscureOld),
                              ),
                              hintText: 'Masukkan kata sandi lama',
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Wajib diisi' : null,
                          ),
                          const SizedBox(height: 14),
                          const Text('Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _newPasswordController,
                            obscureText: _obscureNew,
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.lock_rounded, color: AppColors.primaryGreen),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureNew ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppColors.textHint),
                                onPressed: () => setState(() => _obscureNew = !_obscureNew),
                              ),
                              hintText: 'Minimal 6 karakter',
                            ),
                            validator: (v) => (v != null && v.length < 6) ? 'Minimal 6 karakter' : null,
                          ),
                          const SizedBox(height: 14),
                          const Text('Konfirmasi Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: _obscureConfirm,
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.lock_rounded, color: AppColors.primaryGreen),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppColors.textHint),
                                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                              ),
                              hintText: 'Ketik ulang kata sandi baru',
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                              if (v != _newPasswordController.text) return 'Kata sandi tidak cocok';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            height: 46,
                            child: ElevatedButton.icon(
                              onPressed: _isSubmittingPassword ? null : _submitChangePassword,
                              icon: _isSubmittingPassword
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Icon(Icons.save_rounded, color: Colors.white, size: 18),
                              label: Text(_isSubmittingPassword ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryBlueDark,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textHint, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.lock_outline_rounded, size: 16, color: AppColors.textHint),
          ],
        ),
      ),
    );
  }
}
