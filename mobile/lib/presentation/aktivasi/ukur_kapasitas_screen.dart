import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';

class UkurKapasitasScreen extends StatefulWidget {
  const UkurKapasitasScreen({super.key});

  @override
  State<UkurKapasitasScreen> createState() => _UkurKapasitasScreenState();
}

class _UkurKapasitasScreenState extends State<UkurKapasitasScreen> {
  // State for Organic Bin
  String _organicMode = 'Standar';
  String _organicStandardSize = '20L';
  final TextEditingController _orgPanjangCtrl = TextEditingController();
  final TextEditingController _orgLebarCtrl = TextEditingController();
  final TextEditingController _orgTinggiCtrl = TextEditingController();

  // State for Non-Organic Bin
  String _nonOrganicMode = 'Standar';
  String _nonOrganicStandardSize = '20L';
  final TextEditingController _nonOrgPanjangCtrl = TextEditingController();
  final TextEditingController _nonOrgLebarCtrl = TextEditingController();
  final TextEditingController _nonOrgTinggiCtrl = TextEditingController();

  final List<String> _standardSizes = ['20L', '40L', '60L', '120L'];
  bool _isLoading = false;

  void _submit() async {
    // Validasi input manual jika dipilih
    if (_organicMode == 'Manual') {
      if (_orgPanjangCtrl.text.isEmpty ||
          _orgLebarCtrl.text.isEmpty ||
          _orgTinggiCtrl.text.isEmpty) {
        _showError('Mohon lengkapi dimensi manual Bin Organik');
        return;
      }
    }
    if (_nonOrganicMode == 'Manual') {
      if (_nonOrgPanjangCtrl.text.isEmpty ||
          _nonOrgLebarCtrl.text.isEmpty ||
          _nonOrgTinggiCtrl.text.isEmpty) {
        _showError('Mohon lengkapi dimensi manual Bin Anorganik');
        return;
      }
    }

    setState(() => _isLoading = true);

    // TODO: Panggil API `POST /api/v1/bins/measure` di sini
    // Mensimulasikan loading API
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;
    setState(() => _isLoading = false);

    // Lanjut ke aktivasi (scan barcode)
    Navigator.pushReplacementNamed(context, AppRoutes.aktivasiBin);
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
              'Masukkan ukuran atau dimensi fisik dari kedua tong sampah Anda sebelum mengaktifkan barcode.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),

            // Card Organik
            _buildBinCard(
              title: 'Bin Organik (Hijau)',
              color: AppColors.organicColor,
              mode: _organicMode,
              onModeChanged: (val) => setState(() => _organicMode = val!),
              standardSize: _organicStandardSize,
              onStandardSizeChanged: (val) => setState(() => _organicStandardSize = val!),
              pCtrl: _orgPanjangCtrl,
              lCtrl: _orgLebarCtrl,
              tCtrl: _orgTinggiCtrl,
            ),
            
            const SizedBox(height: 20),

            // Card Non-Organik
            _buildBinCard(
              title: 'Bin Anorganik (Kuning)',
              color: AppColors.nonOrganicColor,
              mode: _nonOrganicMode,
              onModeChanged: (val) => setState(() => _nonOrganicMode = val!),
              standardSize: _nonOrganicStandardSize,
              onStandardSizeChanged: (val) => setState(() => _nonOrganicStandardSize = val!),
              pCtrl: _nonOrgPanjangCtrl,
              lCtrl: _nonOrgLebarCtrl,
              tCtrl: _nonOrgTinggiCtrl,
            ),

            const SizedBox(height: 32),

            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
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
              Icon(Icons.delete_outline, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
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
                labelText: 'Ukuran Kapasitas',
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
      ),
    );
  }
}
