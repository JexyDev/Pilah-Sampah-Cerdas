import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/petugas_residu_controller.dart';

class GantiPasswordPetugasView extends ConsumerStatefulWidget {
  const GantiPasswordPetugasView({super.key});

  @override
  ConsumerState<GantiPasswordPetugasView> createState() => _GantiPasswordPetugasViewState();
}

class _GantiPasswordPetugasViewState extends ConsumerState<GantiPasswordPetugasView> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submitGantiPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final success = await ref.read(petugasResiduControllerProvider.notifier).changePassword(
          oldPassword: _oldPasswordController.text.trim(),
          newPassword: _newPasswordController.text.trim(),
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Kata sandi Petugas Residu berhasil diperbarui!'),
          backgroundColor: AppColors.primaryGreen,
          duration: Duration(seconds: 3),
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      final errorMsg = ref.read(petugasResiduControllerProvider).errorMessage ??
          'Gagal mengubah kata sandi. Periksa kata sandi lama Anda.';
      ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Ganti Kata Sandi',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primaryGreen,
        elevation: 2,
        shadowColor: Colors.black12,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.primaryGreen),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card Info
              Container(
                padding: const EdgeInsets.all(AppDimensions.md),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.security_rounded, color: AppColors.primaryGreen, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Untuk keamanan akun Petugas Residu RT/RW, gunakan kata sandi yang kuat (minimal 6 karakter).',
                        style: TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // Form Input
              Card(
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. Password Saat Ini
                      const Text('Kata Sandi Saat Ini', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _oldPasswordController,
                        obscureText: _obscureOld,
                        decoration: InputDecoration(
                          hintText: 'Masukkan kata sandi lama',
                          prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primaryGreen),
                          suffixIcon: IconButton(
                            icon: Icon(_obscureOld ? Icons.visibility_off : Icons.visibility, color: AppColors.textHint),
                            onPressed: () => setState(() => _obscureOld = !_obscureOld),
                          ),
                        ),
                        validator: (v) => (v == null || v.isEmpty) ? 'Kata sandi lama wajib diisi' : null,
                      ),
                      const SizedBox(height: 16),

                      // 2. Password Baru
                      const Text('Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _newPasswordController,
                        obscureText: _obscureNew,
                        decoration: InputDecoration(
                          hintText: 'Masukkan kata sandi baru',
                          prefixIcon: const Icon(Icons.key_outlined, color: AppColors.primaryGreen),
                          suffixIcon: IconButton(
                            icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility, color: AppColors.textHint),
                            onPressed: () => setState(() => _obscureNew = !_obscureNew),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Kata sandi baru wajib diisi';
                          if (v.length < 6) return 'Kata sandi minimal 6 karakter';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // 3. Konfirmasi Password Baru
                      const Text('Konfirmasi Kata Sandi Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirm,
                        decoration: InputDecoration(
                          hintText: 'Ulangi kata sandi baru',
                          prefixIcon: const Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryGreen),
                          suffixIcon: IconButton(
                            icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility, color: AppColors.textHint),
                            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Konfirmasi kata sandi wajib diisi';
                          if (v != _newPasswordController.text) return 'Konfirmasi kata sandi tidak cocok';
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppDimensions.xl),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitGantiPassword,
                  icon: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.save_rounded, color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Memperbarui...' : 'Simpan Kata Sandi Baru',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
