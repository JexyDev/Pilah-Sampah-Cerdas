import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/values/app_colors.dart';
import '../../data/models/bin_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../../data/providers/repository_providers.dart';

// Provider untuk data semua bin untuk peta
final allBinsMapProvider = FutureProvider.autoDispose<List<BinEntity>>((ref) async {
  final repo = ref.watch(binRepositoryProvider);
  // Di sini seharusnya memanggil endpoint getAllBins dari repo,
  // namun jika api_bin_repository belum punya getSemuaBins, kita mock atau panggil getBinsByHousehold sementara,
  // ATAU kita butuh endpoint baru di ApiBinRepository.
  // Untuk saat ini kita pakai getBinsByHousehold jika warga, atau jika ada endpoint all bins.
  // Karena backend belum ada (mock), kita kembalikan empty list sementara atau data dummy.
  return []; // Nanti akan disambungkan ke API
});

class PetaMonitoringView extends ConsumerStatefulWidget {
  const PetaMonitoringView({super.key});

  @override
  ConsumerState<PetaMonitoringView> createState() => _PetaMonitoringViewState();
}

class _PetaMonitoringViewState extends ConsumerState<PetaMonitoringView> {
  final MapController _mapController = MapController();
  LatLng? _currentLocation;
  Timer? _refreshTimer;
  bool _isLoadingLoc = true;

  @override
  void initState() {
    super.initState();
    _initLocation();
    // Auto-refresh setiap 30 detik
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      ref.invalidate(allBinsMapProvider);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _initLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => _isLoadingLoc = false);
      return;
    }
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() => _isLoadingLoc = false);
        return;
      }
    }
    if (permission == LocationPermission.deniedForever) {
      setState(() => _isLoadingLoc = false);
      return;
    }

    try {
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        _isLoadingLoc = false;
      });
      _mapController.move(_currentLocation!, 15.0);
    } catch (_) {
      setState(() => _isLoadingLoc = false);
    }
  }

  void _showBinBottomSheet(BinEntity bin) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Tong: ${bin.qrSerial}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Text('Kapasitas: ${(bin.capacityPercent * 100).toStringAsFixed(1)}%'),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Permintaan kosongkan tong ${bin.qrSerial} terkirim.'),
                      backgroundColor: AppColors.primaryGreen,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('KOSONGKAN TONG'),
              )
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final binsAsync = ref.watch(allBinsMapProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Peta Monitoring'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(allBinsMapProvider);
              _initLocation();
            },
          )
        ],
      ),
      body: _isLoadingLoc
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _currentLocation ?? const LatLng(-6.200000, 106.816666),
                initialZoom: 15.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.pilahsampah',
                ),
                if (_currentLocation != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _currentLocation!,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.my_location, color: Colors.blue, size: 30),
                      ),
                    ],
                  ),
                binsAsync.when(
                  data: (bins) {
                    return MarkerLayer(
                      markers: bins.map((bin) {
                        final isFull = bin.capacityPercent >= 0.9;
                        return Marker(
                          point: LatLng(bin.lat, bin.lng),
                          width: 50,
                          height: 50,
                          child: GestureDetector(
                            onTap: () => _showBinBottomSheet(bin),
                            child: isFull
                                ? const _BlinkingMarker()
                                : const Icon(Icons.location_on, color: Colors.green, size: 40),
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const MarkerLayer(markers: []),
                  error: (_, __) => const MarkerLayer(markers: []),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _initLocation,
        backgroundColor: AppColors.primaryGreen,
        child: const Icon(Icons.my_location),
      ),
    );
  }
}

class _BlinkingMarker extends StatefulWidget {
  const _BlinkingMarker();

  @override
  State<_BlinkingMarker> createState() => _BlinkingMarkerState();
}

class _BlinkingMarkerState extends State<_BlinkingMarker> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: const Icon(Icons.location_on, color: Colors.red, size: 40),
    );
  }
}
