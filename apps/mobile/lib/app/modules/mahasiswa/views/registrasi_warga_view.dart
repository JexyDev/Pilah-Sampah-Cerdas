import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../controllers/registrasi_warga_controller.dart';

class RegistrasiWargaView extends ConsumerStatefulWidget {
  const RegistrasiWargaView({super.key});

  @override
  ConsumerState<RegistrasiWargaView> createState() => _RegistrasiWargaViewState();
}

class _RegistrasiWargaViewState extends ConsumerState<RegistrasiWargaView> {
  final _formKey = GlobalKey<FormState>();

  // Form controllers
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _alamatCtrl = TextEditingController();
  final _rtCtrl = TextEditingController();
  final _rwCtrl = TextEditingController();
  final _kelurahanCtrl = TextEditingController();

  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _alamatCtrl.dispose();
    _rtCtrl.dispose();
    _rwCtrl.dispose();
    _kelurahanCtrl.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (!_formKey.currentState!.validate()) return;

    final rtRw = '${_rtCtrl.text.trim()}/${_rwCtrl.text.trim()}';

    final request = RegisterWargaRequest(
      phone: _phoneCtrl.text.trim(),
      password: _passwordCtrl.text,
      name: _nameCtrl.text.trim(),
      rtRw: rtRw.length > 1 ? rtRw : null,
      kelurahan: _kelurahanCtrl.text.trim().isNotEmpty
          ? _kelurahanCtrl.text.trim()
          : null,
    );

    ref.read(registrasiWargaControllerProvider.notifier).submitRegistrasi(request);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(registrasiWargaControllerProvider);

    // Tampilkan dialog sukses
    ref.listen<RegistrasiWargaState>(registrasiWargaControllerProvider,
        (prev, next) {
      if (next.isSuccess && !(prev?.isSuccess ?? false)) {
        _showSuccessDialog();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Registrasi Warga',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header card
              Container(
                padding: const EdgeInsets.all(AppDimensions.md),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryGreen.withValues(alpha: 0.08),
                      AppColors.primaryGreen.withValues(alpha: 0.03),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                  border: Border.all(
                    color: AppColors.primaryGreen.withValues(alpha: 0.2),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Daftarkan warga yang belum bisa menggunakan aplikasi. '
                        'Data warga akan otomatis terhubung dengan akun Anda.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // ── Data Utama ──────────────────────────────────────
              const _SectionLabel(label: 'Data Utama'),
              const SizedBox(height: AppDimensions.sm),

              _buildField(
                controller: _nameCtrl,
                label: 'Nama Lengkap',
                hint: 'Masukkan nama lengkap warga',
                icon: Icons.person_outline_rounded,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Nama wajib diisi';
                  if (v.trim().length < 3) return 'Nama minimal 3 karakter';
                  return null;
                },
              ),
              const SizedBox(height: AppDimensions.md),

              _buildField(
                controller: _phoneCtrl,
                label: 'Nomor HP / WhatsApp',
                hint: '08xxxxxxxxxx',
                icon: Icons.phone_android_rounded,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(15),
                ],
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Nomor HP wajib diisi';
                  if (v.trim().length < 10) return 'Nomor HP minimal 10 digit';
                  return null;
                },
              ),
              const SizedBox(height: AppDimensions.md),

              _buildField(
                controller: _passwordCtrl,
                label: 'Password Akun Warga',
                hint: 'Minimal 6 karakter',
                icon: Icons.lock_outline_rounded,
                obscureText: _obscurePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                    color: AppColors.textHint,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Password wajib diisi';
                  if (v.length < 6) return 'Password minimal 6 karakter';
                  return null;
                },
              ),

              const SizedBox(height: AppDimensions.lg),

              // ── Alamat ────────────────────────────────────────
              const _SectionLabel(label: 'Alamat'),
              const SizedBox(height: AppDimensions.sm),

              _buildField(
                controller: _alamatCtrl,
                label: 'Alamat Lengkap',
                hint: 'Jalan, No. Rumah',
                icon: Icons.home_outlined,
                maxLines: 2,
              ),
              const SizedBox(height: AppDimensions.md),

              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      controller: _rtCtrl,
                      label: 'RT',
                      hint: '001',
                      icon: Icons.tag_rounded,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(3),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppDimensions.sm),
                  Expanded(
                    child: _buildField(
                      controller: _rwCtrl,
                      label: 'RW',
                      hint: '001',
                      icon: Icons.tag_rounded,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(3),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppDimensions.md),

              _buildField(
                controller: _kelurahanCtrl,
                label: 'Kelurahan',
                hint: 'Nama kelurahan',
                icon: Icons.location_city_rounded,
              ),

              const SizedBox(height: AppDimensions.xl),

              // ── Error Message ───────────────────────────────────
              if (state.errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerRed.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
                    border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.dangerRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          state.errorMessage!,
                          style: const TextStyle(
                            color: AppColors.dangerRed,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppDimensions.md),
              ],

              // ── Submit Button ──────────────────────────────────
              SizedBox(
                height: AppDimensions.buttonHeight,
                child: ElevatedButton(
                  onPressed: state.isSubmitting ? null : _onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.primaryGreen.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                    ),
                    elevation: 0,
                  ),
                  child: state.isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_add_rounded, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Daftarkan Warga',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: AppDimensions.lg),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Reusable Field Builder
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    String? hint,
    IconData? icon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    bool obscureText = false,
    Widget? suffixIcon,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      obscureText: obscureText,
      maxLines: maxLines,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null
            ? Icon(icon, color: AppColors.textHint, size: 20)
            : null,
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          borderSide: const BorderSide(color: AppColors.dangerRed),
        ),
        labelStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Success Dialog
  // ═══════════════════════════════════════════════════════════════════════════

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusLg),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppColors.success,
                size: 56,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Registrasi Berhasil!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Warga telah berhasil didaftarkan dan otomatis terhubung dengan akun Anda.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                ref.read(registrasiWargaControllerProvider.notifier).reset();
                Navigator.of(context).pop(); // Kembali ke dashboard
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text(
                'Kembali ke Dashboard',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section Label
// ═══════════════════════════════════════════════════════════════════════════════

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.primaryGreen,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
