import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../../../data/models/bin_entity.dart';
import '../../scan/controllers/scan_controller.dart';

class UkurKapasitasView extends ConsumerStatefulWidget {
  const UkurKapasitasView({super.key});

  @override
  ConsumerState<UkurKapasitasView> createState() => _UkurKapasitasViewState();
}

class _UkurKapasitasViewState extends ConsumerState<UkurKapasitasView> {
  // Step navigation: 1 = Pilih bentuk, 2 = Data ukuran
  int _currentStep = 1;

  // Selected shape: 'tabung' (Keranjang Bulat) atau 'kotak' (Bak Kotak)
  String _selectedShape = 'tabung';

  // Target kategori wadah yang didaftarkan: 'organic', 'non_organic', atau 'both'
  String _targetCategory = 'both';
  bool _argsLoaded = false;

  // Toggle apakah ukuran Organik & Anorganik identik (Default: true)
  bool _sameSizeForBoth = true;
  int _activeBinTab = 0; // 0 = Organik, 1 = Anorganik (jika _sameSizeForBoth == false)

  // Controllers untuk wadah utama (atau Organik)
  final TextEditingController _diameterCtrl = TextEditingController();
  final TextEditingController _tinggiCtrl = TextEditingController();
  final TextEditingController _panjangCtrl = TextEditingController();
  final TextEditingController _lebarCtrl = TextEditingController();

  // Controllers terpisah untuk wadah Anorganik (jika ukurannya berbeda)
  final TextEditingController _anorgDiameterCtrl = TextEditingController();
  final TextEditingController _anorgTinggiCtrl = TextEditingController();
  final TextEditingController _anorgPanjangCtrl = TextEditingController();
  final TextEditingController _anorgLebarCtrl = TextEditingController();

  // Index preset ukuran default yang dipilih (0: Kecil, 1: Sedang/Standar, 2: Besar, 3: Jumbo, -1: Kustom)
  int _orgPresetIndex = 1;
  int _anorgPresetIndex = 1;
  bool _isApplyingPreset = false;

  int get _currentPresetIndex {
    final bool isBoth = _targetCategory == 'both';
    final bool isOrgActive = !isBoth || _sameSizeForBoth || _activeBinTab == 0;
    return isOrgActive ? _orgPresetIndex : _anorgPresetIndex;
  }

  static const List<_BinPreset> _roundPresets = [
    _BinPreset(label: 'Kecil', capacity: 10.0, d: 23, t: 24),
    _BinPreset(label: 'Sedang', capacity: 20.0, d: 29, t: 30),
    _BinPreset(label: 'Besar', capacity: 40.0, d: 36, t: 39),
    _BinPreset(label: 'Jumbo', capacity: 60.0, d: 40, t: 48),
  ];

  static const List<_BinPreset> _boxPresets = [
    _BinPreset(label: 'Kecil', capacity: 12.0, p: 25, l: 20, t: 24),
    _BinPreset(label: 'Sedang', capacity: 25.0, p: 40, l: 25, t: 25),
    _BinPreset(label: 'Besar', capacity: 50.0, p: 40, l: 35, t: 36),
    _BinPreset(label: 'Jumbo', capacity: 70.0, p: 45, l: 35, t: 45),
  ];

  void _applyPresetByIndex(int index, {required String shape, bool updateBoth = true}) {
    if (index < 0) return;
    final presets = shape == 'tabung' ? _roundPresets : _boxPresets;
    if (index >= presets.length) return;
    final p = presets[index];

    final isAnorgTab = !_sameSizeForBoth && _activeBinTab == 1;

    _isApplyingPreset = true;
    try {
      if (isAnorgTab) {
        _anorgPresetIndex = index;
      } else {
        _orgPresetIndex = index;
        if (updateBoth) {
          _anorgPresetIndex = index;
        }
      }

      if (shape == 'tabung') {
        if (isAnorgTab) {
          _anorgDiameterCtrl.text = p.d.toStringAsFixed(0);
          _anorgTinggiCtrl.text = p.t.toStringAsFixed(0);
        } else {
          _diameterCtrl.text = p.d.toStringAsFixed(0);
          _tinggiCtrl.text = p.t.toStringAsFixed(0);
          if (updateBoth) {
            _anorgDiameterCtrl.text = p.d.toStringAsFixed(0);
            _anorgTinggiCtrl.text = p.t.toStringAsFixed(0);
          }
        }
      } else {
        if (isAnorgTab) {
          _anorgPanjangCtrl.text = p.p.toStringAsFixed(0);
          _anorgLebarCtrl.text = p.l.toStringAsFixed(0);
          _anorgTinggiCtrl.text = p.t.toStringAsFixed(0);
        } else {
          _panjangCtrl.text = p.p.toStringAsFixed(0);
          _lebarCtrl.text = p.l.toStringAsFixed(0);
          _tinggiCtrl.text = p.t.toStringAsFixed(0);
          if (updateBoth) {
            _anorgPanjangCtrl.text = p.p.toStringAsFixed(0);
            _anorgLebarCtrl.text = p.l.toStringAsFixed(0);
            _anorgTinggiCtrl.text = p.t.toStringAsFixed(0);
          }
        }
      }
    } finally {
      _isApplyingPreset = false;
    }
  }

