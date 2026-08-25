import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/auth_controller.dart';
import '../../../routes/app_routes.dart';

class ForceChangePasswordView extends ConsumerStatefulWidget {
  const ForceChangePasswordView({super.key});

  @override
  ConsumerState<ForceChangePasswordView> createState() =>
      _ForceChangePasswordViewState();
}

class _ForceChangePasswordViewState
    extends ConsumerState<ForceChangePasswordView> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isObscureOld = true;
  bool _isObscureNew = true;
  bool _isObscureConfirm = true;
  String? _phone;

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
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Ambil identifier (phone/NIM) dari argumen rute
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      _phone = args;
    }
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showToast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.red.shade800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Future<void> _onSubmit() async {
    if (_phone == null || _phone!.isEmpty) {
      _showToast('Sesi tidak valid. Silakan login kembali.');
      Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    int fulfilled = 0;
    if (_isLength8) fulfilled++;
    if (_hasUpper) fulfilled++;
    if (_hasLower) fulfilled++;
    if (_hasDigit) fulfilled++;
    if (_hasSpecial) fulfilled++;

    if (fulfilled < 3) {
      _showToast('Kata sandi terlalu lemah. Penuhi kriteria minimal.');
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showToast('Konfirmasi sandi baru tidak cocok');
      return;
    }

    final success = await ref
        .read(authProvider.notifier)
        .forceChangePassword(
          phone: _phone!,
          oldPassword: _oldPasswordController.text,
          newPassword: _newPasswordController.text,
        );

    if (success && mounted) {
      final user = ref.read(authProvider).user;
      if (user != null) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.main);
      } else {
        Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      }
    } else if (mounted) {
      final authState = ref.read(authProvider);
      String errorText = 'Gagal mengganti kata sandi. Silakan coba lagi.';
      if (authState.errorCode == 'WRONG_OLD_PASSWORD') {
        errorText = 'Sandi lama salah.';
      }
      _showToast(errorText);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Ganti Sandi Paksa',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () {
            ref.read(authProvider.notifier).logout();
            Navigator.of(context).pushReplacementNamed(AppRoutes.login);
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Keamanan Akun',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Anda menggunakan sandi default (NIM). Silakan buat sandi baru yang lebih aman untuk melanjutkan.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),

                // Sandi Lama
                const Text(
                  'Sandi Lama',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _oldPasswordController,
                  obscureText: _isObscureOld,
                  decoration: InputDecoration(
                    hintText: 'Masukkan sandi lama (NIM)',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    prefixIcon: const Icon(
                      Icons.lock_outline,
                      color: Colors.grey,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: AppColors.primaryGreen,
                        width: 1.5,
                      ),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isObscureOld
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _isObscureOld = !_isObscureOld;
                        });
                      },
                    ),
                  ),
                  validator: (value) => value == null || value.isEmpty
                      ? 'Sandi lama wajib diisi'
                      : null,
                ),
                const SizedBox(height: 20),

                // Sandi Baru
                const Text(
                  'Sandi Baru',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _isObscureNew,
                  onChanged: _checkPassword,
                  decoration: InputDecoration(
                    hintText: 'Masukkan sandi baru',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    prefixIcon: const Icon(
                      Icons.lock_outline,
                      color: Colors.grey,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: AppColors.primaryGreen,
                        width: 1.5,
                      ),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isObscureNew
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _isObscureNew = !_isObscureNew;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Sandi baru wajib diisi';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                _buildPasswordStrength(),
                const SizedBox(height: 20),

                // Konfirmasi Sandi Baru
                const Text(
                  'Konfirmasi Sandi Baru',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _isObscureConfirm,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _onSubmit(),
                  decoration: InputDecoration(
                    hintText: 'Konfirmasi sandi baru',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    prefixIcon: const Icon(
                      Icons.lock_outline,
                      color: Colors.grey,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: AppColors.primaryGreen,
                        width: 1.5,
                      ),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Colors.red,
                        width: 1.5,
                      ),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Colors.red,
                        width: 1.5,
                      ),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isObscureConfirm
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _isObscureConfirm = !_isObscureConfirm;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Konfirmasi sandi wajib diisi';
                    }
                    if (value != _newPasswordController.text) {
                      return 'Kata sandi tidak cocok';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 40),

                // Submit Button
                ElevatedButton(
                  onPressed: isLoading ? null : _onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text(
                          'Simpan & Lanjutkan',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
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
