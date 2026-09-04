import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'dart:math' as math;

/// Widget overlay untuk kontrol peta: Tombol Kompas & Lokasi Saya.
class MapControls extends StatelessWidget {
  final MapController mapController;
  final VoidCallback onRecenter;
  final bool isGpsBad;

  const MapControls({
    super.key,
    required this.mapController,
    required this.onRecenter,
    this.isGpsBad = false,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 12,
      bottom: 24,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          StreamBuilder<MapEvent>(
            stream: mapController.mapEventStream,
            builder: (context, snapshot) {
              double rotation = 0.0;
              try {
                rotation = snapshot.data?.camera.rotation ?? mapController.camera.rotation;
              } catch (_) {
                // Ignore if camera is not ready yet
              }
              
              return _CompassButton(
                bearing: rotation,
                onPressed: () {
                  mapController.rotate(0.0);
                },
              );
            },
          ),
          const SizedBox(height: 12),
          _MyLocationButton(
            onPressed: onRecenter,
            isGpsBad: isGpsBad,
          ),
        ],
      ),
    );
  }
}

class _CompassButton extends StatelessWidget {
  final double bearing;
  final VoidCallback onPressed;

  const _CompassButton({
    required this.bearing,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    // Tampilkan tombol kompas hanya saat peta diputar
    return AnimatedOpacity(
      opacity: bearing != 0.0 ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: IgnorePointer(
        ignoring: bearing == 0.0,
        child: Material(
          shape: const CircleBorder(),
          elevation: 4,
          color: Colors.white,
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onPressed,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Transform.rotate(
                angle: -bearing * (math.pi / 180), // konversi derajat ke radian
                child: const Icon(Icons.explore, color: Colors.redAccent),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MyLocationButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isGpsBad;

  const _MyLocationButton({
    required this.onPressed,
    required this.isGpsBad,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      shape: const CircleBorder(),
      elevation: 4,
      color: Colors.white,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                Icons.my_location,
                color: isGpsBad ? Colors.grey.shade400 : Colors.blueAccent,
              ),
              if (isGpsBad)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: Colors.orange,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.warning_rounded,
                      size: 10,
                      color: Colors.white,
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
