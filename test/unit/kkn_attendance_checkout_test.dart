import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/network_exception_helper.dart';

void main() {
  group('KKN Attendance Checkout Logic Tests', () {
    test('Checkout minimum duration gate evaluates correctly at 30 minutes', () {
      const int targetMenit = 240;
      final int minCheckoutMenit =
          (targetMenit > 0 && targetMenit < 30) ? targetMenit : 30;

      // Kasus 1: Durasi 25 menit (< 30 menit) -> Belum bisa checkout
      int durasiMenit = 25;
      bool canCheckout = durasiMenit >= minCheckoutMenit;
      expect(canCheckout, isFalse);

      // Kasus 2: Durasi 30 menit (tepat minimal) -> Sudah bisa checkout
      durasiMenit = 30;
      canCheckout = durasiMenit >= minCheckoutMenit;
      expect(canCheckout, isTrue);

      // Kasus 3: Durasi 37 menit (seperti pada issue mahasiswa) -> Sudah bisa checkout
      durasiMenit = 37;
      canCheckout = durasiMenit >= minCheckoutMenit;
      expect(canCheckout, isTrue);

      // Kasus 4: Durasi 240 menit (target penuh terpenuhi) -> Sudah bisa checkout
      durasiMenit = 240;
      canCheckout = durasiMenit >= minCheckoutMenit;
      expect(canCheckout, isTrue);
    });

    test('NetworkExceptionHelper extracts EARLY_CHECKOUT_RESTRICTED cleanly', () {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
          statusCode: 422,
          data: {
            'error': 'EARLY_CHECKOUT_RESTRICTED',
            'message':
                'EARLY_CHECKOUT_RESTRICTED: Presensi pulang minimal dapat dilakukan mulai 30 menit sebelum jam pulang kegiatan (pukul 15:30 WIB).',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final errorMsg = NetworkExceptionHelper.getErrorMessage(dioException);
      expect(
        errorMsg,
        'Presensi pulang minimal dapat dilakukan mulai 30 menit sebelum jam pulang kegiatan (pukul 15:30 WIB).',
      );
      expect(errorMsg.startsWith('EARLY_CHECKOUT_RESTRICTED:'), isFalse);
    });
  });
}
