import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/utils/input_sanitizer.dart';
import '../../../core/utils/phone_formatter.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/widgets/password_strength_widget.dart';

/// Layar registrasi Warga baru — nomor telepon, nama, dan password.
/// Tampilan diselaraskan dengan LoginView (Card Putih, Logo BERSEKA.ID, dan Tema Bersih).
class RegisterView extends ConsumerStatefulWidget {
  const RegisterView({super.key});

  @override
  ConsumerState<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends ConsumerState<RegisterView> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  // Custom Toast State
  String? _toastMessage;
  bool _isToastVisible = false;
  Timer? _toastTimer;
  String _version = '';

  @override
  void initState() {
    super.initState();
    _initPackageInfo();
    _phoneController.addListener(_onPhoneChanged);
  }

  Future<void> _initPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() {
        _version = 'Versi ${info.version}';
      });
    }
  }

  void _onPhoneChanged() {
    String text = _phoneController.text;
    String clean = text.replaceAll(RegExp(r'[^\d]'), '');
    bool changed = false;

    if (clean.startsWith('08')) {
      clean = clean.substring(1);
      changed = true;
    } else if (clean.startsWith('628')) {
      clean = clean.substring(2);
      changed = true;
    }

    if (text != clean || changed) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _phoneController.value = TextEditingValue(
          text: clean,
          selection: TextSelection.collapsed(offset: clean.length),
        );
      });
    } else {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _toastTimer?.cancel();
    super.dispose();
  }

  void _showToast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    setState(() {
      _toastMessage = message;
      _isToastVisible = true;
    });
    _toastTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) setState(() => _isToastVisible = false);
    });
  }

  Future<void> _onRegister() async {
    final name = InputSanitizer.sanitize(_nameController.text);
    final phone = InputSanitizer.sanitize(_phoneController.text);
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty && phone.isEmpty && password.isEmpty) {
      _showToast('Silakan lengkapi formulir pendaftaran');
      _formKey.currentState?.validate();
      return;
    }
    if (name.isEmpty) {
      _showToast('Nama lengkap wajib diisi');
      _formKey.currentState?.validate();
      return;
    }
    if (phone.isEmpty) {
      _showToast('Nomor telepon wajib diisi');
      _formKey.currentState?.validate();
      return;
    }
    if (password.isEmpty) {
      _showToast('Kata sandi wajib diisi');
      _formKey.currentState?.validate();
      return;
    }
    if (password.length < 8) {
      _showToast('Kata sandi minimal 8 karakter');
      _formKey.currentState?.validate();
      return;
    }
    if (confirmPassword.isEmpty) {
      _showToast('Konfirmasi kata sandi wajib diisi');
      _formKey.currentState?.validate();
      return;
    }
    if (password != confirmPassword) {
      _showToast('Konfirmasi kata sandi tidak cocok');
      _formKey.currentState?.validate();
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final normalizedPhone = PhoneFormatter.prepareLoginPhoneInput(phone);
    final data = {
      'nama': name,
      'name': name,
      'phone': normalizedPhone,
      'noWa': normalizedPhone,
      'password': password,
    };

    ref.read(authProvider.notifier).clearError();
    final bool ok = await ref.read(authProvider.notifier).register(
      role: 'Warga',
      data: data,
    );

    if (ok && mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.main,
        (route) => false,
      );
    } else if (mounted) {
      final authState = ref.read(authProvider);
      String errorText = 'Registrasi gagal. Silakan coba lagi.';
      if (authState.errorCode == 'CONFLICT') {
        errorText = 'Nomor telepon sudah terdaftar di sistem.';
      } else if (authState.errorCode == 'VALIDATION_ERROR') {
        errorText =
            authState.errorMessage ?? 'Format data pendaftaran tidak valid.';
      } else if (authState.errorCode == 'NETWORK_ERROR') {
        errorText = 'Tidak dapat terhubung ke server. Periksa koneksi.';
      } else if (authState.errorMessage != null &&
          authState.errorMessage!.isNotEmpty) {
        errorText = authState.errorMessage!;
      }
      _showToast(errorText);
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo & Judul
                      Column(
                        children: [
                          Image.asset(
                            AppAssets.logo,
                            height: 100,
                            fit: BoxFit.contain,
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
                                'Buat Akun',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Daftarkan nomor telepon Anda untuk mulai',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Field Nama Lengkap
                              const Text(
                                'NAMA LENGKAP',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _nameController,
                                textCapitalization: TextCapitalization.words,
                                autocorrect: false,
                                textInputAction: TextInputAction.next,
                                decoration: const InputDecoration(
                                  hintText: 'Nama lengkap Anda...',
                                  prefixIcon: Icon(
                                    Icons.person_outline_rounded,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nama lengkap wajib diisi';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),

                              // Field No. Telepon
                              const Text(
                                'NOMOR TELEPON',
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
                                keyboardType: TextInputType.number,
                                autocorrect: false,
                                textInputAction: TextInputAction.next,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  PhonePrefixFormatter(),
                                ],
                                decoration: InputDecoration(
                                  hintText: '81112345678',
                                  prefixIcon: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                            border: Border.all(
                                              color: Colors.grey.shade300,
                                            ),
                                            color: Colors.white,
                                          ),
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 4,
                                            vertical: 2,
                                          ),
                                          child: const Text(
                                            '🇮🇩',
                                            style: TextStyle(fontSize: 16),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text(
                                          '+62',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          height: 20,
                                          width: 1,
                                          color: Colors.grey.shade300,
                                        ),
                                        const SizedBox(width: 8),
                                      ],
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nomor telepon wajib diisi';
                                  }
                                  final clean = v.trim().replaceAll(
                                    RegExp(r'[^\d]'),
                                    '',
                                  );
                                  if (clean.length >= 8 && clean.length <= 15) {
                                    return null; // Valid
                                  }
                                  return 'Format nomor telepon tidak valid (8-15 digit)';
                                },
                              ),
                              const SizedBox(height: 18),

                              // Field Kata Sandi
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
                                textInputAction: TextInputAction.next,
                                onChanged: (_) => setState(() {}),
                                decoration: InputDecoration(
                                  hintText: 'Minimal 8 karakter...',
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
                                      () =>
                                          _obscurePassword = !_obscurePassword,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Kata sandi wajib diisi';
                                  }
                                  if (v.length < 8) {
                                    return 'Kata sandi minimal 8 karakter';
                                  }
                                  return null;
                                },
                              ),

                              // Password strength indicator
                              if (_passwordController.text.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                PasswordStrengthWidget(
                                  password: _passwordController.text,
                                ),
                              ],
                              const SizedBox(height: 18),

                              // Field Konfirmasi Kata Sandi
                              const Text(
                                'KONFIRMASI KATA SANDI',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _confirmPasswordController,
                                obscureText: _obscureConfirm,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _onRegister(),
                                decoration: InputDecoration(
                                  hintText: 'Ulangi kata sandi...',
                                  prefixIcon: const Icon(
                                    Icons.lock_outline_rounded,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscureConfirm
                                          ? Icons.visibility_outlined
                                          : Icons.visibility_off_outlined,
                                      color: AppColors.textSecondary,
                                      size: 20,
                                    ),
                                    onPressed: () => setState(
                                      () =>
                                          _obscureConfirm = !_obscureConfirm,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Konfirmasi kata sandi wajib diisi';
                                  }
                                  if (v != _passwordController.text) {
                                    return 'Kata sandi tidak cocok';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 24),

                              // Tombol Daftar
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: authState.isLoading
                                      ? null
                                      : _onRegister,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryGreen,
                                    disabledBackgroundColor: AppColors
                                        .primaryGreen
                                        .withValues(alpha: 0.7),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 2,
                                    shadowColor: AppColors.primaryGreen
                                        .withValues(alpha: 0.3),
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
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              Icons.person_add_rounded,
                                              size: 20,
                                            ),
                                            SizedBox(width: 8),
                                            Text(
                                              'DAFTAR SEKARANG',
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

                              // Link ke Login
                              Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'Sudah memiliki akun? ',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => Navigator.of(context).pop(),
                                      child: const Text(
                                        'Masuk',
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

                      // Footer Copyright & Version
                      Column(
                        children: [
                          const Text(
                            '© 2026 Universitas Komputer Indonesia',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _version,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Custom Toast Alert
            if (_isToastVisible && _toastMessage != null)
              SafeArea(
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
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
                            onTap: () =>
                                setState(() => _isToastVisible = false),
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
