import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/providers/repository_providers.dart';
import 'package:mobile_app_sampah/app/data/repositories/auth_repository.dart';
import 'package:mobile_app_sampah/app/modules/auth/views/forgot_password_view.dart';
import 'package:mobile_app_sampah/app/modules/shared/widgets/otp_input_widget.dart';

class FakeAuthRepository extends Fake implements AuthRepository {
  @override
  Future<UserEntity?> getCurrentUser() async => null;

  @override
  Future<void> requestOtp({required String phone, bool isForgotPassword = false}) async {
    return;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('ForgotPasswordView step 2 paste button pastes OTP from clipboard', (tester) async {
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (MethodCall methodCall) async {
        if (methodCall.method == 'Clipboard.getData') {
          return <String, dynamic>{'text': '852963'};
        }
        return null;
      },
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
        ],
        child: const MaterialApp(
          home: ForgotPasswordView(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Enter valid phone number and submit to get to step 2
    final phoneField = find.byType(TextFormField).first;
    await tester.enterText(phoneField, '081234567890');
    await tester.pump();

    final sendOtpBtn = find.text('KIRIM KODE OTP');
    await tester.tap(sendOtpBtn);
    await tester.pumpAndSettle();

    // Verify Step 2 is shown
    expect(find.byType(OtpInputWidget), findsOneWidget);

    final pasteBtn = find.text('Tempel OTP dari Clipboard');
    expect(pasteBtn, findsOneWidget);

    // Tap paste button
    await tester.tap(pasteBtn);
    await tester.pump();

    // OtpInputWidget should have all 6 digits populated
    final otpWidget = tester.state<OtpInputWidgetState>(find.byType(OtpInputWidget));
    expect(otpWidget.currentValue, '852963');
  });
}
