import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/network_exception_helper.dart';

void main() {
  group('KKN Attendance Checkout Logic Tests', () {
    test('Checkout minimum duration gate evaluates correctly at 30 minutes', () {
      const int targetMenit = 240;
      const int minCheckoutMenit =
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

    test('NetworkExceptionHelper maps EARLY_CHECKOUT_RESTRICTED to polite 30-min message', () {
      final dioExceptionWithTime = DioException(
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

      final errorMsgWithTime = NetworkExceptionHelper.getErrorMessage(dioExceptionWithTime);
      expect(
        errorMsgWithTime,
        'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk (mulai pukul 15:30 WIB).',
      );

      final dioExceptionWithoutTime = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
          statusCode: 422,
          data: {
            'error': 'EARLY_CHECKOUT_RESTRICTED',
            'message': 'EARLY_CHECKOUT_RESTRICTED',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final errorMsgWithoutTime = NetworkExceptionHelper.getErrorMessage(dioExceptionWithoutTime);
      expect(
        errorMsgWithoutTime,
        'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk.',
      );
    });

    test('NetworkExceptionHelper maps OUT_OF_GEOFENCE to polite Indonesian posko message', () {
      final checkOutException = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
          statusCode: 422,
          data: {
            'message': 'OUT_OF_GEOFENCE: Anda berada di luar radius posko.',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final checkOutMsg = NetworkExceptionHelper.getErrorMessage(checkOutException);
      expect(
        checkOutMsg,
        'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.',
      );

      final checkInException = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/mulai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/mulai'),
          statusCode: 422,
          data: {
            'message': 'OUT_OF_GEOFENCE',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final checkInMsg = NetworkExceptionHelper.getErrorMessage(checkInException);
      expect(
        checkInMsg,
        'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi masuk.',
      );
    });

    test('NetworkExceptionHelper maps OPERATIONAL_HOURS_VIOLATION to 05:00 WIB message', () {
      final hoursException = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/mulai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/mulai'),
          statusCode: 422,
          data: {
            'message': 'OPERATIONAL_HOURS_VIOLATION: Presensi hanya dapat dilakukan 05:00 - 20:00 WIB.',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final hoursMsg = NetworkExceptionHelper.getErrorMessage(hoursException);
      expect(
        hoursMsg,
        'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.',
      );
    });

    test('NetworkExceptionHelper maps 500 & connection errors to reassuring message', () {
      final server500Exception = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
        response: Response(
          requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
          statusCode: 500,
          data: {'message': 'Internal Server Error'},
        ),
        type: DioExceptionType.badResponse,
      );

      final server500Msg = NetworkExceptionHelper.getErrorMessage(server500Exception);
      expect(
        server500Msg,
        'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.',
      );

      final connectionException = DioException(
        requestOptions: RequestOptions(path: '/kkn/kegiatan/123/selesai'),
        type: DioExceptionType.connectionTimeout,
      );

      final connectionMsg = NetworkExceptionHelper.getErrorMessage(connectionException);
      expect(
        connectionMsg,
        'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.',
      );
    });
  });
}
