import 'package:dio/dio.dart';
import 'network_exception_helper.dart';

/// Exception jaringan aplikasi dengan pesan bahasa Indonesia.
/// Digunakan oleh semua repository untuk konsistensi pesan error di UI.
class AppNetworkException implements Exception {
  const AppNetworkException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Pemetaan DioException → pesan error bahasa Indonesia yang ramah user.
///
/// Digunakan di layer Repository untuk menerjemahkan error jaringan
/// ke pesan yang bisa langsung ditampilkan di UI.
String mapDioExceptionToMessage(DioException e) {
  return NetworkExceptionHelper.getErrorMessage(e);
}
