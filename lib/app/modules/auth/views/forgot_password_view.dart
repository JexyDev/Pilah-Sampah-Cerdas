import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/phone_formatter.dart';
import '../../../core/utils/input_sanitizer.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/widgets/otp_input_widget.dart';

/// Layar Lupa Kata Sandi — 3-step berbasis OTP ke nomor telepon.
///
/// Step 1: Input nomor telepon → request kirim OTP
/// Step 2: Input OTP 6-digit dari SMS + countdown resend
/// Step 3: Input kata sandi baru
class ForgotPasswordView extends ConsumerStatefulWidget {
  const ForgotPasswordView({super.key});

  @override
  ConsumerState<ForgotPasswordView> createState() =>
      _ForgotPasswordViewState();
}

class _ForgotPasswordViewState
    extends ConsumerState<ForgotPasswordView> {
  final _formKey1 = GlobalKey<FormState>();
  final _formKey3 = GlobalKey<FormState>();

  final _phoneController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpKey = GlobalKey<OtpInputWidgetState>();

  int _currentStep = 1; // 1: Phone, 2: OTP, 3: New Password
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _otpValue = '';
  bool _otpCompleted = false;

  // Countdown resend OTP
  int _resendCountdown = 60;
  Timer? _resendTimer;
  bool _canResend = false;

  // Toast
  String? _toastMessage;
  bool _isToastVisible = false;
  bool _isErrorToast = true;
  Timer? _toastTimer;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_onPhoneChanged);
  }

  void _onPhoneChanged() {
    String text = _phoneController.text;
    String clean = text.replaceAll(RegExp(r'[^\d]'), '');

    bool changed = false;
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
      changed = true;
    } else if (clean.startsWith('62')) {
      clean = clean.substring(2);
      changed = true;
    }

    if (changed) {
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
    _phoneController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _resendTimer?.cancel();
    _toastTimer?.cancel();
    super.dispose();
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  void _showToast(String message, {bool isError = true}) {
    _toastTimer?.cancel();
    setState(() {
      _toastMessage = message;
      _isToastVisible = true;
      _isErrorToast = isError;
    });
    _toastTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) setState(() => _isToastVisible = false);
    });
  }

  // ─── Countdown Resend ─────────────────────────────────────────────────────

  void _startResendCountdown() {
    _resendTimer?.cancel();
    setState(() {
      _resendCountdown = 60;
      _canResend = false;
    });

    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _resendCountdown--;
      });
      if (_resendCountdown <= 0) {
        timer.cancel();
        setState(() => _canResend = true);
      }
    });
  }

  // ─── Normalise ────────────────────────────────────────────────────────────

  String _normalizePhone(String raw) {
    return PhoneFormatter.prepareLoginPhoneInput(raw);
  }

  // ─── Step 1: Request OTP ──────────────────────────────────────────────────

  Future<void> _onRequestOtp() async {
    if (!_formKey1.currentState!.validate()) return;
    
    final phone = InputSanitizer.sanitize(_phoneController.text);
    final normalizedPhone = _normalizePhone(phone);
    ref.read(authProvider.notifier).clearError();

    final bool ok = await ref
        .read(authProvider.notifier)
        .requestOtp(phone: normalizedPhone);

    if (ok && mounted) {
      setState(() => _currentStep = 2);
      _startResendCountdown();
      _showToast(
        'OTP dikirim ke ${_maskPhone(phone)} (Gunakan Kode OTP Dev: 123456)',
        isError: false,
      );
    }
  }

  /// Kirim ulang OTP.
  Future<void> _onResendOtp() async {
    if (!_canResend) return;
    _otpKey.currentState?.clear();
    setState(() {
      _otpValue = '';
      _otpCompleted = false;
    });
    await _onRequestOtp();
  }

  // ─── Step 2: Verifikasi OTP ───────────────────────────────────────────────

  Future<void> _onVerifyOtp() async {
    if (!_otpCompleted || _otpValue.length < 6) {
      _showToast('Masukkan 6 digit kode OTP terlebih dahulu');
      return;
    }
    
    final phone = _normalizePhone(_phoneController.text.trim());
    final bool ok = await ref
        .read(authProvider.notifier)
        .verifyOtp(phone: phone, otp: _otpValue);

    if (ok && mounted) {
      setState(() => _currentStep = 3);
    } else if (mounted) {
      _showToast('Kode OTP salah atau kedaluwarsa');
    }
  }

  // ─── Step 3: Reset Password ───────────────────────────────────────────────

  Future<void> _onResetPassword() async {
    if (!_formKey3.currentState!.validate()) return;

    final phone = _normalizePhone(InputSanitizer.sanitize(_phoneController.text));
    final newPassword = _newPasswordController.text;

    ref.read(authProvider.notifier).clearError();

    // UI-only: Sementara kirim ke resetPassword dengan email = phone
    final bool ok = await ref.read(authProvider.notifier).resetPassword(
          email: phone,
          token: _otpValue,
          newPassword: newPassword,
        );

    if (ok && mounted) {
      _showToast('Kata sandi berhasil diperbarui! Silakan login.', isError: false);
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.of(context).pop();
      });
    } else if (mounted) {
      final authState = ref.read(authProvider);
      String errorText = 'Gagal menyetel ulang kata sandi.';
      if (authState.errorCode == 'USER_NOT_FOUND') {
        errorText = 'Nomor telepon tidak terdaftar di sistem.';
      } else if (authState.errorCode == 'INVALID_TOKEN' ||
          authState.errorCode == 'OTP_INVALID') {
        errorText = 'Kode OTP salah atau sudah kedaluwarsa.';
      } else if (authState.errorCode == 'NETWORK_ERROR') {
        errorText = 'Koneksi ke server gagal.';
      }
      _showToast(errorText);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /// Sembunyikan sebagian nomor HP: 0812****7890
  String _maskPhone(String phone) {
    if (phone.length < 8) return phone;
    final start = phone.substring(0, 4);
    final end = phone.substring(phone.length - 4);
    return '$start****$end';
  }

  // ─── Build ────────────────────────────────────────────────────────────────

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
                    vertical: 24,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo & Judul
                      Column(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
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
                            child: Image.asset(
                              AppAssets.logo,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'TrashCare',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryGreen,
                              letterSpacing: -0.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Atur Ulang Kata Sandi',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Step Indicator
                      _buildStepIndicator(),
                      const SizedBox(height: 20),

                      // Card Form
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
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          transitionBuilder: (child, animation) {
                            return SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0.15, 0),
                                end: Offset.zero,
                              ).animate(CurvedAnimation(
                                parent: animation,
                                curve: Curves.easeOut,
                              )),
                              child: FadeTransition(
                                opacity: animation,
                                child: child,
                              ),
                            );
                          },
                          child: _currentStep == 1
                              ? _buildStep1(authState)
                              : _currentStep == 2
                                  ? _buildStep2(authState)
                                  : _buildStep3(authState),
                        ),
                      ),
                      const SizedBox(height: 24),

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
                          Icon(
                            _isErrorToast
                                ? Icons.error_outline_rounded
                                : Icons.check_circle_outline_rounded,
                            color: _isErrorToast
                                ? AppColors.dangerRed
                                : AppColors.primaryGreen,
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

  // ─── Step Indicator ───────────────────────────────────────────────────────

  Widget _buildStepIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        final step = i + 1;
        final isActive = _currentStep == step;
        final isDone = _currentStep > step;
        return Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: isActive ? 32 : 28,
              height: isActive ? 32 : 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? AppColors.primaryGreen
                    : isActive
                        ? AppColors.primaryGreen
                        : const Color(0xFFECEEF1),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppColors.primaryGreen.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Center(
                child: isDone
                    ? const Icon(Icons.check_rounded,
                        color: Colors.white, size: 14)
                    : Text(
                        '$step',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isActive
                              ? Colors.white
                              : AppColors.textSecondary,
                        ),
                      ),
              ),
            ),
            if (step < 3)
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: 36,
                height: 2,
                color: _currentStep > step
                    ? AppColors.primaryGreen
                    : const Color(0xFFECEEF1),
                margin: const EdgeInsets.symmetric(horizontal: 4),
              ),
          ],
        );
      }),
    );
  }

  // ─── Step 1: Input No. Telepon ────────────────────────────────────────────

  Widget _buildStep1(AuthState authState) {
    return Form(
      key: _formKey1,
      child: Column(
        key: const ValueKey('step1'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Lupa Kata Sandi?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Masukkan nomor HP terdaftar. Kami akan kirim kode OTP via SMS.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),

          Text(
            _phoneController.text.isEmpty
                ? 'NOMOR TELEPON ATAU NIM'
                : (_phoneController.text.length >= 11 && _phoneController.text.length <= 13)
                    ? 'NOMOR TELEPON'
                    : 'NIM',
            style: const TextStyle(
              fontSize: 10,
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
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _onRequestOtp(),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
            ],
            decoration: InputDecoration(
              hintText: _phoneController.text.isEmpty || (_phoneController.text.length >= 11 && _phoneController.text.length <= 13)
                  ? '81234567890'
                  : '1301210000',
              prefixIcon: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                margin: const EdgeInsets.only(right: 8),
                decoration: const BoxDecoration(
                  border: Border(
                    right: BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('🇮🇩', style: TextStyle(fontSize: 18)),
                    SizedBox(width: 6),
                    Text(
                      '+62',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppColors.textSecondary),
                  ],
                ),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) {
                return 'Nomor telepon wajib diisi';
              }
              final digits = v.replaceAll(RegExp(r'[^\d]'), '');
              if (digits.length < 10 || digits.length > 13) {
                return 'Format nomor telepon tidak valid (10-13 digit)';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: authState.isLoading ? null : _onRequestOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
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
                      Icon(Icons.sms_outlined, size: 16),
                      SizedBox(width: 8),
                      Text('KIRIM KODE OTP'),
                    ],
                  ),
          ),
          const SizedBox(height: 16),

          Center(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: const Text(
                'Kembali ke halaman Masuk',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Step 2: Input OTP ────────────────────────────────────────────────────

  Widget _buildStep2(AuthState authState) {
    final maskedPhone =
        _maskPhone(_normalizePhone(_phoneController.text.trim()));

    return Column(
      key: const ValueKey('step2'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verifikasi OTP',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            children: [
              const TextSpan(text: 'Kode OTP 6-digit telah dikirim ke '),
              TextSpan(
                text: maskedPhone,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const TextSpan(text: ' via SMS.'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primaryBlueLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 18, color: AppColors.primaryBlueDark),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Mode Pengujian: Masukkan kode OTP 123456 untuk melanjutkan.',
                  style: TextStyle(fontSize: 11, color: AppColors.primaryBlueDark, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // OTP Input
        Center(
          child: OtpInputWidget(
            key: _otpKey,
            onCompleted: (otp) {
              setState(() {
                _otpValue = otp;
                _otpCompleted = true;
              });
            },
            onChanged: (otp) {
              setState(() {
                _otpValue = otp;
                _otpCompleted = otp.length == 6;
              });
            },
          ),
        ),
        const SizedBox(height: 24),

        // Countdown / Resend
        Center(
          child: _canResend
              ? GestureDetector(
                  onTap: _onResendOtp,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.primaryGreen.withValues(alpha: 0.4),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.refresh_rounded,
                          size: 16,
                          color: AppColors.primaryGreen,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Kirim Ulang OTP',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Kirim ulang dalam ',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      '${_resendCountdown}s',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ],
                ),
        ),
        const SizedBox(height: 24),

        // Tombol Verifikasi
        ElevatedButton(
          onPressed: _otpCompleted ? _onVerifyOtp : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryGreen,
            disabledBackgroundColor: AppColors.primaryGreen.withValues(alpha: 0.4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _otpCompleted
                    ? Icons.verified_outlined
                    : Icons.lock_outline_rounded,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                _otpCompleted ? 'VERIFIKASI OTP' : 'MASUKKAN 6 DIGIT OTP',
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Center(
          child: GestureDetector(
            onTap: () => setState(() => _currentStep = 1),
            child: const Text(
              'Ganti nomor telepon',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryGreen,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Step 3: Input Password Baru ──────────────────────────────────────────

  Widget _buildStep3(AuthState authState) {
    return Form(
      key: _formKey3,
      child: Column(
        key: const ValueKey('step3'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Buat Kata Sandi Baru',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'OTP berhasil diverifikasi. Silakan buat kata sandi baru.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          // Badge OTP Verified
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.2),
              ),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.verified_outlined,
                  size: 16,
                  color: AppColors.primaryGreen,
                ),
                SizedBox(width: 8),
                Text(
                  'OTP terverifikasi ✓',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Field Kata Sandi Baru
          const Text(
            'KATA SANDI BARU',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _newPasswordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.next,
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
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Kata sandi wajib diisi';
              if (v.length < 8) return 'Kata sandi minimal 8 karakter';
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Field Konfirmasi
          const Text(
            'KONFIRMASI KATA SANDI',
            style: TextStyle(
              fontSize: 10,
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
            onFieldSubmitted: (_) => _onResetPassword(),
            decoration: InputDecoration(
              hintText: 'Ulangi kata sandi baru...',
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
                onPressed: () =>
                    setState(() => _obscureConfirm = !_obscureConfirm),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) {
                return 'Konfirmasi kata sandi wajib diisi';
              }
              if (v != _newPasswordController.text) {
                return 'Kata sandi tidak cocok';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: authState.isLoading ? null : _onResetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
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
                      Icon(Icons.lock_reset_rounded, size: 18),
                      SizedBox(width: 8),
                      Text('SIMPAN KATA SANDI BARU'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
