import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../../../core/utils/input_sanitizer.dart';

class EditProfilMahasiswaView extends ConsumerStatefulWidget {
  const EditProfilMahasiswaView({super.key});

  @override
  ConsumerState<EditProfilMahasiswaView> createState() => _EditProfilMahasiswaViewState();
}

class _EditProfilMahasiswaViewState extends ConsumerState<EditProfilMahasiswaView> {
  final _formKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;

  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  bool _isSubmittingProfile = false;
  bool _isSubmittingPassword = false;
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isPasswordSectionExpanded = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _addressController = TextEditingController(text: user?.address ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
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
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil diperbarui!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gagal mengunggah foto profil.'),
              backgroundColor: AppColors.dangerRed,
            ),
          );
        }
      }
    }
  }

  Future<void> _submitSaveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmittingProfile = true);

    final name = InputSanitizer.sanitize(_nameController.text);
    final phone = InputSanitizer.sanitize(_phoneController.text);
    final address = InputSanitizer.sanitize(_addressController.text);

    if (name.isEmpty || phone.isEmpty || address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Field tidak boleh hanya berisi spasi/kosong.'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      setState(() => _isSubmittingProfile = false);
      return;
    }

    // Call auth notifier to update profile
    final success = await ref.read(authProvider.notifier).updateProfile(
          name: name,
          phone: phone,
          address: address,
        );

    setState(() => _isSubmittingProfile = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil Mahasiswa berhasil diperbarui!'),
            backgroundColor: AppColors.primaryGreen,
            duration: Duration(seconds: 3),
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal memperbarui profil.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
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
        ScaffoldMessenger.of(context).showSnackBar(
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

    final userNim = user?.nim.isNotEmpty == true ? user!.nim : (mhsData?.nim.isNotEmpty == true ? mhsData!.nim : '1301210042');
    final userProdi = user?.prodi.isNotEmpty == true ? user!.prodi : (user?.jurusan.isNotEmpty == true ? user!.jurusan : (mhsData?.jurusan.isNotEmpty == true ? mhsData!.jurusan : 'S1 Teknik Informatika'));
    final userFakultas = user?.fakultas.isNotEmpty == true ? user!.fakultas : 'Fakultas Informatika';
    final userUniversitas = user?.universitas.isNotEmpty == true ? user!.universitas : 'Telkom University';
    final kelurahan = user?.kelurahan.isNotEmpty == true ? user!.kelurahan : 'Bojongsoang';
    final rtRw = user?.rtRw.isNotEmpty == true ? user!.rtRw : '01/02';

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
                    user?.name ?? 'Mahasiswa KKN',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  if (userNim.isNotEmpty)
                    Text(
                      'NIM: $userNim',
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
                  _buildReadOnlyField('Universitas', userUniversitas.isNotEmpty ? userUniversitas : '-'),
                  _buildReadOnlyField('Fakultas', userFakultas.isNotEmpty ? userFakultas : '-'),
                  _buildReadOnlyField('Program Studi (Prodi)', userProdi.isNotEmpty ? userProdi : '-'),
                  _buildReadOnlyField('Kelurahan Dampingan', kelurahan.isNotEmpty ? kelurahan : '-'),
                  _buildReadOnlyField('RT / RW Dampingan', rtRw.isNotEmpty ? rtRw : '-'),
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

            // ── 3. Editable Personal Info Section ─────────────────────
            Form(
              key: _formKey,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.edit_note_rounded, color: AppColors.primaryGreen, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'INFORMASI KONTAK EDITABLE',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text('Nama Lengkap / Display Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.primaryGreen),
                        hintText: 'Masukkan nama lengkap',
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama lengkap wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),
                    const Text('Nomor WhatsApp / No. Telepon', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.phone_iphone_rounded, color: AppColors.primaryGreen),
                        hintText: 'Masukkan nomor WhatsApp',
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Nomor telepon wajib diisi' : null,
                    ),

                  ],
                ),
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // ── 4. Embedded Submenu Ganti Password ────────────────────
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
                              hintText: 'Password lama',
                              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textSecondary),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureOld ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureOld = !_obscureOld),
                              ),
                            ),
                            validator: (v) => (v == null || v.isEmpty) ? 'Kata sandi lama wajib diisi' : null,
                          ),
                          const SizedBox(height: 12),
                          const Text('Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _newPasswordController,
                            obscureText: _obscureNew,
                            decoration: InputDecoration(
                              hintText: 'Password baru (min. 6 karakter)',
                              prefixIcon: const Icon(Icons.key_outlined, color: AppColors.textSecondary),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureNew = !_obscureNew),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Kata sandi baru wajib diisi';
                              if (v.length < 6) return 'Kata sandi minimal 6 karakter';
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          const Text('Konfirmasi Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: _obscureConfirm,
                            decoration: InputDecoration(
                              hintText: 'Ulangi password baru',
                              prefixIcon: const Icon(Icons.check_circle_outline_rounded, color: AppColors.textSecondary),
                              suffixIcon: IconButton(
                                icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Konfirmasi kata sandi wajib diisi';
                              if (v != _newPasswordController.text) return 'Konfirmasi kata sandi tidak cocok';
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
            const SizedBox(height: AppDimensions.xl),

            // ── 5. Main Submit Save Profile Button ─────────────────────
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmittingProfile ? null : _submitSaveProfile,
                icon: _isSubmittingProfile
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_rounded, color: Colors.white),
                label: Text(
                  _isSubmittingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
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