  @override
  void initState() {
    super.initState();
    // Inisialisasi controller dengan preset default: Sedang (Standar)
    _applyPresetByIndex(1, shape: _selectedShape, updateBoth: true);

    // Tambahkan listener agar jika dimensi diedit manual, preset index dilepas (-1) dan estimasi terhitung live
    _diameterCtrl.addListener(_onOrgDimensionChanged);
    _tinggiCtrl.addListener(_onOrgDimensionChanged);
    _panjangCtrl.addListener(_onOrgDimensionChanged);
    _lebarCtrl.addListener(_onOrgDimensionChanged);

    _anorgDiameterCtrl.addListener(_onAnorgDimensionChanged);
    _anorgTinggiCtrl.addListener(_onAnorgDimensionChanged);
    _anorgPanjangCtrl.addListener(_onAnorgDimensionChanged);
    _anorgLebarCtrl.addListener(_onAnorgDimensionChanged);
  }

  void _onOrgDimensionChanged() {
    if (_isApplyingPreset) return;
    if (_orgPresetIndex >= 0) {
      final presets = _selectedShape == 'tabung' ? _roundPresets : _boxPresets;
      if (_orgPresetIndex < presets.length) {
        final p = presets[_orgPresetIndex];
        final bool stillMatches = _selectedShape == 'tabung'
            ? _diameterCtrl.text == p.d.toStringAsFixed(0) &&
                _tinggiCtrl.text == p.t.toStringAsFixed(0)
            : _panjangCtrl.text == p.p.toStringAsFixed(0) &&
                _lebarCtrl.text == p.l.toStringAsFixed(0) &&
                _tinggiCtrl.text == p.t.toStringAsFixed(0);
        if (!stillMatches) {
          _orgPresetIndex = -1;
        }
      }
    }
    if (mounted) setState(() {});
  }

