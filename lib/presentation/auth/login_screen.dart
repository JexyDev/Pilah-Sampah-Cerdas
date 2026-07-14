import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_assets.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../providers/auth_provider.dart';
import '../shared/widgets/app_loading.dart';

/// Layar login — sesuai desain:
/// Header biru besar dengan logo bulat di tengah, card putih rounded bawah.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nikController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nikController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLogin() async {
    if (!_formKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).clearError();
    final bool ok = await ref
        .read(authProvider.notifier)
        .login(
          nik: _nikController.text.trim(),
          password: _passwordController.text,
        );
    if (ok && mounted) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.main);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen(authProvider, (_, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              next.errorCode == 'INVALID_CREDENTIALS'
                  ? AppStrings.invalidCredentials
                  : AppStrings.errorGeneric,
            ),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    });

    if (authState.isLoading) {
      return const Scaffold(body: AppLoading(message: 'Memverifikasi...'));
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: Stack(
        children: [
          // Background biru atas (sekitar 45% layar)
          FractionallySizedBox(
            heightFactor: 0.45,
            widthFactor: 1,
            child: Container(color: AppColors.primaryBlue),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header biru — logo + "Pilah Sampah"
                Padding(
                  padding: const EdgeInsets.only(top: 40, bottom: 20),
                  child: Column(
                    children: [
                      // Logo bulat
                      Container(
                        width: 90,
                        height: 90,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Image.asset(
                          AppAssets.logo,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.eco_rounded,
                            size: 48,
                            color: AppColors.primaryBlue,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Pilah Sampah',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),

                // Card putih rounded
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(32),
                        topRight: Radius.circular(32),
                      ),
                    ),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Masuk ke Akun',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Pilah sampah cerdas dimulai dari sini',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 28),

                            // NIK
                            const Text(
                              'NIK',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _nikController,
                              keyboardType: TextInputType.number,
                              maxLength: 16,
                              decoration: const InputDecoration(
                                hintText: 'Masukkan email atau nomor',
                                prefixIcon: Icon(
                                  Icons.mail_outline_rounded,
                                  color: AppColors.textSecondary,
                                ),
                                counterText: '',
                              ),
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'NIK tidak boleh kosong.';
                                }
                                if (v.length != 16) {
                                  return 'NIK harus 16 digit.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Kata Sandi
                            const Text(
                              'Kata Sandi',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                hintText: 'Masukkan kata sandi',
                                prefixIcon: const Icon(
                                  Icons.lock_outline_rounded,
                                  color: AppColors.textSecondary,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: AppColors.textSecondary,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword,
                                  ),
                                ),
                              ),
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'Kata sandi tidak boleh kosong.';
                                }
                                if (v.length < 6) {
                                  return 'Minimal 6 karakter.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 32),

                            // Tombol MASUK
                            ElevatedButton(
                              onPressed: _onLogin,
                              child: const Text('MASUK'),
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

          // Footer
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      AppAssets.logo,
                      width: 18,
                      height: 18,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.eco,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'pilahsampah.id',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  '© 2024 Pilah Sampah Cerdas. All rights reserved.',
                  style: TextStyle(fontSize: 10, color: AppColors.textHint),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
