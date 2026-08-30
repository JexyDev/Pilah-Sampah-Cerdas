import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/group_zone_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../mahasiswa/controllers/kkn_map_controller.dart';

class MultiPoskoFormView extends ConsumerStatefulWidget {
  final PoskoItem? posko; // Jika null berarti nambah posko baru

  const MultiPoskoFormView({super.key, this.posko});

  @override
  ConsumerState<MultiPoskoFormView> createState() => _MultiPoskoFormViewState();
}

class _MultiPoskoFormViewState extends ConsumerState<MultiPoskoFormView> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _namaController;
  late TextEditingController _alamatController;
  late TextEditingController _latitudeController;
  late TextEditingController _longitudeController;
  late TextEditingController _radiusController;
  late TextEditingController _keteranganController;
  
  late MapController _mapController;
  LatLng? _selectedLocation;
  bool _isGettingLocation = false;
  bool _isLoading = false;
  bool _isUpdatingFromMap = false;

  @override
  void initState() {
    super.initState();
    _namaController = TextEditingController(text: widget.posko?.nama ?? '');
    _alamatController = TextEditingController(text: widget.posko?.alamat ?? '');
    _latitudeController = TextEditingController(text: widget.posko?.latitude.toString() ?? '');
    _longitudeController = TextEditingController(text: widget.posko?.longitude.toString() ?? '');
    _radiusController = TextEditingController(text: widget.posko?.radius.toString() ?? '100');
    _keteranganController = TextEditingController(text: widget.posko?.keterangan ?? '');
    
    _mapController = MapController();
    
    if (widget.posko != null) {
      _selectedLocation = LatLng(widget.posko!.latitude, widget.posko!.longitude);
    }
    
    _latitudeController.addListener(_onCoordinateTextChanged);
    _longitudeController.addListener(_onCoordinateTextChanged);
  }

  @override
  void dispose() {
    _latitudeController.removeListener(_onCoordinateTextChanged);
    _longitudeController.removeListener(_onCoordinateTextChanged);
    
    _namaController.dispose();
    _alamatController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _radiusController.dispose();
    _keteranganController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _onCoordinateTextChanged() {
    if (_isUpdatingFromMap) return;

    final lat = double.tryParse(_latitudeController.text);
    final lng = double.tryParse(_longitudeController.text);

    if (lat != null && lng != null) {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        final newLoc = LatLng(lat, lng);
        if (_selectedLocation == null ||
            _selectedLocation!.latitude != lat ||
            _selectedLocation!.longitude != lng) {
          setState(() {
            _selectedLocation = newLoc;
          });
          // Menggunakan Future.microtask untuk menghindari error update during build
          Future.microtask(() {
            try {
              _mapController.move(newLoc, 15.0);
            } catch (_) {}
          });
        }
      }
    }
  }

  void _updateControllersFromMap(LatLng point) {
    setState(() {
      _selectedLocation = point;
    });
    
    _isUpdatingFromMap = true;
    _latitudeController.text = point.latitude.toStringAsFixed(6);
    _longitudeController.text = point.longitude.toStringAsFixed(6);
    _isUpdatingFromMap = false;
  }

  Future<void> _getLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw Exception('Layanan lokasi tidak aktif.');
      
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) throw Exception('Izin lokasi ditolak.');
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Izin lokasi ditolak permanen.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      final newLoc = LatLng(position.latitude, position.longitude);
      _updateControllersFromMap(newLoc);
      
      try {
        _mapController.move(newLoc, 16.0);
      } catch (_) {}
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppColors.dangerRed),
        );
      }
    } finally {
      if (mounted) setState(() => _isGettingLocation = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan tentukan titik lokasi pada peta'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(kknRepositoryProvider);
      final mapState = ref.read(kknMapProvider);
      final kelompokId = mapState.wilayahKelompok?.kelompokId ?? mapState.groupZone?.kelompokId;

      final payload = {
        if (kelompokId != null) 'kelompokId': kelompokId,
        'nama': _namaController.text,
        'alamat': _alamatController.text,
        'latitude': double.tryParse(_latitudeController.text) ?? 0.0,
        'longitude': double.tryParse(_longitudeController.text) ?? 0.0,
        'radius': int.tryParse(_radiusController.text) ?? 100,
        'keterangan': _keteranganController.text,
      };

      if (widget.posko == null) {
        await repo.addMultiPosko(payload);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Posko berhasil ditambahkan'), backgroundColor: AppColors.primaryGreen),
          );
        }
      } else {
        await repo.updateMultiPosko(widget.posko!.id, payload);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Posko berhasil diupdate'), backgroundColor: AppColors.primaryGreen),
          );
        }
      }
      
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Gagal Menyimpan Posko', style: TextStyle(color: AppColors.dangerRed)),
            content: Text(e.toString().replaceAll('Exception: ', '')),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.posko != null;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Posko Tambahan' : 'Tambah Posko',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Posko yang ditambahkan di sini akan masuk ke dalam zona kehadiran Smart Zone untuk seluruh anggota kelompok.',
                              style: TextStyle(color: Colors.blue, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _namaController,
                      decoration: const InputDecoration(
                        labelText: 'Nama Posko',
                        hintText: 'Contoh: Posko Dusun 2 / Rumah Pak RT',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _alamatController,
                      decoration: const InputDecoration(
                        labelText: 'Alamat / Keterangan Lokasi',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),
                    
                    // --- MAP COMPONENT ---
                    const Text('Lokasi pada Peta', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    const Text(
                      'Tentukan lokasi dengan menekan pada peta, koordinat otomatis terisi.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 250,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter: _selectedLocation ?? const LatLng(-6.914744, 107.609810),
                              initialZoom: 15.0,
                              onTap: (tapPosition, point) => _updateControllersFromMap(point),
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.makerindo.pilahsampah',
                              ),
                              if (_selectedLocation != null)
                                MarkerLayer(
                                  markers: [
                                    Marker(
                                      point: _selectedLocation!,
                                      width: 36,
                                      height: 36,
                                      child: const Icon(Icons.home_work_rounded, size: 28, color: AppColors.primaryGreen),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                          // "Lokasi Saya" button
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              elevation: 2,
                              child: InkWell(
                                onTap: _isGettingLocation ? null : _getLocation,
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _isGettingLocation
                                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen))
                                          : const Icon(Icons.my_location_rounded, size: 18, color: AppColors.primaryGreen),
                                      const SizedBox(width: 6),
                                      const Text('Lokasi Saya', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _latitudeController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                            decoration: const InputDecoration(
                              labelText: 'Latitude',
                              border: OutlineInputBorder(),
                            ),
                            validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _longitudeController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                            decoration: const InputDecoration(
                              labelText: 'Longitude',
                              border: OutlineInputBorder(),
                            ),
                            validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _radiusController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Radius (meter)',
                        hintText: '100',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _keteranganController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Keterangan Tambahan (Opsional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (isEdit)
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _confirmDelete(context, ref, widget.posko!),
                              icon: const Icon(Icons.delete_outline_rounded, size: 18),
                              label: const Text('Hapus Posko', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.dangerRed,
                                side: const BorderSide(color: AppColors.dangerRed),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryGreen,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text(
                                'Simpan Perubahan',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      )
                    else
                      ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text(
                          'Tambah Posko',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, PoskoItem posko) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Posko?'),
        content: Text('Apakah Anda yakin ingin menghapus ${posko.nama}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                await repo.deleteMultiPosko(posko.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Posko berhasil dihapus'), backgroundColor: AppColors.primaryGreen),
                  );
                  Navigator.pop(context, true); // Pop the form view
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: AppColors.dangerRed),
                  );
                }
              }
            },
            child: const Text('Hapus', style: TextStyle(color: AppColors.dangerRed)),
          ),
        ],
      ),
    );
  }
}