  void _onAnorgDimensionChanged() {
    if (_isApplyingPreset) return;
    if (_anorgPresetIndex >= 0) {
      final presets = _selectedShape == 'tabung' ? _roundPresets : _boxPresets;
      if (_anorgPresetIndex < presets.length) {
        final p = presets[_anorgPresetIndex];
        final bool stillMatches = _selectedShape == 'tabung'
            ? _anorgDiameterCtrl.text == p.d.toStringAsFixed(0) &&
                _anorgTinggiCtrl.text == p.t.toStringAsFixed(0)
            : _anorgPanjangCtrl.text == p.p.toStringAsFixed(0) &&
                _anorgLebarCtrl.text == p.l.toStringAsFixed(0) &&
                _anorgTinggiCtrl.text == p.t.toStringAsFixed(0);
        if (!stillMatches) {
          _anorgPresetIndex = -1;
        }
      }
    }
    if (mounted) setState(() {});
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_argsLoaded) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null && args['targetType'] != null) {
        _targetCategory = args['targetType'].toString();
      }
      _argsLoaded = true;
    }
  }

  @override
  void dispose() {
    _diameterCtrl.dispose();
    _tinggiCtrl.dispose();
    _panjangCtrl.dispose();
    _lebarCtrl.dispose();

    _anorgDiameterCtrl.dispose();
    _anorgTinggiCtrl.dispose();
    _anorgPanjangCtrl.dispose();
    _anorgLebarCtrl.dispose();
    super.dispose();
  }

  // ponytail: standard preset capacity is prioritized for UI consistency; raw formula fallback for manual custom inputs.
  double _getCapacityFor({
    required bool isOrganik,
    required String shape,
  }) {
    final bool isBoth = _targetCategory == 'both';
    final bool usePrimaryCtrl = !isBoth || _sameSizeForBoth || isOrganik;

    final presetIdx = usePrimaryCtrl ? _orgPresetIndex : _anorgPresetIndex;
    final presets = shape == 'tabung' ? _roundPresets : _boxPresets;

    if (presetIdx >= 0 && presetIdx < presets.length) {
      return presets[presetIdx].capacity;
    }

    final dCtrl = usePrimaryCtrl ? _diameterCtrl : _anorgDiameterCtrl;
    final tCtrl = usePrimaryCtrl ? _tinggiCtrl : _anorgTinggiCtrl;
    final pCtrl = usePrimaryCtrl ? _panjangCtrl : _anorgPanjangCtrl;
    final lCtrl = usePrimaryCtrl ? _lebarCtrl : _anorgLebarCtrl;

    return _calculateRawCapacity(
      shape: shape,
      dCtrl: dCtrl,
      tCtrl: tCtrl,
      pCtrl: pCtrl,
      lCtrl: lCtrl,
    );
  }

  double _calculateRawCapacity({
    required String shape,
    required TextEditingController dCtrl,
    required TextEditingController tCtrl,
    required TextEditingController pCtrl,
    required TextEditingController lCtrl,
  }) {
    if (shape == 'tabung') {
      final d = double.tryParse(dCtrl.text) ?? 0.0;
      final t = double.tryParse(tCtrl.text) ?? 0.0;
      final r = d / 2.0;
      return (math.pi * r * r * t) / 1000.0; // cm3 to liter
    } else {
      final p = double.tryParse(pCtrl.text) ?? 0.0;
      final l = double.tryParse(lCtrl.text) ?? 0.0;
      final t = double.tryParse(tCtrl.text) ?? 0.0;
      return (p * l * t) / 1000.0;
    }
  }

  void _submit() {
    final bool isOrgOnly = _targetCategory == 'organic';
    final bool isNonOrgOnly = _targetCategory == 'non_organic';

    double orgVol = 0.0;
    double anorgVol = 0.0;

    if (isOrgOnly) {
      orgVol = _getCapacityFor(isOrganik: true, shape: _selectedShape);
      if (orgVol <= 0.0) {
        _showError('Mohon isi ukuran dimensi Tempat Sampah Organik');
        return;
      }
    } else if (isNonOrgOnly) {
      anorgVol = _getCapacityFor(isOrganik: false, shape: _selectedShape);
      if (anorgVol <= 0.0) {
        _showError('Mohon isi ukuran dimensi Tempat Sampah Anorganik');
        return;
      }
    } else {
      orgVol = _getCapacityFor(isOrganik: true, shape: _selectedShape);
      anorgVol = _sameSizeForBoth
          ? orgVol
          : _getCapacityFor(isOrganik: false, shape: _selectedShape);

      if (orgVol <= 0.0) {
        _showError('Mohon isi ukuran dimensi Tempat Sampah Organik');
        return;
      }
      if (!_sameSizeForBoth && anorgVol <= 0.0) {
        _showError('Mohon isi ukuran dimensi Tempat Sampah Anorganik');
        return;
      }
    }

    // Lanjut ke aktivasi barcode (sesuai mode pilihan warga: 1 atau 2 tempat sampah)
    Navigator.pushReplacementNamed(
      context,
      AppRoutes.aktivasiBin,
      arguments: {
        'targetType': _targetCategory,
        'orgCapacity': orgVol,
        'anorgCapacity': anorgVol,
        'hasOrganic': isNonOrgOnly,
        'hasAnorganic': isOrgOnly,
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.dangerRed,
      ),
    );
  }

  bool _hasUnsavedChanges() {
    return _diameterCtrl.text.isNotEmpty ||
        _tinggiCtrl.text.isNotEmpty ||
        _panjangCtrl.text.isNotEmpty ||
        _lebarCtrl.text.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        if (_currentStep == 2) {
          setState(() => _currentStep = 1);
          return;
        }

        if (!_hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Batalkan Registrasi?', style: TextStyle(fontWeight: FontWeight.bold)),
              content: const Text('Perubahan data ukuran ini akan terhapus jika Anda keluar.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Lanjutkan Edit', style: TextStyle(color: AppColors.textSecondary)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Keluar'),
                ),
              ],
            );
          },
        );

        if (shouldPop == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () {
              if (_currentStep == 2) {
                setState(() => _currentStep = 1);
              } else {
                Navigator.pop(context);
              }
            },
          ),
          title: Row(
            children: [
              const Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 22),
              const SizedBox(width: 8),
              Text(
                _currentStep == 1 ? 'Registrasi Tempat Sampah' : 'Data Ukuran',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                ),
              ),
            ],
          ),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(24),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Langkah $_currentStep dari 2',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: _currentStep == 1 ? 0.5 : 1.0,
                      backgroundColor: const Color(0xFFE2E8F0),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      minHeight: 4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        body: SafeArea(
          top: false,
          bottom: false,
          child: _currentStep == 1 ? _buildStep1() : _buildStep2(),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGKAH 1: PILIH BENTUK TEMPAT SAMPAH (KERANJANG BULAT & BAK KOTAK)
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep1() {
    final binsAsync = ref.watch(binsProvider);
    final bins = binsAsync.value ?? [];
    final hasOrganic = bins.any(
      (b) => b.binType == WasteType.organic && b.isActive,
    );
    final hasNonOrganic = bins.any(
      (b) => b.binType == WasteType.nonOrganic && b.isActive,
    );
    final isPostOnboarding = hasOrganic && hasNonOrganic;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isPostOnboarding)
                  _buildTargetCategorySelector()
                else
                  _buildOnboardingNotice(),

                const Text(
                  'Pilih bentuk tempat sampah',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Pilih bentuk fisik tempat sampah yang akan didaftarkan ke sistem.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),

                // Kartu 1: Keranjang Bulat / Tabung
                _buildShapeCard(
                  id: 'tabung',
                  title: 'Keranjang Bulat',
                  subtitle: 'Untuk keranjang atau wadah tempat sampah berbentuk bulat / silinder',
                  imagePath: 'assets/step_1/diagram_bulat.jpg',
                  color: const Color(0xFFD97706),
                ),
                const SizedBox(height: 16),

                // Kartu 2: Bak Kotak
                _buildShapeCard(
                  id: 'kotak',
                  title: 'Bak Kotak',
                  subtitle: 'Untuk bak atau tempat sampah berbentuk kotak / balok',
                  imagePath: 'assets/step_1/wadah_kotak.png',
                  color: const Color(0xFF475569),
                ),
              ],
            ),
          ),
        ),

        // Footer slogan & Tombol Lanjutkan dengan SafeArea agar tidak nabrak navbar HP
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Bersama untuk lingkungan yang lebih bersih',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => setState(() => _currentStep = 2),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 1,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Lanjutkan',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildShapeCard({
    required String id,
    required String title,
    required String subtitle,
    required String imagePath,
    required Color color,
  }) {
    final bool isSelected = _selectedShape == id;

    return GestureDetector(
      onTap: () => setState(() {
        _selectedShape = id;
        final targetIdx = _currentPresetIndex >= 0 ? _currentPresetIndex : 1;
        _applyPresetByIndex(targetIdx, shape: id, updateBoth: true);
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : const Color(0xFFE2E8F0),
            width: isSelected ? 2.2 : 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                  : Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Ilustrasi wadah: Background putih bersih, zoom fokus ke wadah agar tajam & proporsional
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected
                      ? AppColors.primaryGreen
                      : const Color(0xFFE2E8F0),
                  width: isSelected ? 2.0 : 1.2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: Transform.scale(
                scale: 1.45,
                alignment: const Alignment(0, -0.22),
                child: Image.asset(
                  imagePath,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: CustomPaint(
                      size: const Size(60, 60),
                      painter: _BinShapePainter(shape: id, primaryColor: color),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primaryGreen : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.primaryGreen : const Color(0xFFCBD5E1),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTargetCategorySelector() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.tune_rounded, color: AppColors.primaryGreen, size: 20),
              SizedBox(width: 8),
              Text(
                'Pilih Kategori Tempat Sampah',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Anda sudah memiliki Tempat Sampah aktif. Anda bebas memilih untuk menambah 1 wadah atau sepasang.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildCategoryChip(
                  label: 'Organik (1)',
                  value: 'organic',
                  color: AppColors.organicColor,
                  icon: Icons.eco_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildCategoryChip(
                  label: 'Anorganik (1)',
                  value: 'non_organic',
                  color: AppColors.nonOrganicColor,
                  icon: Icons.category_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildCategoryChip(
                  label: 'Keduanya (2)',
                  value: 'both',
                  color: AppColors.primaryGreen,
                  icon: Icons.all_inclusive_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    final bool isSelected = _targetCategory == value;
    return GestureDetector(
      onTap: () => setState(() => _targetCategory = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.12) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : const Color(0xFFE2E8F0),
            width: isSelected ? 1.8 : 1.0,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: isSelected ? color : AppColors.textSecondary),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? color : AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOnboardingNotice() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryGreenLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Aktivasi Awal: Wajib mendaftarkan sepasang Tempat Sampah (Organik & Anorganik) untuk memulai pemilahan.',
              style: TextStyle(fontSize: 12, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPresetSizeSelector() {
    final presets = _selectedShape == 'tabung' ? _roundPresets : _boxPresets;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.straighten_rounded,
                color: AppColors.primaryGreen,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'Ukuran Standar (Tinggal Pilih)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Text(
                'Kecil ➔ Besar',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Pilih ukuran umum tempat sampah di bawah ini:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(presets.length, (idx) {
              final p = presets[idx];
              final isSelected = _currentPresetIndex == idx;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: idx < presets.length - 1 ? 6 : 0,
                  ),
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _applyPresetByIndex(
                          idx,
                          shape: _selectedShape,
                          updateBoth: _sameSizeForBoth,
                        );
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 10,
                        horizontal: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primaryGreen.withValues(alpha: 0.12)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primaryGreen
                              : const Color(0xFFCBD5E1),
                          width: isSelected ? 1.8 : 1.0,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            p.label,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.w600,
                              color: isSelected
                                  ? AppColors.primaryGreen
                                  : AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            p.capacityLabel,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: isSelected
                                  ? AppColors.primaryGreen
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGKAH 2: DATA UKURAN
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep2() {
    final bool isOrgOnly = _targetCategory == 'organic';
    final bool isBoth = _targetCategory == 'both';

    // Tentukan controller yang sedang aktif
    final bool isOrgActive = !isBoth || _sameSizeForBoth || _activeBinTab == 0;
    final dCtrl = isOrgActive ? _diameterCtrl : _anorgDiameterCtrl;
    final tCtrl = isOrgActive ? _tinggiCtrl : _anorgTinggiCtrl;
    final pCtrl = isOrgActive ? _panjangCtrl : _anorgPanjangCtrl;
    final lCtrl = isOrgActive ? _lebarCtrl : _anorgLebarCtrl;

    final double currentCapacity = _getCapacityFor(
      isOrganik: isOrgActive,
      shape: _selectedShape,
    );

    final String diagramImagePath = _selectedShape == 'tabung'
        ? 'assets/step_2/wadah_bulat.jpg'
        : 'assets/step_2/wadah_kotak.jpg';

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Ilustrasi Diagram Dimensi Wadah dengan Panah (Load gambar asset dengan fallback vektor)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Center(
                    child: SizedBox(
                      height: 180,
                      child: Image.asset(
                        diagramImagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => CustomPaint(
                          size: const Size(220, 140),
                          painter: _BinDimensionDiagramPainter(shape: _selectedShape),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Opsi Dual-Bin Berseka: Ukuran sama atau terpisah (jika mode both)
                if (isBoth) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.tune_rounded, color: AppColors.primaryGreen, size: 20),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Ukuran sama untuk Organik & Anorganik',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Switch(
                          value: _sameSizeForBoth,
                          activeThumbColor: AppColors.primaryGreen,
                          activeTrackColor: AppColors.primaryGreenLight,
                          onChanged: (val) {
                            setState(() {
                              _sameSizeForBoth = val;
                              if (val) {
                                _activeBinTab = 0;
                                _anorgPresetIndex = _orgPresetIndex;
                              }
                            });
                          },
                        ),
                      ],
                    ),
                  ),

                  if (!_sameSizeForBoth) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildBinTabButton(
                            title: 'Organik (Hijau)',
                            isSelected: _activeBinTab == 0,
                            activeColor: AppColors.organicColor,
                            onTap: () => setState(() => _activeBinTab = 0),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildBinTabButton(
                            title: 'Anorganik (Kuning)',
                            isSelected: _activeBinTab == 1,
                            activeColor: AppColors.nonOrganicColor,
                            onTap: () => setState(() => _activeBinTab = 1),
                          ),
                        ),
                      ],
                    ),
                  ],
                ] else ...[
                  // Single bin mode banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isOrgOnly
                          ? AppColors.organicColor.withValues(alpha: 0.1)
                          : AppColors.nonOrganicColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isOrgOnly
                            ? AppColors.organicColor.withValues(alpha: 0.4)
                            : AppColors.nonOrganicColor.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isOrgOnly ? Icons.eco_rounded : Icons.category_rounded,
                          color: isOrgOnly
                              ? AppColors.organicColor
                              : AppColors.nonOrganicColor,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            isOrgOnly
                                ? 'Kategori: Tempat Sampah Organik (Hijau)'
                                : 'Kategori: Tempat Sampah Anorganik (Kuning)',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isOrgOnly
                                  ? AppColors.organicColor
                                  : AppColors.nonOrganicColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                _buildPresetSizeSelector(),
                const SizedBox(height: 16),
                const Text(
                  'Atau sesuaikan ukuran detail manual (cm):',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 10),

                // Form Input Dimensi sesuai bentuk wadah
                if (_selectedShape == 'tabung') ...[
                  _buildDimensionField(
                    label: 'Diameter (cm)',
                    hint: 'Contoh: 40',
                    controller: dCtrl,
                  ),
                  const SizedBox(height: 12),
                  _buildDimensionField(
                    label: 'Tinggi (cm)',
                    hint: 'Contoh: 50',
                    controller: tCtrl,
                  ),
                ] else ...[
                  _buildDimensionField(
                    label: 'Panjang (cm)',
                    hint: 'Contoh: 45',
                    controller: pCtrl,
                  ),
                  const SizedBox(height: 12),
                  _buildDimensionField(
                    label: 'Lebar (cm)',
                    hint: 'Contoh: 35',
                    controller: lCtrl,
                  ),
                  const SizedBox(height: 12),
                  _buildDimensionField(
                    label: 'Tinggi (cm)',
                    hint: 'Contoh: 75',
                    controller: tCtrl,
                  ),
                ],

                const SizedBox(height: 18),

                // Kartu Realtime Estimasi Kapasitas
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreenLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primaryGreen.withValues(alpha: 0.25),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryGreen.withValues(alpha: 0.15),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.view_in_ar_rounded,
                          color: AppColors.primaryGreen,
                          size: 30,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Estimasi kapasitas',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              currentCapacity > 0
                                  ? '${currentCapacity.toStringAsFixed(currentCapacity.truncateToDouble() == currentCapacity ? 0 : 1)} liter'
                                  : '0 liter',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                            Text(
                              _currentPresetIndex >= 0
                                  ? 'Sesuai ukuran standar (${currentCapacity.toStringAsFixed(currentCapacity.truncateToDouble() == currentCapacity ? 0 : 1)} liter)'
                                  : 'Dihitung otomatis dari ukuran manual',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),

        // Action bar bawah: "Ubah bentuk" & "Simpan Tempat Sampah" dengan SafeArea responsif
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentStep = 1),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      backgroundColor: Colors.white,
                    ),
                    child: const Text(
                      'Ubah bentuk',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 3,
                  child: ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 1,
                    ),
                    child: const Text(
                      'Simpan Tempat Sampah',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBinTabButton({
    required String title,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withValues(alpha: 0.12) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isSelected ? activeColor : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDimensionField({
    required String label,
    required String hint,
    required TextEditingController controller,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
            suffixText: 'cm',
            suffixStyle: const TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.8),
            ),
          ),
        ),
      ],
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CUSTOM PAINTERS FALLBACK: DIGUNAKAN JIKA ASET GAMBAR BELUM DITARUH
// ═════════════════════════════════════════════════════════════════════════════

/// Ikon representasi visual bentuk di Step 1
class _BinShapePainter extends CustomPainter {
  final String shape;
  final Color primaryColor;

  _BinShapePainter({required this.shape, required this.primaryColor});

  @override
  void paint(Canvas canvas, Size size) {
    final fillPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    if (shape == 'tabung') {
      // Keranjang bulat / ember silinder
      final path = Path();
      path.moveTo(size.width * 0.18, size.height * 0.25);
      path.lineTo(size.width * 0.28, size.height * 0.85);
      path.quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.95,
        size.width * 0.72,
        size.height * 0.85,
      );
      path.lineTo(size.width * 0.82, size.height * 0.25);
      path.close();
      canvas.drawPath(path, fillPaint);

      // Rim atas
      final oval = Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.25),
        width: size.width * 0.65,
        height: size.height * 0.18,
      );
      canvas.drawOval(
        oval,
        Paint()
          ..color = primaryColor.withValues(alpha: 0.6)
          ..style = PaintingStyle.fill,
      );
      canvas.drawOval(oval, borderPaint);
    } else {
      // Bak kotak dengan tutup flap
      final body = Path();
      body.moveTo(size.width * 0.22, size.height * 0.38);
      body.lineTo(size.width * 0.28, size.height * 0.88);
      body.quadraticBezierTo(size.width * 0.5, size.height * 0.92, size.width * 0.72, size.height * 0.88);
      body.lineTo(size.width * 0.78, size.height * 0.38);
      body.close();
      canvas.drawPath(body, fillPaint);

      // Tutup atas
      final lid = Path();
      lid.moveTo(size.width * 0.18, size.height * 0.38);
      lid.lineTo(size.width * 0.32, size.height * 0.18);
      lid.lineTo(size.width * 0.68, size.height * 0.18);
      lid.lineTo(size.width * 0.82, size.height * 0.38);
      lid.close();
      canvas.drawPath(
        lid,
        Paint()
          ..color = primaryColor.withValues(alpha: 0.75)
          ..style = PaintingStyle.fill,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BinShapePainter oldDelegate) =>
      oldDelegate.shape != shape || oldDelegate.primaryColor != primaryColor;
}

/// Diagram dimensi dengan panah di Step 2 (fallback jika gambar diagram belum ditaruh)
class _BinDimensionDiagramPainter extends CustomPainter {
  final String shape;

  _BinDimensionDiagramPainter({required this.shape});

  @override
  void paint(Canvas canvas, Size size) {
    const arrowColor = Color(0xFF0284C7); // Biru petunjuk panah
    final arrowPaint = Paint()
      ..color = arrowColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;

    final dashPaint = Paint()
      ..color = arrowColor.withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final bodyPaint = Paint()
      ..color = shape == 'tabung' ? const Color(0xFFD97706) : const Color(0xFF475569)
      ..style = PaintingStyle.fill;

    if (shape == 'tabung') {
      // 1. Gambar silinder wadah bulat
      final binPath = Path();
      binPath.moveTo(size.width * 0.32, size.height * 0.35);
      binPath.lineTo(size.width * 0.38, size.height * 0.90);
      binPath.quadraticBezierTo(size.width * 0.5, size.height * 0.96, size.width * 0.62, size.height * 0.90);
      binPath.lineTo(size.width * 0.68, size.height * 0.35);
      binPath.close();
      canvas.drawPath(binPath, bodyPaint);

      final rim = Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.35),
        width: size.width * 0.36,
        height: size.height * 0.16,
      );
      canvas.drawOval(rim, Paint()..color = const Color(0xFFB45309));

      // 2. Panah Horizontal: "Diameter"
      final topY = size.height * 0.16;
      final leftX = size.width * 0.32;
      final rightX = size.width * 0.68;

      canvas.drawLine(Offset(leftX, topY), Offset(leftX, size.height * 0.35), dashPaint);
      canvas.drawLine(Offset(rightX, topY), Offset(rightX, size.height * 0.35), dashPaint);

      _drawDoubleArrow(canvas, Offset(leftX, topY), Offset(rightX, topY), arrowPaint);
      _drawText(canvas, 'Diameter', Offset(size.width * 0.5, topY - 14), arrowColor);

      // 3. Panah Vertikal: "Tinggi"
      final arrowSideX = size.width * 0.78;
      final bottomY = size.height * 0.92;

      canvas.drawLine(Offset(rightX, size.height * 0.35), Offset(arrowSideX, size.height * 0.35), dashPaint);
      canvas.drawLine(Offset(size.width * 0.62, bottomY), Offset(arrowSideX, bottomY), dashPaint);

      _drawDoubleArrow(canvas, Offset(arrowSideX, size.height * 0.35), Offset(arrowSideX, bottomY), arrowPaint);
      _drawText(canvas, 'Tinggi', Offset(arrowSideX + 22, (size.height * 0.35 + bottomY) / 2), arrowColor);
    } else {
      // 1. Gambar bak kotak
      final binPath = Path();
      binPath.moveTo(size.width * 0.35, size.height * 0.40);
      binPath.lineTo(size.width * 0.38, size.height * 0.90);
      binPath.lineTo(size.width * 0.62, size.height * 0.90);
      binPath.lineTo(size.width * 0.65, size.height * 0.40);
      binPath.close();
      canvas.drawPath(binPath, bodyPaint);

      // Tutup flap atas
      final flapPath = Path();
      flapPath.moveTo(size.width * 0.32, size.height * 0.40);
      flapPath.lineTo(size.width * 0.42, size.height * 0.28);
      flapPath.lineTo(size.width * 0.58, size.height * 0.28);
      flapPath.lineTo(size.width * 0.68, size.height * 0.40);
      flapPath.close();
      canvas.drawPath(flapPath, Paint()..color = const Color(0xFF334155));

      // 2. Panah Panjang & Lebar di atas
      final topY = size.height * 0.16;
      final leftX = size.width * 0.32;
      final rightX = size.width * 0.68;

      canvas.drawLine(Offset(leftX, topY), Offset(leftX, size.height * 0.40), dashPaint);
      canvas.drawLine(Offset(rightX, topY), Offset(rightX, size.height * 0.40), dashPaint);

      _drawDoubleArrow(canvas, Offset(leftX, topY), Offset(rightX, topY), arrowPaint);
      _drawText(canvas, 'Panjang / Lebar', Offset(size.width * 0.5, topY - 14), arrowColor);

      // 3. Panah Tinggi di samping
      final sideX = size.width * 0.78;
      final bottomY = size.height * 0.90;

      canvas.drawLine(Offset(size.width * 0.65, size.height * 0.40), Offset(sideX, size.height * 0.40), dashPaint);
      canvas.drawLine(Offset(size.width * 0.62, bottomY), Offset(sideX, bottomY), dashPaint);

      _drawDoubleArrow(canvas, Offset(sideX, size.height * 0.40), Offset(sideX, bottomY), arrowPaint);
      _drawText(canvas, 'Tinggi', Offset(sideX + 22, (size.height * 0.40 + bottomY) / 2), arrowColor);
    }
  }

  void _drawDoubleArrow(Canvas canvas, Offset start, Offset end, Paint paint) {
    canvas.drawLine(start, end, paint);
    const arrowSize = 4.5;

    final isHorizontal = (start.dy - end.dy).abs() < (start.dx - end.dx).abs();

    if (isHorizontal) {
      canvas.drawLine(start, Offset(start.dx + arrowSize, start.dy - arrowSize), paint);
      canvas.drawLine(start, Offset(start.dx + arrowSize, start.dy + arrowSize), paint);
      canvas.drawLine(end, Offset(end.dx - arrowSize, end.dy - arrowSize), paint);
      canvas.drawLine(end, Offset(end.dx - arrowSize, end.dy + arrowSize), paint);
    } else {
      canvas.drawLine(start, Offset(start.dx - arrowSize, start.dy + arrowSize), paint);
      canvas.drawLine(start, Offset(start.dx + arrowSize, start.dy + arrowSize), paint);
      canvas.drawLine(end, Offset(end.dx - arrowSize, end.dy - arrowSize), paint);
      canvas.drawLine(end, Offset(end.dx + arrowSize, end.dy - arrowSize), paint);
    }
  }

  void _drawText(Canvas canvas, String text, Offset center, Color color) {
    final textSpan = TextSpan(
      text: text,
      style: TextStyle(
        color: color,
        fontSize: 11,
        fontWeight: FontWeight.w700,
      ),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
  }

  @override
  bool shouldRepaint(covariant _BinDimensionDiagramPainter oldDelegate) =>
      oldDelegate.shape != shape;
}

class _BinPreset {
  final String label;
  final double capacity;
  final double d;
  final double t;
  final double p;
  final double l;

  const _BinPreset({
    required this.label,
    required this.capacity,
    this.d = 0,
    this.t = 0,
    this.p = 0,
    this.l = 0,
  });

  String get capacityLabel =>
      '${capacity.toStringAsFixed(capacity.truncateToDouble() == capacity ? 0 : 1)} L';
}
