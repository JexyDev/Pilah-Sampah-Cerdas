import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/values/app_colors.dart';
import '../../data/models/bin_entity.dart';
import '../../data/models/user_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../../data/providers/repository_providers.dart';

final allBinsMapProvider = FutureProvider.autoDispose<List<BinEntity>>((ref) async {
  final repo = ref.watch(binRepositoryProvider);
  return repo.getAllBins();
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

  // Polygon Boundary Points (A.8)
  List<LatLng> _polygonPoints = [];
  bool _isManualEditMode = false;

  @override
  void initState() {
    super.initState();
    _initLocation();
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
      _mapController.move(_currentLocation!, 16.0);
    } catch (_) {
      setState(() => _isLoadingLoc = false);
    }
  }

  /// Algoritma Auto-Generate Polygon Presisi berbasis Titik Rumah Warga (Convex Hull) (A.8)
  void _autoGeneratePolygon(List<BinEntity> bins) {
    if (bins.isEmpty) return;

    final points = bins.map((b) => LatLng(b.lat, b.lng)).toList();
    if (points.length < 3) {
      // Buffer lingkaran kecil jika titik kurang dari 3
      final center = points.first;
      setState(() {
        _polygonPoints = [
          LatLng(center.latitude + 0.0005, center.longitude + 0.0005),
          LatLng(center.latitude - 0.0005, center.longitude + 0.0005),
          LatLng(center.latitude - 0.0005, center.longitude - 0.0005),
          LatLng(center.latitude + 0.0005, center.longitude - 0.0005),
        ];
      });
      return;
    }

    // Sort points for Convex Hull (Andrew's Monotone Chain)
    points.sort((a, b) => a.latitude == b.latitude
        ? a.longitude.compareTo(b.longitude)
        : a.latitude.compareTo(b.latitude));

    List<LatLng> lower = [];
    for (var p in points) {
      while (lower.length >= 2 &&
          _crossProduct(lower[lower.length - 2], lower.last, p) <= 0) {
        lower.removeLast();
      }
      lower.add(p);
    }

    List<LatLng> upper = [];
    for (var p in points.reversed) {
      while (upper.length >= 2 &&
          _crossProduct(upper[upper.length - 2], upper.last, p) <= 0) {
        upper.removeLast();
      }
      upper.add(p);
    }

    lower.removeLast();
    upper.removeLast();

    final hull = [...lower, ...upper];

    setState(() {
      _polygonPoints = hull;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Auto-Generate Polygon Presisi Berhasil Dipasang!'),
        backgroundColor: AppColors.primaryGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  double _crossProduct(LatLng o, LatLng a, LatLng b) {
    return (a.longitude - o.longitude) * (b.latitude - o.latitude) -
        (a.latitude - o.latitude) * (b.longitude - o.longitude);
  }

  @override
  Widget build(BuildContext context) {
    final binsAsync = ref.watch(allBinsMapProvider);
    final bins = binsAsync.value ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Peta Monitoring & Polygon Warga'),
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
      body: Stack(
        children: [
          _isLoadingLoc
              ? const Center(child: CircularProgressIndicator())
              : FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _currentLocation ?? const LatLng(-6.8915, 107.6107),
                    initialZoom: 16.0,
                    onTap: (tapPosition, point) {
                      if (_isManualEditMode) {
                        setState(() {
                          _polygonPoints.add(point);
                        });
                      }
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.pilahsampah',
                    ),

                    // Polygon Layer RT/RW (A.8)
                    if (_polygonPoints.isNotEmpty)
                      PolygonLayer(
                        polygons: [
                          Polygon(
                            points: _polygonPoints,
                            color: AppColors.primaryGreen.withValues(alpha: 0.25),
                            borderColor: AppColors.primaryGreen,
                            borderStrokeWidth: 3,
                            isFilled: true,
                          ),
                        ],
                      ),

                    // Polygon Points Markers in Manual Mode
                    if (_isManualEditMode)
                      MarkerLayer(
                        markers: _polygonPoints.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final pt = entry.value;
                          return Marker(
                            point: pt,
                            width: 30,
                            height: 30,
                            child: GestureDetector(
                              onLongPress: () {
                                setState(() {
                                  _polygonPoints.removeAt(idx);
                                });
                              },
                              child: Container(
                                decoration: const BoxDecoration(
                                  color: AppColors.warningOrange,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '${idx + 1}',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
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

                    MarkerLayer(
                      markers: bins.map((bin) {
                        final isFull = bin.capacityPercent >= 0.9;
                        return Marker(
                          point: LatLng(bin.lat, bin.lng),
                          width: 50,
                          height: 50,
                          child: GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                builder: (_) => Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('Tong: ${bin.qrSerial}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                      const SizedBox(height: 8),
                                      Text('Pemilik: ${bin.householdName} (${bin.kelurahan})'),
                                      Text('Kapasitas: ${(bin.capacityPercent * 100).toStringAsFixed(1)}%'),
                                    ],
                                  ),
                                ),
                              );
                            },
                            child: Icon(
                              Icons.location_on_rounded,
                              color: isFull ? AppColors.dangerRed : AppColors.primaryGreen,
                              size: 40,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),

          // Floating Controls Toolbar for Polygon Mode (A.8)
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  cross: WrapCrossAlignment.center,
                  spacing: 8,
                  children: [
                    ElevatedButton.icon(
                      icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                      label: const Text('Auto-Generate Presisi', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => _autoGeneratePolygon(bins),
                    ),
                    FilterChip(
                      label: Text(_isManualEditMode ? 'Mode Manual: AKTIF' : 'Mode Manual', style: const TextStyle(fontSize: 12)),
                      selected: _isManualEditMode,
                      selectedColor: AppColors.warningOrange.withValues(alpha: 0.3),
                      onSelected: (val) {
                        setState(() {
                          _isManualEditMode = val;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(val
                                ? 'Mode Manual Aktif: Tap peta untuk tambah titik polygon. Tekan lama titik untuk menghapus.'
                                : 'Mode Manual Nonaktif.'),
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      },
                    ),
                    if (_polygonPoints.isNotEmpty)
                      OutlinedButton.icon(
                        icon: const Icon(Icons.clear_rounded, size: 16),
                        label: const Text('Reset Polygon', style: TextStyle(fontSize: 12)),
                        onPressed: () => setState(() => _polygonPoints.clear()),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
