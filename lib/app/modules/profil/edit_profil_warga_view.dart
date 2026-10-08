import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/values/app_config.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import '../../core/utils/phone_formatter.dart';
import '../../core/widgets/profile_photo_cropper_view.dart';
import '../auth/controllers/auth_controller.dart';

class EditProfilWargaView extends ConsumerStatefulWidget {
  const EditProfilWargaView({super.key});

  @override
  ConsumerState<EditProfilWargaView> createState() => _EditProfilWargaViewState();
}

class _EditProfilWargaViewState extends ConsumerState<EditProfilWargaView> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;

  File? _profileImage;
  bool _isSaving = false;
  bool _isUploadingAvatar = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;

    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(
      text: PhoneFormatter.convertToLocalFormat(user?.phone ?? ''),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  bool _hasUnsavedChanges() {
    final user = ref.read(authProvider).user;
    if (user == null) return false;

    final initialName = user.name;
    final initialPhone = PhoneFormatter.convertToLocalFormat(user.phone);

    return _nameController.text.trim() != initialName ||
        _phoneController.text.trim() != initialPhone ||
        _profileImage != null;
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final user = ref.read(authProvider).user;
    if (user == null) return;

    setState(() => _isSaving = true);

    try {
      final name = _nameController.text.trim();
      final rawPhone = _phoneController.text.trim();

      final success = await ref.read(authProvider.notifier).updateProfile(
        name: name,
        phone: rawPhone,
      );

      if (!mounted) return;
      setState(() => _isSaving = false);

      if (success) {
        ref.read(authProvider.notifier).fetchProfile();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil Warga berhasil diperbarui!'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context, true);
      } else {
        final authState = ref.read(authProvider);
        final err = authState.errorMessage ?? authState.errorCode ?? 'Gagal menyimpan perubahan.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err.startsWith('Gagal') ? err : 'Gagal memperbarui profil: $err'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Terjadi kesalahan: $e'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    }
  }

  void _showAvatarOptions() {
    final user = ref.read(authProvider).user;
    final hasPhoto = (_profileImage != null) ||
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
                      'Foto Profil Warga',
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
          _profileImage = croppedFile;
          _isUploadingAvatar = true;
        });

        final success = await ref
            .read(authProvider.notifier)
            .uploadAvatar(croppedFile.path);

        if (mounted) {
          setState(() => _isUploadingAvatar = false);
          if (success) {
            ref.read(authProvider.notifier).fetchProfile();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Foto profil berhasil diperbarui!'),
                backgroundColor: AppColors.primaryGreen,
              ),
            );
          } else {
            final error =
                ref.read(authProvider).errorCode ?? 'Gagal mengunggah foto.';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Upload gagal: $error'),
                backgroundColor: AppColors.dangerRed,
              ),
            );
          }
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isUploadingAvatar = false);
    }
  }

  Future<void> _confirmDeletePhoto() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Foto Profil?'),
        content: const Text(
          'Foto profil Anda akan dihapus dan kembali ke inisial nama.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      setState(() => _isUploadingAvatar = true);
      final success = await ref.read(authProvider.notifier).deleteAvatar();
      if (mounted) {
        setState(() {
          _profileImage = null;
          _isUploadingAvatar = false;
        });
        if (success) {
          ref.read(authProvider.notifier).fetchProfile();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto profil berhasil dihapus!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        }
      }
    }
  }

  Widget _buildAvatar(String? fotoPath) {
    if (_profileImage != null) {
      return Image.file(_profileImage!, fit: BoxFit.cover);
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
        memCacheWidth: 200,
        memCacheHeight: 200,
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
        return Image.file(
          file,
          fit: BoxFit.cover,
          cacheWidth: 200,
          cacheHeight: 200,
        );
      }
    }

    return CachedNetworkImage(
      imageUrl: AppConfig.getImageUrl(fotoPath),
      memCacheWidth: 200,
      memCacheHeight: 200,
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
    final user = ref.watch(authProvider).user;

    return PopScope(
      canPop: !_hasUnsavedChanges(),
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldLeave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Batalkan Perubahan?'),
            content: const Text(
              'Ada perubahan profil yang belum disimpan. Apakah Anda yakin ingin kembali?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Tetap di Sini'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.dangerRed,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Tinggalkan'),
              ),
            ],
          ),
        );
        if (shouldLeave == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          title: const Text('Edit Profil Warga'),
          elevation: 0,
        ),
        body: SingleChildScrollView(
          child: Column(
            children: [
              // ─── Header Avatar ─────────────────────────────────────────
              Container(
                width: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _isUploadingAvatar ? null : _showAvatarOptions,
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            width: 104,
                            height: 104,
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
                              color: AppColors.backgroundCanvas,
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: _isUploadingAvatar
                                ? const Center(
                                    child: CircularProgressIndicator(
                                      color: AppColors.primaryGreen,
                                    ),
                                  )
                                : _buildAvatar(
                                    _profileImage?.path ?? user?.fotoProfil,
                                  ),
                          ),
                          Container(
                            width: 34,
                            height: 34,
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
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Ubah Foto Profil',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ─── Form Card: Data Profil Utama ───────────────────
                      _sectionTitle('DATA DIRI WARGA'),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Nama Lengkap Warga
                            _fieldLabel('Nama Lengkap *'),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _nameController,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              decoration: _inputDecoration(
                                hint: 'Masukkan nama lengkap warga',
                                prefixIcon: Icons.person_outline_rounded,
                              ),
                              validator: (val) {
                                if (val == null || val.trim().isEmpty) {
                                  return 'Nama lengkap warga wajib diisi';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Nama lengkap yang terdaftar pada sistem BERSEKA.',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // No. Telepon
                            _fieldLabel('No. Telepon (Login & WhatsApp) *'),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              decoration: _inputDecoration(
                                hint: '08xxxxxxxxxx / +628xxxxxxxxxx',
                                prefixIcon: Icons.phone_iphone_rounded,
                              ),
                              validator: (val) {
                                if (val == null || val.trim().isEmpty) {
                                  return 'Nomor telepon wajib diisi';
                                }
                                final clean = val.replaceAll(RegExp(r'[^\d]'), '');
                                if (clean.length < 9 || clean.length > 15) {
                                  return 'Nomor telepon harus antara 9-15 digit';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Nomor telepon digunakan untuk login dan menerima notifikasi WhatsApp.',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppDimensions.xl),

                      // ─── Tombol Simpan ─────────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _handleSave,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Simpan Profil Warga',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: AppColors.textSecondary,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _fieldLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontSize: 13,
        color: AppColors.textHint,
      ),
      prefixIcon: Icon(prefixIcon, color: AppColors.primaryGreen, size: 20),
      filled: true,
      fillColor: AppColors.backgroundCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.dangerRed),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.dangerRed, width: 1.5),
      ),
    );
  }
}
