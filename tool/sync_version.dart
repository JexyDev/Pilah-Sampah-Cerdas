// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

/// Sinkronisasi versi lokal pubspec.yaml dengan versi rilis CI/CD di server.
/// Jalankan: dart run tool/sync_version.dart
void main() async {
  const urls = [
    'https://berseka.id/api/v1/system/latest-release',
    'http://157.10.252.252:3000/api/v1/system/latest-release',
  ];

  String? version;
  int? buildNumber;

  final client = HttpClient()..connectionTimeout = const Duration(seconds: 5);

  for (final url in urls) {
    try {
      final request = await client.getUrl(Uri.parse(url));
      final response = await request.close().timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final body = await response.transform(utf8.decoder).join();
        final json = jsonDecode(body) as Map<String, dynamic>;
        version = json['latestVersion']?.toString() ?? json['version']?.toString();
        buildNumber = (json['buildNumber'] as num?)?.toInt();
        if (version != null) break;
      }
    } catch (_) {}
  }
  client.close();

  if (version == null || buildNumber == null) {
    print('❌ Gagal mengambil versi dari server. Pastikan koneksi internet aktif.');
    exit(1);
  }

  final pubspec = File('pubspec.yaml');
  if (!pubspec.existsSync()) {
    print('❌ pubspec.yaml tidak ditemukan. Jalankan dari root folder mobile.');
    exit(1);
  }

  final content = pubspec.readAsStringSync();
  final updated = content.replaceFirst(
    RegExp(r'^version:\s*.+$', multiLine: true),
    'version: $version+$buildNumber',
  );

  if (content == updated) {
    print('✅ Sudah sinkron: $version+$buildNumber');
  } else {
    pubspec.writeAsStringSync(updated);
    print('✅ pubspec.yaml diupdate: $version+$buildNumber');
  }
}
