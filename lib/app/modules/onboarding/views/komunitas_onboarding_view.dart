import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/input_sanitizer.dart';

import '../../../data/providers/repository_providers.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';

/// Halaman "Bergabung Komunitas Berseka" — Warga melengkapi data
/// wilayah dan alamat sebelum aktivasi Tempat Sampah.
class KomunitasOnboardingView extends ConsumerStatefulWidget {
  const KomunitasOnboardingView({super.key});

  @override
  ConsumerState<KomunitasOnboardingView> createState() =>
      _KomunitasOnboardingViewState();
}

class _KomunitasOnboardingViewState
    extends ConsumerState<KomunitasOnboardingView> {
  final _formKey = GlobalKey<FormState>();
  final _alamatController = TextEditingController();
  final _familySizeController = TextEditingController(text: '1');
  final _provinsiController = TextEditingController();
  final _kotaController = TextEditingController();
  final _kecamatanController = TextEditingController();

  String? _selectedKelurahan;
  String? _selectedRw;

  final List<String> _provinsiList = [];
  final List<String> _kotaList = [];
  final List<String> _kecamatanList = [];
  final List<String> _kelurahanList = [];
  final Map<String, List<String>> _rwByKelurahan = {};
  final Map<String, List<String>> _kelurahanByKecamatan = {};
  final Map<String, List<String>> _kecamatanByKota = {};
  final Map<String, List<String>> _kotaByProvinsi = {};

  bool _isLoading = false;
  bool _isLoadingTerritories = true;

  List<String> get _availableRwList {
    if (_selectedKelurahan == null || _selectedKelurahan!.isEmpty) return [];
    final targetKel = _selectedKelurahan!.trim().toLowerCase();
    for (final entry in _rwByKelurahan.entries) {
      if (entry.key.trim().toLowerCase() == targetKel &&
          entry.value.isNotEmpty) {
        final rws = entry.value.toSet().toList();
        rws.sort((a, b) {
          int ia = int.tryParse(a.replaceAll(RegExp(r'[^\d]'), '')) ?? 0;
          int ib = int.tryParse(b.replaceAll(RegExp(r'[^\d]'), '')) ?? 0;
          return ia.compareTo(ib);
        });
        return rws;
      }
    }
    return [];
  }

  List<String> get _availableKelurahanList {
    if (_kecamatanController.text.isEmpty) return _kelurahanList;
    final kec = _kecamatanController.text.trim().toLowerCase();
    for (final entry in _kelurahanByKecamatan.entries) {
      if (entry.key.trim().toLowerCase() == kec && entry.value.isNotEmpty) {
        final kels = entry.value.toSet().toList()..sort();
        return kels;
      }
    }
    return _kelurahanList;
  }

  List<String> get _availableKecamatanList {
    if (_kotaController.text.isEmpty) return _kecamatanList;
    final kota = _kotaController.text.trim().toLowerCase();
    for (final entry in _kecamatanByKota.entries) {
      if (entry.key.trim().toLowerCase() == kota && entry.value.isNotEmpty) {
        final kecs = entry.value.toSet().toList()..sort();
        return kecs;
      }
    }
    return _kecamatanList;
  }

  List<String> get _availableKotaList {
    if (_provinsiController.text.isEmpty) return _kotaList;
    final prov = _provinsiController.text.trim().toLowerCase();
    for (final entry in _kotaByProvinsi.entries) {
      if (entry.key.trim().toLowerCase() == prov && entry.value.isNotEmpty) {
        final kotas = entry.value.toSet().toList()..sort();
        return kotas;
      }
    }
    return _kotaList;
  }

  @override
  void initState() {
    super.initState();
    _loadTerritories();
  }

  @override
  void dispose() {
    _alamatController.dispose();
    _familySizeController.dispose();
    _provinsiController.dispose();
    _kotaController.dispose();
    _kecamatanController.dispose();
    super.dispose();
  }

  String _cleanTerritoryName(dynamic val) {
    if (val == null) return '';
    if (val is Map) {
      final n = val['name'] ?? val['nama'] ?? val['title'] ?? val['label'];
      if (n != null) return _cleanTerritoryName(n);
    }
    String str = val.toString().trim();
    if (str.contains('{') && str.contains('name:')) {
      final match = RegExp(r'name:\s*([\w\s]+?)(?:,|\})', caseSensitive: false)
          .firstMatch(str);
      if (match != null) str = match.group(1)?.trim() ?? str;
    }
    return str
        .replaceAll(RegExp(r'[\{\}]'), '')
        .replaceAll(RegExp(r'id:\s*\d+'), '')
        .trim();
  }

  Future<void> _loadTerritories() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final res = await repo.fetchTerritories();
      final provsRaw = (res['provinsis'] as List?)
              ?.map((e) => _cleanTerritoryName(e))
              .where((e) => e.isNotEmpty && !e.contains('id:'))
              .toList() ??
          [];
      final kotasRaw = (res['kotas'] as List?)
              ?.map((e) => _cleanTerritoryName(e))
              .where((e) => e.isNotEmpty && !e.contains('id:'))
              .toList() ??
          [];
      final kecsRaw = (res['kecamatans'] as List?)
              ?.map((e) => _cleanTerritoryName(e))
              .where((e) => e.isNotEmpty && !e.contains('id:'))
              .toList() ??
          [];
      final kelsRaw = (res['kelurahans'] as List?)
              ?.map((e) => _cleanTerritoryName(e))
              .where((e) => e.isNotEmpty && !e.contains('id:'))
              .toList() ??
          [];

      if (mounted) {
        setState(() {
          _provinsiList
            ..clear()
            ..addAll(provsRaw);
          _kotaList
            ..clear()
            ..addAll(kotasRaw);
          _kecamatanList
            ..clear()
            ..addAll(kecsRaw);
          _kelurahanList
            ..clear()
            ..addAll(kelsRaw);

          _rwByKelurahan.clear();
          final rawRtRw = res['rawRtRw'] as List<dynamic>? ?? [];
          for (final item in rawRtRw) {
            if (item is Map) {
              final itemMap = Map<String, dynamic>.from(item);
              final kelName = _cleanTerritoryName(itemMap['kelurahan']);
              final rwName = _cleanTerritoryName(itemMap['name']);
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
            if (item is Map) {
              final itemMap = Map<String, dynamic>.from(item);
              final kecObj = itemMap['kecamatan'];
              final kecName = _cleanTerritoryName(
                  kecObj != null ? (kecObj is Map ? kecObj['name'] : kecObj) : '');
              final kelName = _cleanTerritoryName(itemMap['name']);
              if (kecName.isNotEmpty && kelName.isNotEmpty) {
                _kelurahanByKecamatan.putIfAbsent(kecName, () => []);
                if (!_kelurahanByKecamatan[kecName]!.contains(kelName)) {
                  _kelurahanByKecamatan[kecName]!.add(kelName);
                }
              }
            }
          }

          _isLoadingTerritories = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingTerritories = false);
    }
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_provinsiController.text.trim().isEmpty) {
      _showError('Provinsi wajib dipilih');
      return;
    }
    if (_kotaController.text.trim().isEmpty) {
      _showError('Kota / Kabupaten wajib dipilih');
      return;
    }
    if (_kecamatanController.text.trim().isEmpty) {
      _showError('Kecamatan wajib dipilih');
      return;
    }
    if (_selectedKelurahan == null || _selectedKelurahan!.trim().isEmpty) {
      _showError('Kelurahan wajib dipilih');
      return;
    }
    if (_selectedRw == null || _selectedRw!.trim().isEmpty) {
      _showError('RW wajib dipilih');
      return;
    }

    final address = InputSanitizer.sanitize(_alamatController.text);
    if (address.isEmpty) {
      _showError('Alamat rumah wajib diisi');
      return;
    }
    final familyCount = int.tryParse(_familySizeController.text.trim());
    if (familyCount == null || familyCount < 1) {
      _showError('Jumlah anggota keluarga minimal 1');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = ref.read(authProvider).user;
      if (user == null) {
        _showError('Sesi tidak valid. Silakan login ulang.');
        setState(() => _isLoading = false);
        return;
      }

      final ok = await ref.read(authProvider.notifier).updateProfile(
            name: user.name,
            phone: user.phone,
            address: address,
            kecamatan: InputSanitizer.sanitize(_kecamatanController.text),
            kelurahan: _selectedKelurahan,
            rw: _selectedRw != null ? 'RW $_selectedRw' : null,
            familySize: familyCount,
          );

      if (ok && mounted) {
        // Refresh profil untuk mendapatkan householdId terbaru
        await ref.read(authProvider.notifier).fetchProfile();

        if (mounted) {
          Navigator.of(context).pushReplacementNamed(AppRoutes.ukurKapasitas);
        }
      } else if (mounted) {
        _showError('Gagal memperbarui data. Silakan coba lagi.');
      }
    } catch (e) {
      if (mounted) _showError('Terjadi kesalahan: $e');
    }

    if (mounted) setState(() => _isLoading = false);
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.dangerRed,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        title: const Text('Bergabung Komunitas'),
        centerTitle: true,
        elevation: 0,
      ),
      body: _isLoadingTerritories
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info card
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              AppColors.primaryGreen.withValues(alpha: 0.2),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_rounded,
                              color: AppColors.primaryGreen, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Lengkapi data wilayah Anda untuk bergabung komunitas Berseka dan mulai aktivasi Tempat Sampah.',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.primaryGreen),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ─── Data Wilayah ───
                    const Text(
                      'Data Wilayah',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // Provinsi
                    _buildLabel('Provinsi'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _provinsiController.text.isEmpty ? null : _provinsiController.text,
                      isExpanded: true,
                      decoration: _dropdownDecoration(),
                      hint: const Text('Pilih Provinsi', style: TextStyle(fontSize: 14)),
                      items: _provinsiList
                          .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          _provinsiController.text = val ?? '';
                          _kotaController.clear();
                          _kecamatanController.clear();
                          _selectedKelurahan = null;
                          _selectedRw = null;
                        });
                      },
                      validator: (v) => (v == null || v.isEmpty) ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 12),

                    // Kota
                    _buildLabel('Kota / Kabupaten'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _kotaController.text.isEmpty ? null : _kotaController.text,
                      isExpanded: true,
                      decoration: _dropdownDecoration(),
                      hint: const Text('Pilih Kota / Kabupaten', style: TextStyle(fontSize: 14)),
                      items: _availableKotaList
                          .map((k) => DropdownMenuItem(value: k, child: Text(k)))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          _kotaController.text = val ?? '';
                          _kecamatanController.clear();
                          _selectedKelurahan = null;
                          _selectedRw = null;
                        });
                      },
                      validator: (v) => (v == null || v.isEmpty) ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 12),

                    // Kecamatan
                    _buildLabel('Kecamatan'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _kecamatanController.text.isEmpty ? null : _kecamatanController.text,
                      isExpanded: true,
                      decoration: _dropdownDecoration(),
                      hint: const Text('Pilih Kecamatan', style: TextStyle(fontSize: 14)),
                      items: _availableKecamatanList
                          .map((k) => DropdownMenuItem(value: k, child: Text(k)))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          _kecamatanController.text = val ?? '';
                          _selectedKelurahan = null;
                          _selectedRw = null;
                        });
                      },
                      validator: (v) => (v == null || v.isEmpty) ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 12),

                    // Kelurahan
                    _buildLabel('Kelurahan'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedKelurahan,
                      isExpanded: true,
                      decoration: _dropdownDecoration(),
                      hint: const Text('Pilih Kelurahan',
                          style: TextStyle(fontSize: 14)),
                      items: _availableKelurahanList
                          .map((k) =>
                              DropdownMenuItem(value: k, child: Text(k)))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedKelurahan = val;
                          _selectedRw = null;
                        });
                      },
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 12),

                    // RW
                    _buildLabel('RW'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedRw,
                      isExpanded: true,
                      decoration: _dropdownDecoration(),
                      hint: const Text('Pilih RW',
                          style: TextStyle(fontSize: 14)),
                      items: _availableRwList
                          .map((r) => DropdownMenuItem(
                              value: r, child: Text('RW $r')))
                          .toList(),
                      onChanged: (val) => setState(() => _selectedRw = val),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 20),

                    // ─── Data Pribadi ───
                    const Text(
                      'Data Pribadi',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // Alamat
                    _buildLabel('Alamat Rumah'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _alamatController,
                      textCapitalization: TextCapitalization.sentences,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Contoh: Jl. Merdeka No. 10',
                        hintStyle: const TextStyle(fontSize: 14),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primaryGreen, width: 1.5),
                        ),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Alamat wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: 12),

                    // Jumlah Keluarga
                    _buildLabel('Jumlah Anggota Keluarga'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _familySizeController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        hintText: 'Contoh: 4',
                        hintStyle: const TextStyle(fontSize: 14),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        prefixIcon: const Icon(Icons.people_outline_rounded,
                            color: AppColors.textSecondary, size: 20),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primaryGreen, width: 1.5),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                        final n = int.tryParse(v.trim());
                        if (n == null || n < 1) return 'Minimal 1';
                        return null;
                      },
                    ),
                    const SizedBox(height: 28),

                    // Tombol Submit
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _onSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Bergabung & Aktivasi',
                                      style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700)),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 20),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
    );
  }

  InputDecoration _dropdownDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide:
            const BorderSide(color: AppColors.primaryGreen, width: 1.5),
      ),
    );
  }
}
