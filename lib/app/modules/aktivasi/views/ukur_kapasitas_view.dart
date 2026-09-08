import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_config.dart';
import '../../../routes/app_routes.dart';
import '../../scan/controllers/scan_controller.dart';

class UkurKapasitasView extends ConsumerStatefulWidget {
  const UkurKapasitasView({super.key});

  @override
  ConsumerState<UkurKapasitasView> createState() => _UkurKapasitasViewState();
}

class _UkurKapasitasViewState extends ConsumerState<UkurKapasitasView> {
  // State for Organic Bin
  String _organicMode = 'Standar';
  String _organicStandardSize = '25';
  String _organicShape = 'Kotak / Balok / Bak';
  final TextEditingController _orgPanjangCtrl = TextEditingController();
  final TextEditingController _orgLebarCtrl = TextEditingController();
  final TextEditingController _orgTinggiCtrl = TextEditingController();
  final TextEditingController _orgDiameterCtrl = TextEditingController();
  final TextEditingController _orgSisiCtrl = TextEditingController();

  // State for Non-Organic Bin
  String _nonOrganicMode = 'Standar';
  String _nonOrganicStandardSize = '25';
  String _nonOrganicShape = 'Kotak / Balok / Bak';
  final TextEditingController _nonOrgPanjangCtrl = TextEditingController();
  final TextEditingController _nonOrgLebarCtrl = TextEditingController();
  final TextEditingController _nonOrgTinggiCtrl = TextEditingController();
  final TextEditingController _nonOrgDiameterCtrl = TextEditingController();
  final TextEditingController _nonOrgSisiCtrl = TextEditingController();

  final List<String> _standardSizes = ['10', '20', '25', '40', '60', '120'];
  final List<String> _shapeOptions = [
    'Kotak / Balok / Bak',
    'Tabung / Silinder',
    'Kubus',
  ];
  bool _isLoading = false;
  bool _activateOrganic = true;
  bool _activateAnorganic = true;
  bool _isInit = false;

  void _submit() async {
    if (!_activateOrganic && !_activateAnorganic) {
      _showError('Pilih minimal satu jenis tempat sampah untuk diaktivasi.');
      return;
    }

    // Validasi input manual jika dipilih
    if (_activateOrganic && _organicMode == 'Manual') {
      if (_organicShape == 'Kotak / Balok / Bak') {
        if (_orgPanjangCtrl.text.isEmpty ||
            _orgLebarCtrl.text.isEmpty ||
            _orgTinggiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Panjang, Lebar, dan Tinggi Tempat Sampah Organik');
          return;
        }
      } else if (_organicShape == 'Tabung / Silinder') {
        if (_orgDiameterCtrl.text.isEmpty || _orgTinggiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Diameter dan Tinggi Tempat Sampah Organik');
          return;
        }
      } else if (_organicShape == 'Kubus') {
        if (_orgSisiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Sisi Tempat Sampah Organik');
          return;
        }
      }
    }
    if (_activateAnorganic && _nonOrganicMode == 'Manual') {
      if (_nonOrganicShape == 'Kotak / Balok / Bak') {
        if (_nonOrgPanjangCtrl.text.isEmpty ||
            _nonOrgLebarCtrl.text.isEmpty ||
            _nonOrgTinggiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Panjang, Lebar, dan Tinggi Tempat Sampah Anorganik');
          return;
        }
      } else if (_nonOrganicShape == 'Tabung / Silinder') {
        if (_nonOrgDiameterCtrl.text.isEmpty || _nonOrgTinggiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Diameter dan Tinggi Tempat Sampah Anorganik');
          return;
        }
      } else if (_nonOrganicShape == 'Kubus') {
        if (_nonOrgSisiCtrl.text.isEmpty) {
          _showError('Mohon lengkapi Sisi Tempat Sampah Anorganik');
          return;
        }
      }
    }

    setState(() => _isLoading = true);

    if (!mounted) return;
    setState(() => _isLoading = false);

    // ponytail: hardcoded 3 wadah shapes (Kotak, Tabung, Kubus). Upgrade to dynamic shape enum/models if backend adds custom geometry.
    double parseCapacity({
      required String mode,
      required String standardSize,
      required String shape,
      required TextEditingController p,
      required TextEditingController l,
      required TextEditingController t,
      required TextEditingController d,
      required TextEditingController s,
      required bool isOrganic,
    }) {
      if (mode == 'Standar') {
        final kg = double.tryParse(standardSize.replaceAll(' KG', '').replaceAll(' Kg', '')) ?? 25.0;
        final density = isOrganic ? AppConfig.organicDensityKgPerLiter : AppConfig.nonOrganicDensityKgPerLiter;
        return kg / density; // Convert Kg ke Liter
      }
      if (shape == 'Tabung / Silinder') {
        final double diameter = double.tryParse(d.text) ?? 0.0;
        final double tinggi = double.tryParse(t.text) ?? 0.0;
        final double radius = diameter / 2.0;
        // Volume tabung: pi * r^2 * t cm3 / 1000 -> Liter
        return (3.141592653589793 * radius * radius * tinggi) / 1000.0;
      }
      if (shape == 'Kubus') {
        final double sisi = double.tryParse(s.text) ?? 0.0;
        // Volume kubus: s^3 cm3 / 1000 -> Liter
        return (sisi * sisi * sisi) / 1000.0;
      }
      // Kotak / Balok / Bak
      final double pp = double.tryParse(p.text) ?? 0.0;
      final double ll = double.tryParse(l.text) ?? 0.0;
      final double tt = double.tryParse(t.text) ?? 0.0;
      return (pp * ll * tt) / 1000.0; // cm3 to Liter
    }

    final orgCap = _activateOrganic
        ? parseCapacity(
            mode: _organicMode,
            standardSize: _organicStandardSize,
            shape: _organicShape,
            p: _orgPanjangCtrl,
            l: _orgLebarCtrl,
            t: _orgTinggiCtrl,
            d: _orgDiameterCtrl,
            s: _orgSisiCtrl,
            isOrganic: true,
          )
        : 0.0;
    final anorgCap = _activateAnorganic
        ? parseCapacity(
            mode: _nonOrganicMode,
            standardSize: _nonOrganicStandardSize,
            shape: _nonOrganicShape,
            p: _nonOrgPanjangCtrl,
            l: _nonOrgLebarCtrl,
            t: _nonOrgTinggiCtrl,
            d: _nonOrgDiameterCtrl,
            s: _nonOrgSisiCtrl,
            isOrganic: false,
          )
        : 0.0;

    // Lanjut ke aktivasi (scan barcode)
    Navigator.pushReplacementNamed(
      context, 
      AppRoutes.aktivasiBin,
      arguments: {
        'orgCapacity': orgCap,
        'anorgCapacity': anorgCap,
        'hasOrganic': !_activateOrganic, // true jika tidak dicentang (karena sudah punya)
        'hasAnorganic': !_activateAnorganic,
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.dangerRed,
      ),
    );
  }

