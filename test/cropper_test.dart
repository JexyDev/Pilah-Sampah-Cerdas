import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/widgets/profile_photo_cropper_view.dart';

void main() {
  testWidgets('ProfilePhotoCropperView render test', (WidgetTester tester) async {
    final tempDir = Directory.systemTemp.createTempSync();
    final dummyFile = File('${tempDir.path}/test.png');
    dummyFile.writeAsBytesSync([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    await tester.pumpWidget(
      MaterialApp(
        home: ProfilePhotoCropperView(imageFile: dummyFile),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(ProfilePhotoCropperView), findsOneWidget);

    // Tap rotate button
    final rotateBtn = find.text('Putar 90°');
    expect(rotateBtn, findsOneWidget);
    await tester.tap(rotateBtn);
    await tester.pump(const Duration(milliseconds: 200));

    // Tap reset button
    final resetBtn = find.text('Reset');
    expect(resetBtn, findsOneWidget);
    await tester.tap(resetBtn);
    await tester.pump(const Duration(milliseconds: 200));

    // Test drag interaction
    final viewer = find.byType(InteractiveViewer);
    expect(viewer, findsOneWidget);
    await tester.drag(viewer, const Offset(0, -50));
    await tester.pump(const Duration(milliseconds: 100));

    // Tap Upload & Simpan Foto button
    final saveBtn = find.text('Upload & Simpan Foto');
    expect(saveBtn, findsOneWidget);
    await tester.tap(saveBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(SnackBar), findsNothing);

    try {
      tempDir.deleteSync(recursive: true);
    } catch (_) {}
  });
}
