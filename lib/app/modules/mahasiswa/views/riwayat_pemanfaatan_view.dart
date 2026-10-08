import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import 'package:intl/intl.dart';

final riwayatPemanfaatanProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repo = ref.read(kknRepositoryProvider);
  return await repo.getPemanfaatanLogs();
});

class RiwayatPemanfaatanView extends ConsumerStatefulWidget {
  const RiwayatPemanfaatanView({super.key});

  @override
  ConsumerState<RiwayatPemanfaatanView> createState() =>
      _RiwayatPemanfaatanViewState();
}

class _RiwayatPemanfaatanViewState
    extends ConsumerState<RiwayatPemanfaatanView> {
  String _activeFilter = 'ALL'; // 'ALL', 'ORGANIK', 'ANORGANIK'

  bool _isItemAnorganik(Map<String, dynamic> item) {
    final rawKat = item['kategoriBahan']?.toString();
    if (rawKat != null && rawKat.isNotEmpty) {
      return rawKat.toUpperCase().contains('ANORGANIK');
    }
    final bahan = item['bahanBaku']?.toString().toUpperCase() ?? '';
    final tek = (item['jenisProgram'] ?? item['teknologi'] ?? '')
        .toString()
        .toUpperCase();
    return bahan.contains('ANORGANIK') ||
        tek.contains('BANK SAMPAH') ||
        tek.contains('ECOBRICK') ||
        tek.contains('PLASTIK');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(riwayatPemanfaatanProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Data Pemanfaatan & Hasil'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),

      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Gagal memuat data: ${err.toString()}',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(riwayatPemanfaatanProvider),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
        data: (data) {
          if (data.isEmpty) {
            return const Center(
              child: Text('Belum ada riwayat pemanfaatan/hasil'),
            );
          }

          final totalCount = data.length;
          final organikCount = data
              .where((e) => !_isItemAnorganik(e as Map<String, dynamic>))
              .length;
          final anorganikCount = data
              .where((e) => _isItemAnorganik(e as Map<String, dynamic>))
              .length;

          final filteredList = data.where((e) {
            final item = e as Map<String, dynamic>;
            final isAnorg = _isItemAnorganik(item);
            if (_activeFilter == 'ORGANIK') return !isAnorg;
            if (_activeFilter == 'ANORGANIK') return isAnorg;
            return true;
          }).toList();

          return Column(
            children: [
              // Segmented Category Filter
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _buildFilterPill('ALL', 'Semua ($totalCount)'),
                    const SizedBox(width: 8),
                    _buildFilterPill('ORGANIK', '🌿 Organik ($organikCount)'),
                    const SizedBox(width: 8),
                    _buildFilterPill('ANORGANIK', '♻️ Anorganik ($anorganikCount)'),
                  ],
                ),
              ),
              const Divider(height: 1, thickness: 1),
              Expanded(
                child: filteredList.isEmpty
                    ? Center(
                        child: Text(
                          _activeFilter == 'ORGANIK'
                              ? 'Belum ada riwayat pemanfaatan Organik'
                              : 'Belum ada riwayat pemanfaatan Anorganik',
                          style: const TextStyle(color: Colors.grey),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(riwayatPemanfaatanProvider);
                        },
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredList.length,
                          itemBuilder: (context, index) {
                            final item =
                                filteredList[index] as Map<String, dynamic>;
                            return _buildHistoryCard(context, ref, item);
                          },
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterPill(String filterKey, String label) {
    final isSelected = _activeFilter == filterKey;
    Color activeColor = AppColors.primaryGreen;
    if (filterKey == 'ANORGANIK') {
      activeColor = AppColors.primaryBlue;
    }

    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeFilter = filterKey),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? activeColor.withValues(alpha: 0.12)
                : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? activeColor : Colors.grey.shade300,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? activeColor : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) {
    final id = item['id']?.toString() ?? '';
    final namaProgram =
        item['namaProgram']?.toString() ?? 'Program Pemanfaatan';
    final jenisProgram = item['jenisProgram']?.toString() ??
        item['teknologi']?.toString() ??
        '';
    final bahanMasuk = item['jumlahBahanMasukKg'] ??
        item['volumeBahanBaku'] ??
        item['beratInputKg'] ??
        0;
    final hasil = item['jumlahHasilKg'] ?? 0;
    final unit = item['unitHasil']?.toString() ?? 'kg';
    final status = item['status']?.toString() ?? 'PROSES';

    DateTime? tgl;
    if (item['tanggalPencatatan'] != null) {
      tgl = DateTime.tryParse(item['tanggalPencatatan'].toString())?.toLocal();
    }
    final tglStr = tgl != null
        ? DateFormat('dd MMM yyyy, HH:mm').format(tgl)
        : '-';

    final isPanen = status == 'PANEN';
    final displayStatus = isPanen
        ? 'Catatan Hasil Akhir'
        : 'Laporan Pemanfaatan Awal';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    namaProgram,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isPanen
                        ? AppColors.primaryGreen.withAlpha(26)
                        : AppColors.primaryBlue.withAlpha(26),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    displayStatus,
                    style: TextStyle(
                      color: isPanen
                          ? AppColors.primaryGreen
                          : AppColors.primaryBlue,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Builder(
              builder: (_) {
                final isAnorg = _isItemAnorganik(item);
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isAnorg
                        ? AppColors.primaryBlue.withValues(alpha: 0.1)
                        : AppColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isAnorg
                          ? AppColors.primaryBlue.withValues(alpha: 0.3)
                          : AppColors.primaryGreen.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(isAnorg ? '♻️' : '🌿', style: const TextStyle(fontSize: 11)),
                      const SizedBox(width: 4),
                      Text(
                        isAnorg ? 'Anorganik' : 'Organik',
                        style: TextStyle(
                          color: isAnorg ? AppColors.primaryBlue : AppColors.primaryGreen,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
            Text(
              'Teknologi: $jenisProgram',
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
            if (bahanMasuk != null)
              Text(
                'Input Sampah: $bahanMasuk kg',
                style: const TextStyle(fontSize: 13, color: Colors.black87),
              ),
            if (isPanen)
              Text(
                'Total Hasil: $hasil $unit',
                style: const TextStyle(fontSize: 13, color: Colors.black87),
              ),
            Text(
              'Tanggal: $tglStr',
              style: const TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (!isPanen) ...[
                  TextButton.icon(
                    onPressed: () =>
                        _showEditPemanfaatanDialog(context, ref, item),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit Input'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                if (isPanen) ...[
                  TextButton.icon(
                    onPressed: () => _showEditPanenDialog(context, ref, item),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit Hasil'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                TextButton.icon(
                  onPressed: () => _confirmDelete(context, ref, id, isPanen),
                  icon: const Icon(Icons.delete, size: 16),
                  label: const Text('Hapus'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,

                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    minimumSize: Size.zero,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    String id,
    bool isPanen,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi Hapus'),
        content: const Text(
          'Apakah Anda yakin ingin menghapus data ini? Poin seluruh anggota kelompok akan ditarik kembali.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                if (isPanen) {
                  await repo.deletePanenHasil(id);
                } else {
                  await repo.deleteLogbookPemanfaatan(id);
                }
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Data berhasil dihapus')),
                  );
                }
                ref.invalidate(riwayatPemanfaatanProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  void _showEditPemanfaatanDialog(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => EditPemanfaatanScreen(item: item)),
    ).then((_) {
      // ignore: unused_result
      ref.refresh(riwayatPemanfaatanProvider);
    });
  }

  void _showEditPanenDialog(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => EditPanenScreen(item: item)),
    ).then((_) {
      // ignore: unused_result
      ref.refresh(riwayatPemanfaatanProvider);
    });
  }
}

// ----------------------------------------------------------------------
// Dedicated Screens for Editing
// ----------------------------------------------------------------------

class EditPemanfaatanScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> item;
  const EditPemanfaatanScreen({super.key, required this.item});

  @override
  ConsumerState<EditPemanfaatanScreen> createState() =>
      _EditPemanfaatanScreenState();
}

class _EditPemanfaatanScreenState extends ConsumerState<EditPemanfaatanScreen> {
  final _formKey = GlobalKey<FormState>();

  List<Map<String, dynamic>> _programList = [];
  bool _isLoading = true;
  String? _selectedProgram;

  static const List<String> _organikTeknologiList = [
    'Kompos Organik (Buruan Sae)',
    'Budidaya Maggot BSF',
    'Pupuk Organik Cair (POC)',
    'Loseda (Lodong Sesa Dapur)',
    'Bata Terawang',
    'Metode Keranjang Takakura',
  ];

  static const List<String> _anorganikTeknologiList = [
    'Penyetoran Bank Sampah',
    'Pemilahan Botol & Sampah Plastik',
    'Pemilahan Kertas & Karton',
    'Pengumpulan Logam & Kaleng',
    'Pembuatan Ecobrick',
    'Kreasi Daur Ulang Anorganik',
  ];

  late String _selectedKategori;
  String? _selectedTeknologi;

  List<String> get _currentTeknologiList =>
      _selectedKategori == 'ORGANIK' ? _organikTeknologiList : _anorganikTeknologiList;

  late TextEditingController tcKategori;
  late TextEditingController tcTeknologi;
  late TextEditingController tcBerat;
  late TextEditingController tcUnit;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final rawKat = widget.item['kategoriBahan']?.toString();
    final isAnorg = (rawKat != null && rawKat.toUpperCase().contains('ANORGANIK')) ||
        widget.item['bahanBaku']?.toString().toUpperCase().contains('ANORGANIK') == true ||
        (widget.item['jenisProgram'] ?? widget.item['teknologi'] ?? '')
            .toString()
            .toUpperCase()
            .contains('BANK SAMPAH') ||
        (widget.item['jenisProgram'] ?? widget.item['teknologi'] ?? '')
            .toString()
            .toUpperCase()
            .contains('ECOBRICK');
    _selectedKategori = isAnorg ? 'ANORGANIK' : 'ORGANIK';

    final currentTek = widget.item['jenisProgram']?.toString() ??
        widget.item['teknologi']?.toString() ??
        '';
    final list = _selectedKategori == 'ORGANIK'
        ? _organikTeknologiList
        : _anorganikTeknologiList;
    _selectedTeknologi = list.contains(currentTek) ? currentTek : list.first;

    tcKategori = TextEditingController(
      text: widget.item['bahanBaku']?.toString() ?? '',
    );
    tcTeknologi = TextEditingController(
      text: _selectedTeknologi ?? '',
    );
    tcBerat = TextEditingController(
      text: widget.item['jumlahBahanMasukKg']?.toString() ?? '',
    );
    tcUnit = TextEditingController(
      text: widget.item['unitBahanBaku']?.toString() ?? 'kg',
    );
    _loadPrograms();
  }

  Future<void> _loadPrograms() async {
    try {
      final repo = ref.read(kknRepositoryProvider);
      final progs = await repo.getProgramKerja();
      if (mounted) {
        setState(() {
          _programList = progs;
          _isLoading = false;

          final currentProg = widget.item['namaProgram']?.toString() ?? '';
          if (_programList.any(
            (p) => (p['judul']?.toString() ?? '') == currentProg,
          )) {
            _selectedProgram = currentProg;
          } else if (_programList.isNotEmpty) {
            // let it be null
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProgram == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih program terlebih dahulu')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final val = double.tryParse(tcBerat.text) ?? 0;
    final defaultBahan = _selectedKategori == 'ORGANIK' ? 'Sampah Organik' : 'Sampah Anorganik';
    final bahanBakuVal = tcKategori.text.trim().isNotEmpty
        ? tcKategori.text.trim()
        : defaultBahan;

    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.updateLogbookPemanfaatan(widget.item['id'].toString(), {
        'program': _selectedProgram,
        // ponytail: sinkronkan kategori dan teknologi definitif ke backend
        'kategori': _selectedKategori,
        'bahanBaku': bahanBakuVal,
        'teknologi': _selectedTeknologi ?? tcTeknologi.text,
        'volumeBahanBaku': val,
        'unitBahanBaku': tcUnit.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Data berhasil diupdate'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengupdate. Silakan coba lagi.'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Edit Laporan Awal',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Program Pemanfaatan',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedProgram,
                      isExpanded: true,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      hint: const Text('Pilih Program'),
                      items: _programList.map((p) {
                        final title = p['judul']?.toString() ?? 'Tanpa Judul';
                        return DropdownMenuItem(
                          value: title,
                          child: Text(title),
                        );
                      }).toList(),
                      onChanged: (val) =>
                          setState(() => _selectedProgram = val),
                      validator: (val) => val == null ? 'Wajib dipilih' : null,
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Kategori Aliran Sampah',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _selectedKategori = 'ORGANIK';
                                _selectedTeknologi = _organikTeknologiList.first;
                                tcTeknologi.text = _selectedTeknologi!;
                              });
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _selectedKategori == 'ORGANIK'
                                    ? AppColors.primaryGreen.withValues(alpha: 0.12)
                                    : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _selectedKategori == 'ORGANIK'
                                      ? AppColors.primaryGreen
                                      : Colors.grey.shade300,
                                  width: _selectedKategori == 'ORGANIK' ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('🌿', style: TextStyle(fontSize: 15)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Organik',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: _selectedKategori == 'ORGANIK'
                                          ? AppColors.primaryGreen
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _selectedKategori = 'ANORGANIK';
                                _selectedTeknologi = _anorganikTeknologiList.first;
                                tcTeknologi.text = _selectedTeknologi!;
                              });
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _selectedKategori == 'ANORGANIK'
                                    ? AppColors.primaryBlue.withValues(alpha: 0.12)
                                    : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _selectedKategori == 'ANORGANIK'
                                      ? AppColors.primaryBlue
                                      : Colors.grey.shade300,
                                  width: _selectedKategori == 'ANORGANIK' ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('♻️', style: TextStyle(fontSize: 15)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Anorganik',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: _selectedKategori == 'ANORGANIK'
                                          ? AppColors.primaryBlue
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'Metode / Teknologi (${_selectedKategori == 'ORGANIK' ? 'Organik' : 'Anorganik'})',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      key: ValueKey('edit-tek-$_selectedKategori'),
                      initialValue: _selectedTeknologi,
                      isExpanded: true,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      items: _currentTeknologiList
                          .map(
                            (e) => DropdownMenuItem(
                              value: e,
                              child: Text(e, style: const TextStyle(fontSize: 13)),
                            ),
                          )
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedTeknologi = val;
                            tcTeknologi.text = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Kategori / Bahan Baku',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: tcKategori,
                      decoration: InputDecoration(
                        hintText: _selectedKategori == 'ORGANIK'
                            ? 'Contoh: Sisa Sayur Pasar, Daun Kering'
                            : 'Contoh: Botol Plastik, Kardus Bekas',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Berat',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: tcBerat,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                validator: (val) => val == null || val.isEmpty
                                    ? 'Wajib diisi'
                                    : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 1,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Unit',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: tcUnit,
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                validator: (val) => val == null || val.isEmpty
                                    ? 'Wajib diisi'
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Simpan Perubahan',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class EditPanenScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> item;
  const EditPanenScreen({super.key, required this.item});

  @override
  ConsumerState<EditPanenScreen> createState() => _EditPanenScreenState();
}

class _EditPanenScreenState extends ConsumerState<EditPanenScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController tcHasil;
  late TextEditingController tcNilaiEkonomi;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    tcHasil = TextEditingController(
      text: widget.item['jumlahHasilKg']?.toString() ?? '',
    );
    tcNilaiEkonomi = TextEditingController(
      text: widget.item['luasLahanM2']?.toString() ?? '',
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final valHasil = double.tryParse(tcHasil.text) ?? 0;
    final valEkonomi = double.tryParse(tcNilaiEkonomi.text) ?? 0;

    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.updatePanenHasil(widget.item['id'].toString(), {
        'hasil': valHasil,
        'luasLahanM2': valEkonomi,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Data berhasil diupdate'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengupdate. Silakan coba lagi.'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Edit Laporan Akhir',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Jumlah Hasil Output',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: tcHasil,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                validator: (val) =>
                    val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),

              const Text(
                'Nilai Ekonomi (Rp)',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: tcNilaiEkonomi,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                validator: (val) =>
                    val == null || val.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Simpan Perubahan',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
