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
        case DioExceptionType.connectionError:
          if (error.requestOptions.path.contains('kkn') ||
              error.requestOptions.path.contains('presensi') ||
              error.requestOptions.path.contains('kegiatan')) {
            return 'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.';
          }
          return 'Gagal terhubung ke server (waktu koneksi habis). Harap periksa jaringan internet Anda atau coba sesaat lagi.';

        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final responseData = error.response?.data;

          // Deteksi error 5xx (Server error / VPS down / Bad Gateway)
          if (statusCode != null && statusCode >= 500) {
            // Periksa jika server mengembalikan pesan spesifik mengenai geofence / operasional
            if (responseData is Map<String, dynamic> && responseData['message'] != null) {
              final m = responseData['message'].toString().trim();
              if (m.isNotEmpty && !m.startsWith('<!DOCTYPE') && !m.startsWith('<html')) {
                if (m.contains('OUT_OF_GEOFENCE')) {
                  final isMulai = error.requestOptions.path.contains('mulai');
                  return isMulai
                      ? 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi masuk.'
                      : 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.';
                }
                if (m.contains('OPERATIONAL_HOURS_VIOLATION') || m.contains('05:00')) {
                  return 'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.';
                }
              }
            }
            return 'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.';
          }

          // Periksa errorCode spesifik dari backend sebelum pesan generik
          if (responseData is Map<String, dynamic>) {
            final errorCode = responseData['error']?.toString() ?? '';
            final reqPath = error.requestOptions.path;
            switch (errorCode) {
              case 'OPERATIONAL_HOURS_VIOLATION':
                return 'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.';
              case 'OUT_OF_GEOFENCE':
              case 'OUT_OF_COBLONG_BOUNDS':
                final isMulai = reqPath.contains('mulai');
                return isMulai
                    ? 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi masuk.'
                    : 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.';
              case 'EARLY_CHECKOUT_RESTRICTED':
                final customMsg = responseData['message']?.toString() ?? '';
                final match = RegExp(r'(\d{1,2}[:.]\d{2}(?:\s*WIB)?)').firstMatch(customMsg);
                if (match != null) {
                  return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk (mulai pukul ${match.group(1)!}).';
                }
                return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk.';
              case 'BIN_RW_MISMATCH':
                final customMsg = responseData['message']?.toString();
                if (customMsg != null && customMsg.isNotEmpty && !RegExp(r'^[A-Z_]+$').hasMatch(customMsg)) {
                  return customMsg.replaceFirst(RegExp(r'^BIN_RW_MISMATCH:\s*', caseSensitive: false), '');
                }
                return 'Stiker tempat sampah dialokasikan khusus untuk RW lain, bukan untuk wilayah penugasan Anda.';
              case 'BIN_ALREADY_OWNED':
                final customMsg = responseData['message']?.toString();
                if (customMsg != null && customMsg.isNotEmpty && !RegExp(r'^[A-Z_]+$').hasMatch(customMsg)) {
                  return customMsg;
                }
                return 'Tempat sampah ini sudah dimiliki oleh warga lain dan tidak dapat diaktivasi ulang.';
              case 'STUDENT_PROFILE_INCOMPLETE':
                return 'Profil KKN Anda belum lengkap. Hubungi Admin atau DPL untuk melengkapi data NIM dan jurusan sebelum presensi.';
              case 'LOCATION_TELEPORTATION_DETECTED':
                return 'Perpindahan lokasi terlalu cepat terdeteksi. Pastikan GPS tidak dalam mode simulasi (Fake GPS).';
              case 'INVALID_COORDINATES':
                return 'Koordinat GPS tidak valid. Aktifkan GPS dan coba lagi.';
              default:
                // Fallback ke pesan dari backend jika bukan kode yang dikenal
                if (responseData['message'] != null) {
                  final msg = responseData['message'].toString().trim();
                  if (msg.contains('OUT_OF_GEOFENCE')) {
                    final isMulai = reqPath.contains('mulai');
                    return isMulai
                        ? 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi masuk.'
                        : 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.';
                  }
                  if (msg.contains('OPERATIONAL_HOURS_VIOLATION') ||
                      msg.contains('05:00') ||
                      msg.toLowerCase().contains('belum bisa diakses')) {
                    return 'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.';
                  }
                  if (msg.contains('EARLY_CHECKOUT_RESTRICTED')) {
                    final match = RegExp(r'(\d{1,2}[:.]\d{2}(?:\s*WIB)?)').firstMatch(msg);
                    if (match != null) {
                      return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk (mulai pukul ${match.group(1)!}).';
                    }
                    return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk.';
                  }
                  if (msg == 'BIN_RW_MISMATCH') {
                    return 'Stiker tempat sampah dialokasikan khusus untuk RW lain, bukan untuk wilayah penugasan Anda.';
                  }
                  if (RegExp(r'^[A-Z_]+$').hasMatch(msg)) {
                    return 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
                  }
                  return msg.replaceFirst(RegExp(r'^[A-Z_]+:\s*'), '');
                }
            }
          }

          if (statusCode == 400) {
            return 'Permintaan tidak valid. Harap periksa data yang Anda masukkan.';
          } else if (statusCode == 401) {
            return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
          } else if (statusCode == 403) {
            if (responseData is Map<String, dynamic> && responseData['message'] != null) {
              final m = responseData['message'].toString();
              if (m.contains('OUT_OF_GEOFENCE')) {
                final isMulai = error.requestOptions.path.contains('mulai');
                return isMulai
                    ? 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi masuk.'
                    : 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.';
              }
              if (m.contains('05:00') || m.contains('OPERATIONAL_HOURS')) {
                return 'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.';
              }
            }
            return 'Anda tidak memiliki hak akses untuk tindakan ini.';
          } else if (statusCode == 404) {
            return 'Data atau layanan tidak ditemukan di server.';
          }
          return statusCode != null
              ? 'Terjadi kendala pada respon server ($statusCode).'
              : 'Terjadi kendala pada respon server.';

        case DioExceptionType.cancel:
          return 'Permintaan dibatalkan.';

        case DioExceptionType.unknown:
        default:
          final raw = '${error.error} ${error.message}';
          if (raw.contains('Connection refused') ||
              raw.contains('Failed host lookup') ||
              raw.contains('SocketException')) {
            return 'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.';
          }
          return 'Gagal terhubung ke server atau terjadi masalah jaringan.';
      }
    }
    if (error is Exception) {
      final str = error.toString();
      if (str.contains('Connection refused') ||
          str.contains('Failed host lookup') ||
          str.contains('SocketException')) {
        return 'Sistem sedang penyesuaian sejenak. Tenang, data presensi Anda tetap aman.';
      }
      if (str.contains('OUT_OF_GEOFENCE')) {
        return 'Posisi Anda berada di luar area posko. Silakan mendekat ke lokasi posko KKN untuk presensi pulang.';
      }
      if (str.contains('OPERATIONAL_HOURS_VIOLATION') || str.contains('05:00')) {
        return 'Presensi kegiatan belum dibuka. Jam masuk posko dimulai pukul 05:00 WIB.';
      }
      if (str.contains('EARLY_CHECKOUT_RESTRICTED')) {
        final match = RegExp(r'(\d{1,2}[:.]\d{2}(?:\s*WIB)?)').firstMatch(str);
        if (match != null) {
          return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk (mulai pukul ${match.group(1)!}).';
        }
        return 'Presensi pulang dapat dilakukan minimal 30 menit setelah jam masuk.';
      }
      if (str.contains('TimeoutException')) {
        final msgMatch = RegExp(r'TimeoutException: (.+)').firstMatch(str);
        final customMsg = msgMatch?.group(1)?.trim();
        if (customMsg != null &&
            customMsg.isNotEmpty &&
            !customMsg.startsWith('Future not completed')) {
          return customMsg;
        }
        return 'GPS atau koneksi ke server tidak merespons. Periksa koneksi internet & sinyal GPS, lalu coba lagi.';
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
