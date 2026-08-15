import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/utils/input_sanitizer.dart';
import '../../../core/utils/phone_formatter.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/widgets/searchable_dropdown.dart';
import '../../../routes/app_routes.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/widgets/password_strength_widget.dart';

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
  final _familySizeController = TextEditingController(text: '1');
  
  // Mahasiswa fields
  final _nimController = TextEditingController();
  final _jurusanController = TextEditingController();
  final _fakultasController = TextEditingController();
  final _universitasController = TextEditingController();
  final _kecamatanController = TextEditingController();
  final _provinsiController = TextEditingController();
  final _kotaController = TextEditingController();
  final _dplNameController = TextEditingController();
  String _selectedJenjang = 'S1';
  String? _selectedKelurahan;
  String? _selectedRw;
  DateTime? _tglMulaiKKN;
  DateTime? _tglSelesaiKKN;
  final Map<String, List<String>> _rwByKelurahan = {};
  final Map<String, List<String>> _kelurahanByKecamatan = {};

  final List<String> _jenjangList = ['D3', 'D4', 'S1', 'S2', 'S3'];
  final List<String> _kelurahanList = [];
  final List<String> _kecamatanList = [];
  final List<String> _provinsiList = [];
  final List<String> _kotaList = [];

  List<String> get _availableRwList {
    if (_selectedKelurahan == null) return [];
    if (_rwByKelurahan.containsKey(_selectedKelurahan) && _rwByKelurahan[_selectedKelurahan!]!.isNotEmpty) {
      final rws = _rwByKelurahan[_selectedKelurahan!]!.toSet().toList();
      rws.sort((a, b) {
        int ia = int.tryParse(a) ?? 0;
        int ib = int.tryParse(b) ?? 0;
        return ia.compareTo(ib);
      });
      return rws;
    }
    return [];
  }

  List<String> get _availableKelurahanList {
    if (_kecamatanController.text.isEmpty) return [];
    final kec = _kecamatanController.text;
    if (_kelurahanByKecamatan.containsKey(kec) && _kelurahanByKecamatan[kec]!.isNotEmpty) {
      final kels = _kelurahanByKecamatan[kec]!.toSet().toList();
      kels.sort();
      return kels;
    }
    return _kelurahanList;
  }

  String _selectedRole = 'Warga';
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  // Custom Toast State
  String? _toastMessage;
  bool _isToastVisible = false;
  Timer? _toastTimer;

  @override
  void initState() {
    super.initState();
    _loadDynamicTerritories();
    _phoneController.addListener(_onPhoneChanged);
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

  String _cleanTerritoryName(dynamic val) {
    if (val == null) return '';
    String str = val.toString().trim();
    if (str.contains('{') && str.contains('name:')) {
      final match = RegExp(r'name:\s*([\w\s]+?)(?:,|\})', caseSensitive: false).firstMatch(str);
      if (match != null) str = match.group(1)?.trim() ?? str;
    }
    return str.replaceAll(RegExp(r'[\{\}]'), '').trim();
  }

  Future<void> _loadDynamicTerritories() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final res = await repo.fetchTerritories();
      final kelsRaw = (res['kelurahans'] as List?)?.map((e) => _cleanTerritoryName(e)).where((e) => e.isNotEmpty && !e.contains('id:')).toList() ?? [];
      final kecsRaw = (res['kecamatans'] as List?)?.map((e) => _cleanTerritoryName(e)).where((e) => e.isNotEmpty && !e.contains('id:')).toList() ?? [];
      final provsRaw = (res['provinsis'] as List?)?.map((e) => _cleanTerritoryName(e)).where((e) => e.isNotEmpty && !e.contains('id:')).toList() ?? [];
      final kotasRaw = (res['kotas'] as List?)?.map((e) => _cleanTerritoryName(e)).where((e) => e.isNotEmpty && !e.contains('id:')).toList() ?? [];

      if (mounted) {
        setState(() {
          if (provsRaw.isNotEmpty) {
            _provinsiList.clear();
            _provinsiList.addAll(provsRaw);
          }
          if (kotasRaw.isNotEmpty) {
            _kotaList.clear();
            _kotaList.addAll(kotasRaw);
          }
          if (kecsRaw.isNotEmpty) {
            _kecamatanList.clear();
            _kecamatanList.addAll(kecsRaw);
          }
          _kelurahanList.clear();
          _kelurahanList.addAll(kelsRaw);

          _rwByKelurahan.clear();
          final rawRtRw = res['rawRtRw'] as List<dynamic>? ?? [];
          for (final item in rawRtRw) {
             if (item is Map<String, dynamic>) {
                 final kelName = _cleanTerritoryName(item['kelurahan']);
                 final rwName = _cleanTerritoryName(item['name']);
                 if (kelName.isNotEmpty && rwName.isNotEmpty) {
                     if (!_rwByKelurahan.containsKey(kelName)) {
                         _rwByKelurahan[kelName] = [];
                     }
                     String cleanRw = rwName.replaceAll(RegExp(r'[^\d]'), '');
                     if (cleanRw.isEmpty) cleanRw = rwName;
                     if (!_rwByKelurahan[kelName]!.contains(cleanRw)) {
                         _rwByKelurahan[kelName]!.add(cleanRw);
                     }
                 }
             }
          }

          _kelurahanByKecamatan.clear();
          final rawKelurahan = res['rawKelurahan'] as List<dynamic>? ?? [];
          for (final item in rawKelurahan) {
             if (item is Map<String, dynamic>) {
                 final kecObj = item['kecamatan'];
                 final kecName = _cleanTerritoryName(kecObj != null ? kecObj['name'] : '');
                 final kelName = _cleanTerritoryName(item['name']);
                 if (kecName.isNotEmpty && kelName.isNotEmpty) {
                     if (!_kelurahanByKecamatan.containsKey(kecName)) {
                         _kelurahanByKecamatan[kecName] = [];
                     }
                     if (!_kelurahanByKecamatan[kecName]!.contains(kelName)) {
                         _kelurahanByKecamatan[kecName]!.add(kelName);
                     }
                 }
             }
          }
        });
      }
    } catch (_) {
      // Tidak menggunakan fallback dummy
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _alamatController.dispose();
    _familySizeController.dispose();
    _nimController.dispose();
    _jurusanController.dispose();
    _fakultasController.dispose();
    _universitasController.dispose();
    _kecamatanController.dispose();
    _dplNameController.dispose();
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
    return PhoneFormatter.prepareLoginPhoneInput(raw);
  }

  Future<void> _onRegister() async {
    final name = InputSanitizer.sanitize(_nameController.text);
    final phone = InputSanitizer.sanitize(_phoneController.text);
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

    if (_selectedRole == 'Warga' || _selectedRole == 'Mahasiswa' || _selectedRole == 'Petugas Pemilahan' || _selectedRole == 'Petugas') {
      if (_selectedKelurahan == null) {
        _showToast('Kelurahan wajib dipilih');
        return;
      }
      if (_selectedRw == null) {
        _showToast('RW wajib dipilih');
        return;
      }
    }

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
      'provinsi': _provinsiController.text, // Disimpan ke User.provinsi
      'kabupaten': _kotaController.text, // Disimpan ke User.kabupaten
    };

    if (_selectedRole == 'Warga') {
      // Gabungkan kecamatan ke address agar tersimpan tanpa membuat backend crash
      final baseAddress = InputSanitizer.sanitize(_alamatController.text);
      final kec = InputSanitizer.sanitize(_kecamatanController.text);
      data['address'] = kec.isNotEmpty ? '$baseAddress, Kec. $kec' : baseAddress;
      
      data['rw'] = _selectedRw ?? '';
      data['kelurahan'] = _selectedKelurahan ?? '';
      data['jumlahAnggotaKeluarga'] = int.tryParse(_familySizeController.text) ?? 1;
    } else if (_selectedRole == 'Mahasiswa') {
      data['nim'] = InputSanitizer.sanitize(_nimController.text);
      
      // Gabungkan jenjang, universitas ke fakultas
      final univ = InputSanitizer.sanitize(_universitasController.text);
      final fak = InputSanitizer.sanitize(_fakultasController.text);
      final jenjang = _selectedJenjang;
      data['fakultas'] = [jenjang, fak, univ].where((e) => e.isNotEmpty).join(' - ');

      // Gabungkan DPL ke jurusan
      final jur = InputSanitizer.sanitize(_jurusanController.text);
      final dpl = InputSanitizer.sanitize(_dplNameController.text);
      data['jurusan'] = dpl.isNotEmpty ? '$jur (DPL: $dpl)' : jur;
      data['prodi'] = data['jurusan'];

      data['rw'] = _selectedRw ?? '';
      data['kelurahan'] = _selectedKelurahan ?? '';
      if (_tglMulaiKKN != null) data['startDate'] = _tglMulaiKKN!.toIso8601String();
      if (_tglSelesaiKKN != null) data['endDate'] = _tglSelesaiKKN!.toIso8601String();
    } else if (_selectedRole == 'Petugas Pemilahan' || _selectedRole == 'Petugas') {
      data['rw'] = _selectedRw ?? '';
      data['kelurahan'] = _selectedKelurahan ?? '';
      final kel = _selectedKelurahan ?? '';
      final kec = InputSanitizer.sanitize(_kecamatanController.text);
      data['assignedZone'] = kec.isNotEmpty ? '$kel, Kec. $kec' : kel;
    }

    ref.read(authProvider.notifier).clearError();
    final bool ok = await ref.read(authProvider.notifier).register(
          role: _selectedRole,
          data: data,
        );

    if (ok && mounted) {
      if (_selectedRole == 'Mahasiswa' || _selectedRole == 'Petugas Pemilahan' || _selectedRole == 'Petugas') {
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
        errorText = authState.errorMessage ?? 'Format data pendaftaran tidak valid.';
      } else if (authState.errorCode == 'NETWORK_ERROR') {
        errorText = 'Tidak dapat terhubung ke server. Periksa koneksi.';
      }
      _showToast(errorText);
    }
  }

  // void _showOtpDialog(String phone) {
  //   String otpInput = '';
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false,
  //     builder: (ctx) => StatefulBuilder(
  //       builder: (context, setStateDialog) {
  //         final authState = ref.watch(authProvider);
  //         return AlertDialog(
  //           title: const Text('Verifikasi OTP'),
  //           content: Column(
  //             mainAxisSize: MainAxisSize.min,
  //             children: [
  //               Text('Masukkan kode OTP yang dikirim ke $phone'),
  //               const SizedBox(height: 16),
  //               TextField(
  //                 keyboardType: TextInputType.number,
  //                 maxLength: 6,
  //                 onChanged: (val) => otpInput = val,
  //                 decoration: const InputDecoration(
  //                   hintText: 'Kode OTP',
  //                   border: OutlineInputBorder(),
  //                 ),
  //               ),
  //               if (authState.errorCode != null)
  //                 Padding(
  //                   padding: const EdgeInsets.only(top: 8.0),
  //                   child: Text(
  //                     'Error: ${authState.errorCode}',
  //                     style: const TextStyle(color: Colors.red, fontSize: 12),
  //                   ),
  //                 )
  //             ],
  //           ),
  //           actions: [
  //             TextButton(
  //               onPressed: authState.isLoading ? null : () {
  //                 Navigator.pop(ctx);
  //               },
  //               child: const Text('Batal'),
  //             ),
  //             ElevatedButton(
  //               onPressed: authState.isLoading ? null : () async {
  //                 if (otpInput.length < 4) return;
  //                 final ok = await ref.read(authProvider.notifier).verifyOtp(phone: phone, otp: otpInput);
  //                 if (ok && mounted) {
  //                   Navigator.pop(ctx);
  //                   Navigator.of(this.context).pushNamedAndRemoveUntil(AppRoutes.main, (route) => false);
  //                 }
  //               },
  //               child: authState.isLoading 
  //                 ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) 
  //                 : const Text('Verifikasi'),
  //             ),
  //           ],
  //         );
  //       }
  //     ),
  //   );
  // }

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
                                isExpanded: true,
                                initialValue: _selectedRole,
                                items: const [
                                  DropdownMenuItem(value: 'Warga', child: Text('Warga')),
                                  DropdownMenuItem(value: 'Petugas Pemilahan', child: Text('Petugas Pemilahan')),
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
                                keyboardType: TextInputType.number,
                                autocorrect: false,
                                textInputAction: TextInputAction.next,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  PhonePrefixFormatter(),
                                ],
                                decoration: InputDecoration(
                                  hintText: '81234567890',
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
                                      ],
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Nomor telepon wajib diisi';
                                  }
                                  final clean = v.trim();
                                  if (clean.startsWith('0')) {
                                    return 'Mohon tidak menggunakan awalan 0 atau 62';
                                  }
                                  final digits =
                                      clean.replaceAll(RegExp(r'[^\d]'), '');
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
                                _buildLabel('JUMLAH ANGGOTA KELUARGA (DALAM 1 RUMAH)'),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _familySizeController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  decoration: const InputDecoration(
                                    hintText: 'Contoh: 4',
                                    prefixIcon: Icon(Icons.family_restroom_rounded, color: AppColors.textSecondary, size: 20),
                                  ),
                                  validator: (v) {
                                    if (_selectedRole == 'Warga') {
                                      if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                                      final num = int.tryParse(v);
                                      if (num == null || num < 1) return 'Minimal 1 orang';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                              ],

                              if (_selectedRole == 'Warga' || _selectedRole == 'Petugas Pemilahan' || _selectedRole == 'Mahasiswa') ...[

                                _buildLabel('PROVINSI'),
                                const SizedBox(height: 6),
                                SearchableDropdownField<String>(
                                  labelText: 'Provinsi',
                                  hintText: 'Pilih Provinsi',
                                  prefixIcon: Icons.map,
                                  value: _provinsiController.text.isNotEmpty ? _provinsiController.text : null,
                                  items: _provinsiList.map((p) => DropdownItem(value: p, label: p)).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _provinsiController.text = val;
                                        // Reset below
                                        _kotaController.clear();
                                        _kecamatanController.clear();
                                        _selectedKelurahan = null;
                                        _selectedRw = null;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 16),
                                _buildLabel('KOTA/KABUPATEN'),
                                const SizedBox(height: 6),
                                SearchableDropdownField<String>(
                                  labelText: 'Kota/Kabupaten',
                                  hintText: _provinsiController.text.isEmpty ? 'Pilih Provinsi dulu' : 'Pilih Kota/Kab',
                                  prefixIcon: Icons.location_city,
                                  enabled: _provinsiController.text.isNotEmpty,
                                  value: _kotaController.text.isNotEmpty ? _kotaController.text : null,
                                  items: _kotaList.map((k) => DropdownItem(value: k, label: k)).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _kotaController.text = val;
                                        // Reset below
                                        _kecamatanController.clear();
                                        _selectedKelurahan = null;
                                        _selectedRw = null;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 16),
                                _buildLabel('KECAMATAN'),
                                const SizedBox(height: 6),
                                SearchableDropdownField<String>(
                                  labelText: 'Kecamatan',
                                  hintText: 'Pilih Kecamatan',
                                  prefixIcon: Icons.map_rounded,
                                  value: _kecamatanController.text.isNotEmpty ? _kecamatanController.text : null,
                                  items: _kecamatanList.map((k) => DropdownItem(value: k, label: 'Kecamatan $k')).toList(),
                                  onChanged: (val) {
                                    if (val != null && val != _kecamatanController.text) {
                                      setState(() {
                                        _kecamatanController.text = val;
                                        _selectedKelurahan = null;
                                        _selectedRw = null;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 16),
                                _buildLabel(_selectedRole == 'Mahasiswa' ? 'KELURAHAN DAMPINGAN' : 'KELURAHAN'),
                                const SizedBox(height: 6),
                                SearchableDropdownField<String>(
                                  labelText: _selectedRole == 'Mahasiswa' ? 'Kelurahan Dampingan' : 'Kelurahan',
                                  hintText: _kecamatanController.text.isEmpty ? 'Pilih Kecamatan dulu' : 'Pilih Kelurahan',
                                  prefixIcon: Icons.map_outlined,
                                  enabled: _kecamatanController.text.isNotEmpty,
                                  value: _selectedKelurahan,
                                  items: _availableKelurahanList
                                      .map((k) => DropdownItem(value: k, label: k.toLowerCase().startsWith('kel') ? k : 'Kel. $k'))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null && val != _selectedKelurahan) {
                                      setState(() {
                                        _selectedKelurahan = val;
                                        _selectedRw = null;
                                      });
                                    }
                                  },
                                ),
                                 const SizedBox(height: 16),
                                 _buildLabel('RW'),
                                 const SizedBox(height: 6),
                                  SearchableDropdownField<String>(
                                    labelText: 'RW',
                                    hintText: _selectedKelurahan == null ? 'Pilih Kelurahan dulu' : 'Pilih RW',
                                    prefixIcon: Icons.location_city_rounded,
                                    enabled: _selectedKelurahan != null,
                                    value: _selectedRw,
                                    items: _availableRwList
                                        .map((rw) => DropdownItem(
                                              value: rw,
                                              label: 'RW $rw',
                                            ))
                                        .toList(),
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() => _selectedRw = val);
                                      }
                                    },
                                  ),
                                 const SizedBox(height: 16),
                              ],

                              if (_selectedRole == 'Mahasiswa') ...[
                                _buildLabel('NIM (NOMOR INDUK MAHASISWA)'),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nimController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  decoration: const InputDecoration(
                                    hintText: '8-10 digit NIM',
                                    prefixIcon: Icon(Icons.badge_outlined, color: AppColors.textSecondary, size: 20),
                                  ),
                                  validator: (v) {
                                    if (_selectedRole == 'Mahasiswa') {
                                      if (v == null || v.trim().isEmpty) {
                                        return 'NIM wajib diisi';
                                      }
                                      final clean = v.trim();
                                      if (clean.length < 8 || clean.length > 10) {
                                        return 'Format NIM tidak valid (8-10 digit)';
                                      }
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
                                           _buildLabel('UNIVERSITAS'),
                                           const SizedBox(height: 6),
                                           TextFormField(
                                             controller: _universitasController,
                                             decoration: const InputDecoration(
                                               hintText: 'Perguruan Tinggi',
                                               prefixIcon: Icon(Icons.apartment_rounded, color: AppColors.textSecondary, size: 20),
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
                                           _buildLabel('JENJANG'),
                                           const SizedBox(height: 6),
                                           DropdownButtonFormField<String>(
                                             isExpanded: true,
                                             initialValue: _selectedJenjang,
                                             decoration: const InputDecoration(
                                               prefixIcon: Icon(Icons.workspace_premium_outlined, color: AppColors.textSecondary, size: 20),
                                             ),
                                             items: _jenjangList.map((j) => DropdownMenuItem(value: j, child: Text(j, overflow: TextOverflow.ellipsis))).toList(),
                                             onChanged: (val) {
                                               if (val != null) setState(() => _selectedJenjang = val);
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
                                           _buildLabel('NAMA DPL'),
                                           const SizedBox(height: 6),
                                           TextFormField(
                                             controller: _dplNameController,
                                             decoration: const InputDecoration(
                                               hintText: 'Nama Dosen DPL',
                                               prefixIcon: Icon(Icons.person_pin_rounded, color: AppColors.textSecondary, size: 20),
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
                                     const SizedBox(width: 16),
                                     Expanded(
                                       child: Column(
                                         crossAxisAlignment: CrossAxisAlignment.start,
                                         children: [
                                           _buildLabel('PROGRAM STUDI (PRODI)'),
                                           const SizedBox(height: 6),
                                           TextFormField(
                                             controller: _jurusanController,
                                             decoration: const InputDecoration(
                                               hintText: 'Program Studi / Prodi',
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
                                   ],
                                 ),
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
                                      () => _obscurePassword = !_obscurePassword,
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
                              const SizedBox(height: 12),
                              ValueListenableBuilder<TextEditingValue>(
                                valueListenable: _passwordController,
                                builder: (context, value, child) {
                                  return PasswordStrengthWidget(password: value.text);
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
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: authState.isLoading ? null : _onRegister,
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
                                            Icon(
                                              Icons.person_add_alt_1_rounded,
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
                          '© 2026 Universitas Komputer Indonesia. All rights reserved.',
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