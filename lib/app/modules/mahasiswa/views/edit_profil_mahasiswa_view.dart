import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../core/utils/phone_formatter.dart';
import '../../../core/widgets/profile_photo_cropper_view.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_controller.dart';

class EditProfilMahasiswaView extends ConsumerStatefulWidget {
  const EditProfilMahasiswaView({super.key});

  @override
  ConsumerState<EditProfilMahasiswaView> createState() =>
      _EditProfilMahasiswaViewState();
}

class _EditProfilMahasiswaViewState
    extends ConsumerState<EditProfilMahasiswaView> {
  final _passwordFormKey = GlobalKey<FormState>();

  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  bool _isSubmittingPassword = false;
  final _profileFormKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isSubmittingProfile = false;

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isPasswordSectionExpanded = false;

  bool _isLength8 = false;
  bool _hasUpper = false;
  bool _hasLower = false;
  bool _hasDigit = false;
  bool _hasSpecial = false;

  void _checkPassword(String value) {
    setState(() {
      _isLength8 = value.length >= 8;
      _hasUpper = value.contains(RegExp(r'[A-Z]'));
      _hasLower = value.contains(RegExp(r'[a-z]'));
      _hasDigit = value.contains(RegExp(r'[0-9]'));
      _hasSpecial = value.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>\-\_]'));
    });
  }

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController.text = user?.name ?? '';
    final rawPhone = user?.phone ?? '';
    _phoneController.text = PhoneFormatter.convertToLocalFormat(rawPhone);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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
          _showPopup('Foto profil berhasil diperbarui!', true);
        } else {
          final error =
              ref.read(authProvider).errorCode ?? 'Gagal mengunggah foto profil.';
          _showPopup('Upload gagal: $error', false);
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
      final success = await ref.read(authProvider.notifier).deleteAvatar();
      if (mounted) {
        if (success) {
          setState(() => _profileImage = null);
          ref.read(authProvider.notifier).fetchProfile();
          _showPopup('Foto profil berhasil dihapus!', true);
        } else {
          _showPopup('Gagal menghapus foto profil.', false);
        }
      }
    }
  }

  Widget _buildAvatarImage(String? fotoPath, String name) {
    if (_profileImage != null) {
      return Image.file(_profileImage!, fit: BoxFit.cover);
    }
    if (fotoPath == null || fotoPath.isEmpty) {
      return Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'M',
          style: const TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Center(
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : 'M',
            style: const TextStyle(
              fontSize: 40,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryGreen,
            ),
          ),
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
      errorWidget: (_, __, ___) => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'M',
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
      ),
    );
  }

  Future<void> _submitChangePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    int fulfilled = 0;
    if (_isLength8) fulfilled++;
    if (_hasUpper) fulfilled++;
    if (_hasLower) fulfilled++;
    if (_hasDigit) fulfilled++;
    if (_hasSpecial) fulfilled++;

    if (fulfilled < 3) {
      _showPopup('Kata sandi terlalu lemah. Penuhi kriteria minimal.', false);
      return;
    }

    setState(() => _isSubmittingPassword = true);

    final oldPassword = _oldPasswordController.text;
    final newPassword = _newPasswordController.text;

    final success = await ref
        .read(authProvider.notifier)
        .changePassword(oldPassword: oldPassword, newPassword: newPassword);

    setState(() => _isSubmittingPassword = false);

    if (mounted) {
      if (success) {
        _showPopup('Kata sandi berhasil diperbarui!', true);
        _oldPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        setState(() => _isPasswordSectionExpanded = false);
      } else {
        _showPopup(
          'Gagal mengubah kata sandi. Periksa kata sandi lama Anda.',
          false,
        );
      }
    }
  }

  void _showPopup(String message, bool isSuccess) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text(
            isSuccess ? 'Berhasil' : 'Gagal',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isSuccess ? AppColors.primaryGreen : AppColors.dangerRed,
            ),
          ),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'OK',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _submitProfile() async {
    if (!_profileFormKey.currentState!.validate()) return;
    setState(() => _isSubmittingProfile = true);

    final success = await ref
        .read(authProvider.notifier)
        .updateProfile(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
        );

    setState(() => _isSubmittingProfile = false);
    if (mounted) {
      if (success) {
        _showPopup('Profil berhasil diperbarui!', true);
      } else {
        _showPopup('Gagal memperbarui profil.', false);
      }
    }
  }

  bool _hasUnsavedChanges() {
    final user = ref.read(authProvider).user;
    final isNameChanged = _nameController.text != (user?.name ?? '');
    final isPhoneChanged = _phoneController.text != (user?.phone ?? '');
    final isImageChanged = _profileImage != null;
    final isPasswordFieldsFilled =
        _oldPasswordController.text.isNotEmpty ||
        _newPasswordController.text.isNotEmpty ||
        _confirmPasswordController.text.isNotEmpty;

    return isNameChanged ||
        isPhoneChanged ||
        isImageChanged ||
        isPasswordFieldsFilled;
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final mhsData = ref.watch(mahasiswaControllerProvider).dashboard;

    final userNim = user?.nim.isNotEmpty == true
        ? user!.nim
        : (mhsData?.nim.isNotEmpty == true ? mhsData!.nim : '-');
    final userProdi = user?.prodi.isNotEmpty == true
        ? user!.prodi
        : (user?.jurusan.isNotEmpty == true
              ? user!.jurusan
              : (mhsData?.jurusan.isNotEmpty == true ? mhsData!.jurusan : '-'));
    final kelurahan = user?.kelurahan.isNotEmpty == true
        ? user!.kelurahan
              .replaceAll(
                RegExp(r'^(?:Kel\.|Kelurahan|Desa)\s+', caseSensitive: false),
                '',
              )
              .trim()
        : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        if (!_hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'Keluar Halaman?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Perubahan ini akan terhapus jika Anda keluar dari halaman ini.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Batal',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
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
        appBar: AppBar(
          title: const Text(
            'Edit Profil Mahasiswa',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 18,
              color: AppColors.textPrimary,
            ),
          ),
          backgroundColor: Colors.white,
          shadowColor: Colors.black12,
          surfaceTintColor: Colors.transparent,
          foregroundColor: Colors.white,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(AppDimensions.md),
          child: Column(
            children: [
              // ── 1. Avatar Upload Card ────────────────────────────────
              Container(
                width: double.infinity,
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
                                  color: Colors.black.withValues(alpha: 0.08),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                              color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: _buildAvatarImage(
                              user?.fotoProfil,
                              user?.name ?? 'Mahasiswa',
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
                                  color: AppColors.primaryGreen.withValues(alpha: 0.35),
                                  blurRadius: 4,
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
                    const SizedBox(height: 12),
                    Text(
                      user?.name ?? '-',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primaryGreen.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Text(
                        user?.kelompokName.isNotEmpty == true
                            ? 'MAHASISWA KKN • ${user!.kelompokName}'
                            : (rw != '-'
                                ? (kelurahan != '-'
                                    ? 'MAHASISWA KKN • RW $rw, KEL. $kelurahan'
                                    : 'MAHASISWA KKN • RW $rw')
                                : 'MAHASISWA KKN'),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryGreen,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    if (userNim.isNotEmpty && userNim != '-') ...[
                      const SizedBox(height: 6),
                      Text(
                        userProdi.isNotEmpty && userProdi != '-'
                            ? 'NIM: $userNim • $userProdi'
                            : 'NIM: $userNim',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // ── Form Edit Profil ─────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Form(
                  key: _profileFormKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(
                            Icons.person_outline_rounded,
                            color: AppColors.primaryGreen,
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'DATA PRIBADI',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: 'Nama Lengkap',
                          labelStyle: const TextStyle(
                            color: AppColors.textHint,
                            fontSize: 13,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
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
                            ),
                          ),
                        ),
                        validator: (val) => val == null || val.isEmpty
                            ? 'Nama wajib diisi'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: 'Nomor WhatsApp',
                          labelStyle: const TextStyle(
                            color: AppColors.textHint,
                            fontSize: 13,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
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
                            ),
                          ),
                        ),
                        validator: (val) => val == null || val.isEmpty
                            ? 'Nomor WA wajib diisi'
                            : null,
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          onPressed: _isSubmittingProfile
                              ? null
                              : _submitProfile,
                          child: _isSubmittingProfile
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'Simpan Profil',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
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
                        Icon(
                          Icons.lock_outline_rounded,
                          color: AppColors.textHint,
                          size: 18,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'DATA AKADEMIK & PENUGASAN (READ-ONLY)',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildReadOnlyField(
                      'NIM',
                      userNim.isNotEmpty ? userNim : '-',
                    ),
                    _buildReadOnlyField(
                      'Program Studi',
                      userProdi.isNotEmpty ? userProdi : '-',
                    ),
                    _buildReadOnlyField(
                      'Jenjang Studi',
                      (user?.jenjangPendidikan != null &&
                              user!.jenjangPendidikan.isNotEmpty)
                          ? user.jenjangPendidikan
                          : '-',
                    ),

                    _buildReadOnlyField(
                      'Kelurahan Dampingan',
                      kelurahan.isNotEmpty ? kelurahan : '-',
                    ),
                    _buildReadOnlyField(
                      'RW Dampingan',
                      rw.isNotEmpty ? rw : '-',
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            color: AppColors.textSecondary,
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Data akademik & wilayah penugasan bersifat resmi. Perubahan data wajib diajukan melalui Admin KKN / DPL.',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                height: 1.3,
                              ),
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
                  shape: const Border(),
                  collapsedShape: const Border(),
                  initiallyExpanded: _isPasswordSectionExpanded,
                  onExpansionChanged: (exp) =>
                      setState(() => _isPasswordSectionExpanded = exp),
                  leading: const Icon(
                    Icons.lock_reset_rounded,
                    color: AppColors.primaryGreen,
                  ),
                  title: const Text(
                    'Ganti Kata Sandi',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  subtitle: const Text(
                    'Kelola keamanan kata sandi akun',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Form(
                        key: _passwordFormKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Kata Sandi Saat Ini',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _oldPasswordController,
                              obscureText: _obscureOld,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(
                                  Icons.lock_outline_rounded,
                                  color: AppColors.primaryGreen,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscureOld
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: AppColors.textHint,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscureOld = !_obscureOld,
                                  ),
                                ),
                                hintText: 'Masukkan kata sandi lama',
                              ),
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Wajib diisi'
                                  : null,
                            ),
                            const SizedBox(height: 14),
                            const Text(
                              'Kata Sandi Baru',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _newPasswordController,
                              obscureText: _obscureNew,
                              onChanged: _checkPassword,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(
                                  Icons.lock_rounded,
                                  color: AppColors.primaryGreen,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscureNew
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: AppColors.textHint,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscureNew = !_obscureNew,
                                  ),
                                ),
                                hintText: 'Minimal 6 karakter',
                              ),
                              validator: (v) => (v != null && v.length < 6)
                                  ? 'Minimal 6 karakter'
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            _buildPasswordStrength(),
                            const SizedBox(height: 14),
                            const Text(
                              'Konfirmasi Kata Sandi Baru',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _confirmPasswordController,
                              obscureText: _obscureConfirm,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(
                                  Icons.lock_rounded,
                                  color: AppColors.primaryGreen,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscureConfirm
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: AppColors.textHint,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscureConfirm = !_obscureConfirm,
                                  ),
                                ),
                                hintText: 'Ketik ulang kata sandi baru',
                              ),
                              validator: (v) {
                                if (v == null || v.trim().isEmpty) {
                                  return 'Wajib diisi';
                                }
                                if (v != _newPasswordController.text) {
                                  return 'Kata sandi tidak cocok';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 46,
                              child: ElevatedButton.icon(
                                onPressed: _isSubmittingPassword
                                    ? null
                                    : _submitChangePassword,
                                icon: _isSubmittingPassword
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.save_rounded,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                label: Text(
                                  _isSubmittingPassword
                                      ? 'Memperbarui...'
                                      : 'Simpan Kata Sandi Baru',
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryGreen,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
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
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textHint,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.lock_outline_rounded,
              size: 16,
              color: AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordStrength() {
    int fulfilled = 0;
    if (_isLength8) fulfilled++;
    if (_hasUpper) fulfilled++;
    if (_hasLower) fulfilled++;
    if (_hasDigit) fulfilled++;
    if (_hasSpecial) fulfilled++;

    String text = 'Sangat Lemah';
    Color color = Colors.red;
    int segmentsActive = 0;

    if (fulfilled == 0) {
      text = '';
      segmentsActive = 0;
    } else if (fulfilled <= 2) {
      text = 'Lemah';
      color = Colors.red;
      segmentsActive = 1;
    } else if (fulfilled == 3) {
      text = 'Sedang';
      color = Colors.orange;
      segmentsActive = 2;
    } else if (fulfilled == 4) {
      text = 'Kuat';
      color = Colors.blue;
      segmentsActive = 3;
    } else {
      text = 'Sangat Kuat';
      color = AppColors.primaryGreen;
      segmentsActive = 4;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (fulfilled > 0) ...[
          Row(
            children: List.generate(4, (index) {
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: index < segmentsActive
                        ? color
                        : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
        ],
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blueGrey.shade50.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildReqItem('Minimal 8 karakter', _isLength8),
              const SizedBox(height: 8),
              _buildReqItem('Mengandung huruf besar (A-Z)', _hasUpper),
              const SizedBox(height: 8),
              _buildReqItem('Mengandung huruf kecil (a-z)', _hasLower),
              const SizedBox(height: 8),
              _buildReqItem('Mengandung angka (0-9)', _hasDigit),
              const SizedBox(height: 8),
              _buildReqItem(
                'Mengandung karakter khusus (!@#\$...)',
                _hasSpecial,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReqItem(String text, bool met) {
    return Row(
      children: [
        Icon(
          met ? Icons.check_circle : Icons.cancel,
          size: 16,
          color: met ? AppColors.primaryGreen : Colors.grey.shade400,
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: met ? AppColors.primaryGreen : Colors.grey.shade600,
            fontWeight: met ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
