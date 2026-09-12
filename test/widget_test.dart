import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/values/app_config.dart';
import 'package:mobile_app_sampah/app/core/utils/platform_utils.dart';
import 'package:qr_flutter/qr_flutter.dart';

void main() {
  group('AppConfig', () {
    test('geofence radius sesuai sdd.md §4.2', () {
      expect(AppConfig.geofenceRadiusMeters, equals(10));
    });

    test('bin max capacity sesuai srs.md FR-02', () {
      expect(AppConfig.binMaxCapacityLiters, equals(25.0));
    });

    test('bin critical threshold sesuai srs.md FR-04', () {
      expect(AppConfig.binCriticalThresholdPercent, equals(0.90));
    });

    test('organic density sesuai srs.md FR-03', () {
      expect(AppConfig.organicDensityKgPerLiter, equals(0.4));
    });

    test('non-organic density sesuai srs.md FR-03', () {
      expect(AppConfig.nonOrganicDensityKgPerLiter, equals(0.2));
    });

    test('points per kg sesuai srs.md FR-03', () {
      expect(AppConfig.pointsPerKg, equals(100));
    });

    test('AI timeout sesuai srs.md FR-01', () {
      expect(AppConfig.aiTimeoutMs, equals(2000));
    });

    test('AI daily limit sesuai srs.md NFR-02', () {
      expect(AppConfig.aiDailyLimit, equals(50));
    });
  });

  group('PlatformUtils', () {
    test('platformName tidak kosong', () {
      expect(PlatformUtils.platformName, isNotEmpty);
    });

    test('supportsGps selalu true', () {
      expect(PlatformUtils.supportsGps, isTrue);
    });
  });

  testWidgets('Test QR preview dialog tab switch', (tester) async {
    bool showStikerPhoto = true;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (dialogCtx, setDialogState) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      key: const Key('switch_tab'),
                      onTap: () => setDialogState(() => showStikerPhoto = false),
                      child: const Text('Scan Barcode Saja'),
                    ),
                    if (showStikerPhoto) ...[
                      const Text('Poster photo'),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CustomPaint(
                          size: const Size.square(200),
                          painter: QrPainter(
                            data: 'BSK-OGN-070926-0663',
                            version: QrVersions.auto,
                            gapless: false,
                            eyeStyle: const QrEyeStyle(
                              eyeShape: QrEyeShape.square,
                              color: Colors.black,
                            ),
                            dataModuleStyle: const QrDataModuleStyle(
                              dataModuleShape: QrDataModuleShape.square,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('Poster photo'), findsOneWidget);

    // Tap switch tab
    await tester.tap(find.byKey(const Key('switch_tab')));
    await tester.pumpAndSettle();

    expect(find.byType(CustomPaint), findsWidgets);
  });
}
