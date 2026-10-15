import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/modules/shared/widgets/otp_input_widget.dart';

void main() {
  testWidgets('OtpInputWidget setOtp populates fields and triggers callbacks', (tester) async {
    String completedValue = '';
    String changedValue = '';
    final key = GlobalKey<OtpInputWidgetState>();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: OtpInputWidget(
            key: key,
            length: 6,
            autoFocus: false,
            onCompleted: (val) => completedValue = val,
            onChanged: (val) => changedValue = val,
          ),
        ),
      ),
    );

    key.currentState!.setOtp('123456');
    await tester.pump();

    expect(key.currentState!.currentValue, '123456');
    expect(changedValue, '123456');
    expect(completedValue, '123456');
  });

  testWidgets('OtpInputWidget setOtp ignores non-digits and handles partial', (tester) async {
    String completedValue = '';
    String changedValue = '';
    final key = GlobalKey<OtpInputWidgetState>();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: OtpInputWidget(
            key: key,
            length: 6,
            autoFocus: false,
            onCompleted: (val) => completedValue = val,
            onChanged: (val) => changedValue = val,
          ),
        ),
      ),
    );

    key.currentState!.setOtp('12a-3b4');
    await tester.pump();

    expect(key.currentState!.currentValue, '1234');
    expect(changedValue, '1234');
    expect(completedValue, '');
  });

  testWidgets('OtpInputWidget multi-digit paste distributes across fields', (tester) async {
    String completedValue = '';
    String changedValue = '';

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: OtpInputWidget(
            length: 6,
            autoFocus: false,
            onCompleted: (val) => completedValue = val,
            onChanged: (val) => changedValue = val,
          ),
        ),
      ),
    );

    final firstBox = find.byType(TextFormField).first;
    await tester.enterText(firstBox, '654321');
    await tester.pump();

    expect(changedValue, '654321');
    expect(completedValue, '654321');
  });
}