  @override
  void dispose() {
    _orgPanjangCtrl.dispose();
    _orgLebarCtrl.dispose();
    _orgTinggiCtrl.dispose();
    _orgDiameterCtrl.dispose();
    _orgSisiCtrl.dispose();
    _nonOrgPanjangCtrl.dispose();
    _nonOrgLebarCtrl.dispose();
    _nonOrgTinggiCtrl.dispose();
    _nonOrgDiameterCtrl.dispose();
    _nonOrgSisiCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final myBins = ref.watch(binsProvider).value ?? [];
    final bool isFirstTime = myBins.isEmpty;

    if (!_isInit) {
      _activateOrganic = true;
      _activateAnorganic = true;
      _isInit = true;
    }

    // Jika first time, paksa centang dua-duanya
    if (isFirstTime) {
      _activateOrganic = true;
      _activateAnorganic = true;
    }

    bool hasUnsavedChanges() {
      if (_organicMode == 'Manual') {
        if (_orgPanjangCtrl.text.isNotEmpty ||
            _orgLebarCtrl.text.isNotEmpty ||
            _orgTinggiCtrl.text.isNotEmpty ||
            _orgDiameterCtrl.text.isNotEmpty ||
            _orgSisiCtrl.text.isNotEmpty ||
            _organicShape != 'Kotak / Balok / Bak') {
          return true;
        }
      } else {
        if (_organicStandardSize != '25') return true;
      }
      
      if (_nonOrganicMode == 'Manual') {
        if (_nonOrgPanjangCtrl.text.isNotEmpty ||
            _nonOrgLebarCtrl.text.isNotEmpty ||
            _nonOrgTinggiCtrl.text.isNotEmpty ||
            _nonOrgDiameterCtrl.text.isNotEmpty ||
            _nonOrgSisiCtrl.text.isNotEmpty ||
            _nonOrganicShape != 'Kotak / Balok / Bak') {
          return true;
        }
      } else {
        if (_nonOrganicStandardSize != '25') return true;
      }
      
      return false;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        if (!hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Batalkan Pengukuran?', style: TextStyle(fontWeight: FontWeight.bold)),
              content: const Text('Perubahan ini akan terhapus jika Anda keluar dari halaman ini.'),
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
        title: const Text('Ukur Kapasitas Tempat Sampah'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Masukkan ukuran atau dimensi fisik dari tempat sampah Anda sebelum mengaktifkan barcode.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),

            // Card Organik
            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: _buildBinCard(
                title: 'Tempat Sampah Organik (Hijau)',
                color: AppColors.organicColor,
                isChecked: _activateOrganic,
                onChecked: isFirstTime ? null : (val) {
                  setState(() => _activateOrganic = val ?? false);
                },
                mode: _organicMode,
                onModeChanged: (val) => setState(() => _organicMode = val!),
                standardSize: _organicStandardSize,
                onStandardSizeChanged: (val) => setState(() => _organicStandardSize = val!),
                shape: _organicShape,
                onShapeChanged: (val) => setState(() => _organicShape = val!),
                pCtrl: _orgPanjangCtrl,
                lCtrl: _orgLebarCtrl,
                tCtrl: _orgTinggiCtrl,
                dCtrl: _orgDiameterCtrl,
                sCtrl: _orgSisiCtrl,
              ),
            ),

            // Card Anorganik
            Padding(
              padding: const EdgeInsets.only(bottom: 32),
              child: _buildBinCard(
                title: 'Tempat Sampah Anorganik (Kuning)',
                color: AppColors.nonOrganicColor,
                isChecked: _activateAnorganic,
                onChecked: isFirstTime ? null : (val) {
                  setState(() => _activateAnorganic = val ?? false);
                },
                mode: _nonOrganicMode,
                onModeChanged: (val) => setState(() => _nonOrganicMode = val!),
                standardSize: _nonOrganicStandardSize,
                onStandardSizeChanged: (val) => setState(() => _nonOrganicStandardSize = val!),
                shape: _nonOrganicShape,
                onShapeChanged: (val) => setState(() => _nonOrganicShape = val!),
                pCtrl: _nonOrgPanjangCtrl,
                lCtrl: _nonOrgLebarCtrl,
                tCtrl: _nonOrgTinggiCtrl,
                dCtrl: _nonOrgDiameterCtrl,
                sCtrl: _nonOrgSisiCtrl,
              ),
            ),

            ElevatedButton(
              onPressed: _isLoading ? null : () => _submit(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Simpan & Lanjut Aktivasi',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
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

  Widget _buildBinCard({
    required String title,
    required Color color,
    required bool isChecked,
    ValueChanged<bool?>? onChecked,
    required String mode,
    required ValueChanged<String?> onModeChanged,
    required String standardSize,
    required ValueChanged<String?> onStandardSizeChanged,
    required String shape,
    required ValueChanged<String?> onShapeChanged,
    required TextEditingController pCtrl,
    required TextEditingController lCtrl,
    required TextEditingController tCtrl,
    required TextEditingController dCtrl,
    required TextEditingController sCtrl,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Checkbox(
                value: isChecked,
                onChanged: onChecked,
                activeColor: color,
              ),
              Icon(Icons.delete_outline, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          if (isChecked) ...[
            const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('Standar', style: TextStyle(fontSize: 13)),
                  value: 'Standar',
                  // ignore: deprecated_member_use
                  groupValue: mode,
                  // ignore: deprecated_member_use
                  onChanged: onModeChanged,
                  contentPadding: EdgeInsets.zero,
                  activeColor: color,
                ),
              ),
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('Manual (Dimensi)', style: TextStyle(fontSize: 13)),
                  value: 'Manual',
                  // ignore: deprecated_member_use
                  groupValue: mode,
                  // ignore: deprecated_member_use
                  onChanged: onModeChanged,
                  contentPadding: EdgeInsets.zero,
                  activeColor: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (mode == 'Standar')
            DropdownButtonFormField<String>(
              initialValue: standardSize,
              decoration: InputDecoration(
                labelText: 'Ukuran Kapasitas (kg)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              items: _standardSizes
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: onStandardSizeChanged,
            )
          else ...[
            DropdownButtonFormField<String>(
              key: ValueKey(shape),
              initialValue: shape,
              decoration: InputDecoration(
                labelText: 'Bentuk Tempat Sampah',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              items: _shapeOptions
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: onShapeChanged,
            ),
            const SizedBox(height: 12),
            if (shape == 'Tabung / Silinder')
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: dCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Diameter (cm)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: tCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Tinggi (cm)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                ],
              )
            else if (shape == 'Kubus')
              TextField(
                controller: sCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Panjang Sisi (cm)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: pCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'P (cm)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: lCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'L (cm)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: tCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'T (cm)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                ],
              ),
          ],
          ],
        ],
      ),
    );
  }
}


