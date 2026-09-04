import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';

class MapControls extends StatelessWidget {
  final MapController mapController;
  final VoidCallback onRecenter;
  final bool isGpsBad;

  const MapControls({
    super.key,
    required this.mapController,
    required this.onRecenter,
    required this.isGpsBad,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 16,
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
              } catch (_) {}
              return CompassButton(
                bearing: rotation,
                onPressed: () {
                  mapController.rotate(0.0);
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class CompassButton extends StatelessWidget {
  final double bearing;
  final VoidCallback onPressed;
  const CompassButton({super.key, required this.bearing, required this.onPressed});
  @override
  Widget build(BuildContext context) => const SizedBox();
}
