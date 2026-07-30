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
  // State for Organic Bin
  String _organicMode = 'Standar';
  String _organicStandardSize = '25';
  final TextEditingController _orgPanjangCtrl = TextEditingController();
  final TextEditingController _orgLebarCtrl = TextEditingController();
  final TextEditingController _orgTinggiCtrl = TextEditingController();

  // State for Non-Organic Bin
  String _nonOrganicMode = 'Standar';
  String _nonOrganicStandardSize = '25';
  final TextEditingController _nonOrgPanjangCtrl = TextEditingController();
  final TextEditingController _nonOrgLebarCtrl = TextEditingController();
  final TextEditingController _nonOrgTinggiCtrl = TextEditingController();

  final List<String> _standardSizes = ['10', '20', '25', '40', '60', '120'];
  bool _isLoading = false;
  bool _activateOrganic = true;
  bool _activateAnorganic = true;
  bool _isInit = false;

  void _submit() async {
    if (!_activateOrganic && !_activateAnorganic) {
      _showError('Pilih minimal satu jenis tong untuk diaktivasi.');
      return;
    }

    // Validasi input manual jika dipilih
    if (_activateOrganic && _organicMode == 'Manual') {
      if (_orgPanjangCtrl.text.isEmpty ||
          _orgLebarCtrl.text.isEmpty ||
          _orgTinggiCtrl.text.isEmpty) {
        _showError('Mohon lengkapi dimensi manual Bin Organik');
        return;
      }
    }
    if (_activateAnorganic && _nonOrganicMode == 'Manual') {
      if (_nonOrgPanjangCtrl.text.isEmpty ||
          _nonOrgLebarCtrl.text.isEmpty ||
          _nonOrgTinggiCtrl.text.isEmpty) {
        _showError('Mohon lengkapi dimensi manual Bin Anorganik');
        return;
      }
    }

    setState(() => _isLoading = true);

    if (!mounted) return;
    setState(() => _isLoading = false);

    double parseCapacity(String mode, String standardSize, TextEditingController p, TextEditingController l, TextEditingController t) {
      if (mode == 'Standar') {
        return double.tryParse(standardSize.replaceAll(' KG', '').replaceAll(' Kg', '')) ?? 25.0;
      }
      final double pp = double.tryParse(p.text) ?? 0.0;
      final double ll = double.tryParse(l.text) ?? 0.0;
      final double tt = double.tryParse(t.text) ?? 0.0;
      return (pp * ll * tt) / 1000.0; // cm3 to Liter
    }

    final orgCap = _activateOrganic ? parseCapacity(_organicMode, _organicStandardSize, _orgPanjangCtrl, _orgLebarCtrl, _orgTinggiCtrl) : 0.0;
    final anorgCap = _activateAnorganic ? parseCapacity(_nonOrganicMode, _nonOrganicStandardSize, _nonOrgPanjangCtrl, _nonOrgLebarCtrl, _nonOrgTinggiCtrl) : 0.0;

    // Lanjut ke aktivasi (scan barcode)
    Navigator.pushReplacementNamed(
      context, 
      AppRoutes.aktivasiBin,
      arguments: {
        'orgCapacity': orgCap,
        'anorgCapacity': anorgCap,
        'hasOrganic': !_activateOrganic,
        'hasAnorganic': !_activateAnorganic,
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
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
    _nonOrgPanjangCtrl.dispose();
    _nonOrgLebarCtrl.dispose();
    _nonOrgTinggiCtrl.dispose();
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

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Ukur Kapasitas Bin'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Masukkan ukuran atau dimensi fisik dari tong sampah Anda sebelum mengaktifkan barcode.',
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
                title: 'Bin Organik (Hijau)',
                color: AppColors.organicColor,
                isChecked: _activateOrganic,
                onChecked: isFirstTime ? null : (val) {
                  setState(() => _activateOrganic = val ?? false);
                },
                mode: _organicMode,
                  onModeChanged: (val) => setState(() => _organicMode = val!),
                  standardSize: _organicStandardSize,
                  onStandardSizeChanged: (val) => setState(() => _organicStandardSize = val!),
                  pCtrl: _orgPanjangCtrl,
                lCtrl: _orgLebarCtrl,
                tCtrl: _orgTinggiCtrl,
              ),
            ),

            // Card Non-Organik
            Padding(
              padding: const EdgeInsets.only(bottom: 32),
              child: _buildBinCard(
                title: 'Bin Anorganik (Kuning)',
                color: AppColors.nonOrganicColor,
                isChecked: _activateAnorganic,
                onChecked: isFirstTime ? null : (val) {
                  setState(() => _activateAnorganic = val ?? false);
                },
                mode: _nonOrganicMode,
                  onModeChanged: (val) => setState(() => _nonOrganicMode = val!),
                  standardSize: _nonOrganicStandardSize,
                  onStandardSizeChanged: (val) => setState(() => _nonOrganicStandardSize = val!),
                  pCtrl: _nonOrgPanjangCtrl,
                lCtrl: _nonOrgLebarCtrl,
                tCtrl: _nonOrgTinggiCtrl,
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
    required TextEditingController pCtrl,
    required TextEditingController lCtrl,
    required TextEditingController tCtrl,
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
                  groupValue: mode,
                  onChanged: onModeChanged,
                  contentPadding: EdgeInsets.zero,
                  activeColor: color,
                ),
              ),
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('Manual (Dimensi)', style: TextStyle(fontSize: 13)),
                  value: 'Manual',
                  groupValue: mode,
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
              value: standardSize,
              decoration: InputDecoration(
                labelText: 'Ukuran Kapasitas (Kg)',
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
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: pCtrl,
                    keyboardType: TextInputType.number,
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
                    keyboardType: TextInputType.number,
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
                    keyboardType: TextInputType.number,
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
      ),
    );
  }
}
