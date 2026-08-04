import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';

/// Layar login — nomor telepon + password.
class LoginView extends ConsumerStatefulWidget {
  const LoginView({super.key});

  @override
  ConsumerState<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends ConsumerState<LoginView> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  // Custom Toast State
  String? _toastMessage;
  bool _isToastVisible = false;
  Timer? _toastTimer;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _toastTimer?.cancel();
    super.dispose();
  }

  void _showToast(String message) {
    _toastTimer?.cancel();
    setState(() {
      _toastMessage = message;
      _isToastVisible = true;
    });
    _toastTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) setState(() => _isToastVisible = false);
    });
  }

  String _normalizeIdentifier(String raw) {
    String input = raw.trim().replaceAll(RegExp(r'[\s\-]'), '');
    final digitsOnly = input.replaceAll(RegExp(r'[^\d]'), '');
    if (digitsOnly.length >= 10 &&
        (input.startsWith('0') ||
            input.startsWith('8') ||
            input.startsWith('+62') ||
            input.startsWith('62'))) {
      if (!input.startsWith('0') && input.startsWith('8')) input = '0$input';
    }
    return input;
  }

  Future<void> _onLogin() async {
    final identifier = _phoneController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty && password.isEmpty) {
      _showToast('Nomor telepon/NIM dan kata sandi wajib diisi');
      _formKey.currentState!.validate();
      return;
    }
    if (identifier.isEmpty) {
      _showToast('Nomor telepon/NIM wajib diisi');
      _formKey.currentState!.validate();
      return;
    }
    if (password.isEmpty) {
      _showToast('Kata sandi wajib diisi');
      _formKey.currentState!.validate();
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final normalized = _normalizeIdentifier(identifier);
    ref.read(authProvider.notifier).clearError();

    final bool ok = await ref.read(authProvider.notifier).login(
          phone: normalized,
          password: password,
        );

    if (ok && mounted) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.main);
    } else if (mounted) {
      final authState = ref.read(authProvider);
      String errorText = 'Nomor telepon/NIM atau kata sandi salah. Coba lagi.';
      if (authState.errorCode == 'NETWORK_ERROR') {
        errorText = 'Tidak dapat terhubung ke server. Periksa koneksi.';
      } else if (authState.errorCode == 'UNAPPROVED_ACCOUNT') {
        errorText =
            'Akun Anda sedang menunggu persetujuan Admin DLH. Silakan coba login kembali nanti.';
      } else if (authState.errorCode == 'SERVER_ERROR' ||
          authState.errorCode == 'INTERNAL_SERVER_ERROR') {
        errorText =
            'Server sedang mengalami gangguan sementara, silakan coba beberapa saat lagi.';
      }
      _showToast(errorText);
      _passwordController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.white, Color(0xFFF0F9FF)],
          ),
        ),
        child: Stack(
          children: [
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo & Judul
                      Column(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Image.asset(AppAssets.logo, fit: BoxFit.cover),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'TrashCare',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryGreen,
                              letterSpacing: -0.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Kecamatan Coblong, Kota Bandung',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Card Form Putih
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFECEEF1)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Masuk Sistem',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Masukkan nomor HP atau NIM terdaftar Anda',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Field No. Telepon / NIM
                              const Text(
                                'NOMOR TELEPON / NIM',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _phoneController,
                                keyboardType: TextInputType.text,
                                autocorrect: false,
                                textInputAction: TextInputAction.next,
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                    RegExp(r'[0-9a-zA-Z\+\-\s]'),
                                  ),
                                ],
                                decoration: const InputDecoration(
                                  hintText: '081234567890 atau NIM Anda',
                                  prefixIcon: Icon(
                                    Icons.person_outline_rounded,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nomor telepon atau NIM wajib diisi';
                                  }
                                  final clean = v.trim();
                                  final digits = clean.replaceAll(RegExp(r'[^\d]'), '');
                                  if (digits.length >= 10 && digits.length <= 13) {
                                    return null; // Phone number valid
                                  }
                                  if (clean.length >= 8 && clean.length <= 10) {
                                    return null; // NIM valid
                                  }
                                  return 'Format tidak valid (12 digit No. HP atau 8-10 digit NIM)';
                                },
                              ),
                              const SizedBox(height: 18),

                              // Field Password
                              const Text(
                                'KATA SANDI',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _onLogin(),
                                decoration: InputDecoration(
                                  hintText: 'Masukkan kata sandi...',
                                  prefixIcon: const Icon(
                                    Icons.lock_outline_rounded,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword
                                          ? Icons.visibility_outlined
                                          : Icons.visibility_off_outlined,
                                      color: AppColors.textSecondary,
                                      size: 20,
                                    ),
                                    onPressed: () => setState(
                                      () => _obscurePassword = !_obscurePassword,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Password wajib diisi';
                                  }
                                  if (v.length < 6) {
                                    return 'Password minimal 6 karakter';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 8),

                              // Lupa sandi
                              Align(
                                alignment: Alignment.centerRight,
                                child: GestureDetector(
                                  onTap: () => Navigator.of(context)
                                      .pushNamed(AppRoutes.forgotPassword),
                                  child: const Text(
                                    'Lupa kata sandi?',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primaryGreen,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Tombol Masuk
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: authState.isLoading ? null : _onLogin,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryGreen,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 2,
                                    shadowColor: AppColors.primaryGreen.withValues(alpha: 0.3),
                                  ),
                                  child: authState.isLoading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.login_rounded, size: 20),
                                            SizedBox(width: 8),
                                            Text(
                                              'MASUK SISTEM',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Daftar
                              Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'Belum memiliki akun? ',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => Navigator.of(context)
                                          .pushNamed(AppRoutes.register),
                                      child: const Text(
                                        'Daftar',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      const Opacity(
                        opacity: 0.6,
                        child: Text(
                          '© 2026 TrashCare. All rights reserved.',
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Toast
            if (_isToastVisible && _toastMessage != null)
              SafeArea(
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFECEEF1)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.error_outline_rounded,
                            color: AppColors.dangerRed,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(
                              _toastMessage!,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          GestureDetector(
                            onTap: () => setState(() => _isToastVisible = false),
                            child: const Icon(
                              Icons.close_rounded,
                              size: 16,
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
