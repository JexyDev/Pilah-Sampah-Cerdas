import 'package:dio/dio.dart';

class NetworkExceptionHelper {
  NetworkExceptionHelper._();

  /// Mengubah DioException / Exception umum menjadi pesan Bahasa Indonesia yang informatif.
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Koneksi ke server timeout. Harap periksa jaringan internet Anda.';

        case DioExceptionType.connectionError:
          return 'Gagal terhubung ke server. Pastikan HP Anda terhubung ke internet.';

        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final responseData = error.response?.data;

          // Periksa errorCode spesifik dari backend sebelum pesan generik
          if (responseData is Map<String, dynamic>) {
            final errorCode = responseData['error']?.toString() ?? '';
            switch (errorCode) {
              case 'STUDENT_PROFILE_INCOMPLETE':
                return 'Profil KKN Anda belum lengkap. Hubungi Admin atau DPL untuk melengkapi data NIM dan jurusan sebelum presensi.';
              case 'OUT_OF_COBLONG_BOUNDS':
                return 'Koordinat GPS Anda berada di luar wilayah KKN (Kecamatan Coblong). Pastikan GPS aktif dan Anda berada di lokasi yang benar.';
              case 'LOCATION_TELEPORTATION_DETECTED':
                return 'Perpindahan lokasi terlalu cepat terdeteksi. Pastikan GPS tidak dalam mode simulasi (Fake GPS).';
              case 'INVALID_COORDINATES':
                return 'Koordinat GPS tidak valid. Aktifkan GPS dan coba lagi.';
              default:
                // Fallback ke pesan dari backend jika bukan kode yang dikenal
                if (responseData['message'] != null) {
                  return responseData['message'].toString();
                }
            }
          }

          if (statusCode == 400) {
            return 'Permintaan tidak valid. Harap periksa data yang Anda masukkan.';
          } else if (statusCode == 401) {
            return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
          } else if (statusCode == 403) {
            return 'Anda tidak memiliki hak akses untuk tindakan ini.';
          } else if (statusCode == 404) {
            return 'Data atau layanan tidak ditemukan.';
          } else if (statusCode != null && statusCode >= 500) {
            return 'Server backend sedang mengalami kendala. Harap coba beberapa saat lagi.';
          }
          return 'Terjadi kendala pada respon server ($statusCode).';

        case DioExceptionType.cancel:
          return 'Permintaan dibatalkan.';

        case DioExceptionType.unknown:
        default:
          if (error.message != null && error.message!.contains('SocketException')) {
            return 'Tidak ada koneksi internet. Aktifkan paket data atau Wi-Fi.';
          }
          return 'Terjadi masalah jaringan yang tidak diketahui.';
      }
    }
    if (error is Exception) {
      final str = error.toString();
      if (str.contains('SocketException') || str.contains('Connection refused')) {
        return 'Tidak ada koneksi internet atau server sedang mati.';
      }
      if (str.contains('TimeoutException')) {
        return 'Waktu permintaan habis. Coba lagi.';
      }
      if (str.contains('FormatException')) {
        return 'Format data dari server tidak valid.';
      }
      if (str.startsWith('Exception: ')) {
        return str.substring(11);
      }
      return str;
    }
    return 'Terjadi kesalahan sistem. Harap coba beberapa saat lagi.';
  }
}
