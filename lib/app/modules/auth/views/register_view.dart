import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';

/// Layar registrasi Warga baru.
/// Input: Nama Lengkap + No. Telepon + Kata Sandi.
/// Email dan NIK tidak lagi digunakan.
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
  final _alamatController = TextEditingController();
  final _rtRwController = TextEditingController();
  final _kelurahanController = TextEditingController();
  
  // Mahasiswa fields
  final _nimController = TextEditingController();
  final _jurusanController = TextEditingController();
  final _fakultasController = TextEditingController();
  DateTime? _tglMulaiKKN;
  DateTime? _tglSelesaiKKN;

  String _selectedRole = 'Warga';
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  // Custom Toast State
  String? _toastMessage;
  bool _isToastVisible = false;
  Timer? _toastTimer;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _alamatController.dispose();
    _rtRwController.dispose();
    _kelurahanController.dispose();
    _nimController.dispose();
    _jurusanController.dispose();
    _fakultasController.dispose();
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

  String _normalizePhone(String raw) {
    String phone = raw.replaceAll(RegExp(r'[\s\-]'), '');
    if (!phone.startsWith('0') && phone.startsWith('8')) phone = '0$phone';
    return phone;
  }

  Future<void> _onRegister() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty) {
      _showToast('Nama lengkap wajib diisi');
      _formKey.currentState!.validate();
      return;
    }
    if (phone.isEmpty) {
      _showToast('Nomor telepon wajib diisi');
      _formKey.currentState!.validate();
      return;
    }
    if (password.isEmpty) {
      _showToast('Kata sandi wajib diisi');
      _formKey.currentState!.validate();
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    if (_selectedRole == 'Mahasiswa') {
      if (_tglMulaiKKN == null) {
        _showToast('Tanggal mulai KKN wajib diisi');
        return;
      }
      if (_tglSelesaiKKN == null) {
        _showToast('Tanggal selesai KKN wajib diisi');
        return;
      }
      if (_tglSelesaiKKN!.isBefore(_tglMulaiKKN!)) {
        _showToast('Tanggal selesai tidak boleh sebelum tanggal mulai');
        return;
      }
    }

    final normalizedPhone = _normalizePhone(phone);
    
    Map<String, dynamic> data = {
      'nama': name,
      'name': name,
      'phone': normalizedPhone,
      'noWa': normalizedPhone,
      'password': password,

    };

    if (_selectedRole == 'Warga') {
      data['address'] = _alamatController.text.trim();
      data['rtRw'] = _rtRwController.text.trim();
      data['kelurahan'] = _kelurahanController.text.trim();
    } else if (_selectedRole == 'Mahasiswa') {
      data['nim'] = _nimController.text.trim();
      data['jurusan'] = _jurusanController.text.trim();
      data['fakultas'] = _fakultasController.text.trim();
      if (_tglMulaiKKN != null) data['startDate'] = _tglMulaiKKN!.toIso8601String();
      if (_tglSelesaiKKN != null) data['endDate'] = _tglSelesaiKKN!.toIso8601String();
    } else if (_selectedRole == 'Petugas Residu' || _selectedRole == 'Petugas') {
      data['rtRw'] = _rtRwController.text.trim();
      data['kelurahan'] = _kelurahanController.text.trim();
      data['assignedZone'] = _kelurahanController.text.trim();
    }

    ref.read(authProvider.notifier).clearError();
    final bool ok = await ref.read(authProvider.notifier).register(
          role: _selectedRole,
          data: data,
        );

    if (ok && mounted) {
      if (_selectedRole == 'Mahasiswa' || _selectedRole == 'Petugas Residu' || _selectedRole == 'Petugas') {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Registrasi Berhasil'),
            content: const Text(
              'Akun Anda berhasil didaftarkan dan sedang menunggu persetujuan (whitelist) dari Admin DLH. Silakan hubungi admin atau coba masuk kembali nanti.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(); // Back to Login
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else {
        Navigator.of(context).pushNamedAndRemoveUntil(
          AppRoutes.main,
          (route) => false,
        );
      }
    } else if (mounted) {
      final authState = ref.read(authProvider);
      String errorText = 'Registrasi gagal. Silakan coba lagi.';
      if (authState.errorCode == 'CONFLICT') {
        errorText = 'Nomor telepon sudah terdaftar di sistem.';
      } else if (authState.errorCode == 'VALIDATION_ERROR') {
        errorText = 'Format data pendaftaran tidak valid.';
      } else if (authState.errorCode == 'NETWORK_ERROR') {
        errorText = 'Tidak dapat terhubung ke server. Periksa koneksi.';
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
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
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
                            child: Image.asset(AppAssets.logo, fit: BoxFit.cover),
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
                            'Pendaftaran Akun Baru',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

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
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Daftar Akun',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Lengkapi data diri untuk bergabung',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Field Peran / Role
                              _buildLabel('PILIH PERAN'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedRole,
                                items: const [
                                  DropdownMenuItem(value: 'Warga', child: Text('Warga')),
                                  DropdownMenuItem(value: 'Petugas Residu', child: Text('Petugas Residu')),
                                  DropdownMenuItem(value: 'Mahasiswa', child: Text('Mahasiswa')),
                                ],
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedRole = val);
                                },
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.people_alt_outlined, color: AppColors.textSecondary, size: 20),
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Field Nama Lengkap
                              _buildLabel('NAMA LENGKAP'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _nameController,
                                keyboardType: TextInputType.name,
                                textInputAction: TextInputAction.next,
                                textCapitalization: TextCapitalization.words,
                                decoration: const InputDecoration(
                                  hintText: 'Masukkan nama lengkap Anda...',
                                  prefixIcon: Icon(
                                    Icons.badge_outlined,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nama lengkap wajib diisi';
                                  }
                                  if (v.trim().length < 3) {
                                    return 'Nama minimal 3 karakter';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Field No. Telepon
                              _buildLabel('NOMOR TELEPON'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                autocorrect: false,
                                textInputAction: TextInputAction.next,
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                    RegExp(r'[0-9\+\-\s]'),
                                  ),
                                ],
                                decoration: const InputDecoration(
                                  hintText: '081234567890',
                                  prefixIcon: Icon(
                                    Icons.phone_outlined,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nomor telepon wajib diisi';
                                  }
                                  final digits =
                                      v.replaceAll(RegExp(r'[^\d]'), '');
                                  if (digits.length < 10 || digits.length > 13) {
                                    return 'Format nomor telepon tidak valid (10-13 digit)';
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 16),

                              if (_selectedRole == 'Warga') ...[
                                _buildLabel('ALAMAT RUMAH'),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _alamatController,
                                  decoration: const InputDecoration(
                                    hintText: 'Alamat Rumah',
                                    prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.textSecondary, size: 20),
                                  ),
                                  validator: (v) {
                                    if (_selectedRole == 'Warga' && (v == null || v.trim().isEmpty)) {
                                      return 'Wajib diisi';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                              ],

                              if (_selectedRole == 'Warga' || _selectedRole == 'Petugas Residu') ...[
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('RT/RW'),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _rtRwController,
                                            decoration: const InputDecoration(
                                              hintText: 'Contoh: 01/02',
                                              prefixIcon: Icon(Icons.home_outlined, color: AppColors.textSecondary, size: 20),
                                            ),
                                            validator: (v) {
                                              if ((_selectedRole == 'Warga' || _selectedRole == 'Petugas Residu') && (v == null || v.trim().isEmpty)) {
                                                return 'Wajib diisi';
                                              }
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('KELURAHAN'),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _kelurahanController,
                                            decoration: const InputDecoration(
                                              hintText: 'Kelurahan',
                                              prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.textSecondary, size: 20),
                                            ),
                                            validator: (v) {
                                              if ((_selectedRole == 'Warga' || _selectedRole == 'Petugas Residu') && (v == null || v.trim().isEmpty)) {
                                                return 'Wajib diisi';
                                              }
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                              ],

                              if (_selectedRole == 'Mahasiswa') ...[
                                _buildLabel('NIM'),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nimController,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    hintText: 'Nomor Induk Mahasiswa',
                                    prefixIcon: Icon(Icons.badge_outlined, color: AppColors.textSecondary, size: 20),
                                  ),
                                  validator: (v) {
                                    if (_selectedRole == 'Mahasiswa' && (v == null || v.trim().isEmpty)) {
                                      return 'Wajib diisi';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('JURUSAN'),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _jurusanController,
                                            decoration: const InputDecoration(
                                              hintText: 'Jurusan',
                                              prefixIcon: Icon(Icons.school_outlined, color: AppColors.textSecondary, size: 20),
                                            ),
                                            validator: (v) {
                                              if (_selectedRole == 'Mahasiswa' && (v == null || v.trim().isEmpty)) return 'Wajib diisi';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('FAKULTAS'),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _fakultasController,
                                            decoration: const InputDecoration(
                                              hintText: 'Fakultas',
                                              prefixIcon: Icon(Icons.account_balance_outlined, color: AppColors.textSecondary, size: 20),
                                            ),
                                            validator: (v) {
                                              if (_selectedRole == 'Mahasiswa' && (v == null || v.trim().isEmpty)) return 'Wajib diisi';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('TGL MULAI KKN'),
                                          const SizedBox(height: 6),
                                          InkWell(
                                            onTap: () async {
                                              final date = await showDatePicker(
                                                context: context,
                                                initialDate: _tglMulaiKKN ?? DateTime.now(),
                                                firstDate: DateTime(2000),
                                                lastDate: DateTime(2100),
                                              );
                                              if (date != null) setState(() => _tglMulaiKKN = date);
                                            },
                                            child: InputDecorator(
                                              decoration: const InputDecoration(
                                                prefixIcon: Icon(Icons.calendar_today_outlined, color: AppColors.textSecondary, size: 20),
                                              ),
                                              child: Text(_tglMulaiKKN == null ? 'Pilih Tgl' : '${_tglMulaiKKN!.day}/${_tglMulaiKKN!.month}/${_tglMulaiKKN!.year}'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel('TGL SELESAI KKN'),
                                          const SizedBox(height: 6),
                                          InkWell(
                                            onTap: () async {
                                              final date = await showDatePicker(
                                                context: context,
                                                initialDate: _tglSelesaiKKN ?? DateTime.now(),
                                                firstDate: DateTime(2000),
                                                lastDate: DateTime(2100),
                                              );
                                              if (date != null) setState(() => _tglSelesaiKKN = date);
                                            },
                                            child: InputDecorator(
                                              decoration: const InputDecoration(
                                                prefixIcon: Icon(Icons.calendar_today_outlined, color: AppColors.textSecondary, size: 20),
                                              ),
                                              child: Text(_tglSelesaiKKN == null ? 'Pilih Tgl' : '${_tglSelesaiKKN!.day}/${_tglSelesaiKKN!.month}/${_tglSelesaiKKN!.year}'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 16),

                              // Field Kata Sandi
                              _buildLabel('KATA SANDI'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.next,
                                decoration: InputDecoration(
                                  hintText: 'Minimal 6 karakter...',
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
                                    return 'Kata sandi wajib diisi';
                                  }
                                  if (v.length < 6) {
                                    return 'Kata sandi minimal 6 karakter';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Field Konfirmasi Kata Sandi
                              _buildLabel('KONFIRMASI KATA SANDI'),
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
                                      () => _obscureConfirm = !_obscureConfirm,
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
                              const SizedBox(height: 20),

                              // Tombol Daftar
                              ElevatedButton(
                                onPressed: authState.isLoading ? null : _onRegister,
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
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.person_add_alt_1_rounded,
                                            size: 18,
                                          ),
                                          SizedBox(width: 8),
                                          Text('DAFTAR SEKARANG'),
                                        ],
                                      ),
                              ),
                              const SizedBox(height: 16),

                              // Back to Login
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

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: AppColors.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }
}
