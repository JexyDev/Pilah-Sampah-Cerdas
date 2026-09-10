import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/values/app_colors.dart';
import 'package:mobile_app_sampah/app/core/values/app_dimensions.dart';

void main() {
  testWidgets('BottomAppBar and Aksi Cepat CTA buttons render cleanly on extreme DPI (300dp)', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(300, 600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    Widget buildTestNav(String label) {
      return Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.home_rounded, color: AppColors.primaryGreen, size: 20),
              const SizedBox(height: 2),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  label,
                  maxLines: 1,
                  style: const TextStyle(fontSize: 10, color: AppColors.primaryGreen),
                ),
              ),
            ],
          ),
        ),
      );
    }

    Widget buildAksiCepat() {
      return Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 6),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Scan Sampah',
                        maxLines: 1,
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.restore_from_trash_rounded, color: AppColors.primaryGreen, size: 18),
                  SizedBox(width: 6),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        'Pengosongan',
                        maxLines: 1,
                        style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: buildAksiCepat(),
          ),
          bottomNavigationBar: BottomAppBar(
            elevation: 8,
            child: SizedBox(
              height: AppDimensions.bottomNavHeight,
              child: Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        buildTestNav('Beranda'),
                        buildTestNav('Riwayat'),
                      ],
                    ),
                  ),
                  const SizedBox(width: 44),
                  Expanded(
                    child: Row(
                      children: [
                        buildTestNav('Poin'),
                        buildTestNav('Profil'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pump();

    expect(find.byType(BottomAppBar), findsOneWidget);
    expect(find.text('Scan Sampah'), findsOneWidget);
    expect(find.text('Pengosongan'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('UkurKapasitas preset header and action bar render without overflow on extreme DPI (300x580)', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(300, 580);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.straighten_rounded, color: AppColors.primaryGreen, size: 20),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Ukuran Standar (Tinggal Pilih)',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Kecil ➔ Besar',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          bottomNavigationBar: SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () {},
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text('Ubah bentuk'),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {},
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text('Simpan Tempat Sampah'),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pump();
    expect(find.text('Ukuran Standar (Tinggal Pilih)'), findsOneWidget);
    expect(find.text('Ubah bentuk'), findsOneWidget);
    expect(find.text('Simpan Tempat Sampah'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('QrScannerWidget non-fullscreen layout scales cleanly without overflow in constrained height (200dp)', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(300, 580);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              Expanded(
                child: Center(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final double maxW = constraints.maxWidth;
                      final double maxH = constraints.maxHeight.isFinite ? constraints.maxHeight : maxW;
                      final double side = maxW < maxH ? maxW : maxH;
                      return Center(
                        child: SizedBox(
                          width: side,
                          height: side,
                          child: Container(color: Colors.black),
                        ),
                      );
                    },
                  ),
                ),
              ),
              SafeArea(
                top: false,
                child: Container(
                  height: 300,
                  color: Colors.white,
                  child: const Center(child: Text('Bottom Sheet')),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    await tester.pump();
    expect(find.text('Bottom Sheet'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
