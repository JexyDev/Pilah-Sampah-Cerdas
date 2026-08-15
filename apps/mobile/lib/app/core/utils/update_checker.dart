import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateChecker {
  static const String _versionUrl = 'http://157.10.252.252:3000/api/v1/app-version';

  static Future<void> checkForUpdate(BuildContext context) async {
    try {
      final dio = Dio();
      final response = await dio.get(
        _versionUrl,
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        final latestVersion = response.data['latestVersion']?.toString();
        final downloadUrl = response.data['downloadUrl']?.toString();
        final isForceUpdate = response.data['forceUpdate'] == true;

        if (latestVersion != null && downloadUrl != null) {
          final packageInfo = await PackageInfo.fromPlatform();
          final currentVersion = packageInfo.version;

          if (_isUpdateAvailable(currentVersion, latestVersion)) {
            if (context.mounted) {
              _showUpdateDialog(context, latestVersion, downloadUrl, isForceUpdate);
            }
          }
        }
      }
    } catch (e) {
      // Gagal cek update, biarkan aplikasi berjalan normal
      debugPrint('Failed to check for update: $e');
    }
  }

  static bool _isUpdateAvailable(String current, String latest) {
    List<int> currentParts = current.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    List<int> latestParts = latest.split('.').map((e) => int.tryParse(e) ?? 0).toList();

    for (int i = 0; i < 3; i++) {
      int c = i < currentParts.length ? currentParts[i] : 0;
      int l = i < latestParts.length ? latestParts[i] : 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }

  static void _showUpdateDialog(
    BuildContext context,
    String latestVersion,
    String downloadUrl,
    bool isForceUpdate,
  ) {
    showDialog(
      context: context,
      barrierDismissible: !isForceUpdate,
      builder: (context) => PopScope(
        canPop: !isForceUpdate,
        child: AlertDialog(
          title: const Text('Update Tersedia!'),
          content: Text(
            'Versi terbaru aplikasi Pilah Sampah (v$latestVersion) telah tersedia. '
            'Silakan update untuk menikmati fitur terbaru dan perbaikan sistem.',
          ),
          actions: [
            if (!isForceUpdate)
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Nanti', style: TextStyle(color: Colors.grey)),
              ),
            ElevatedButton(
              onPressed: () async {
                final uri = Uri.parse(downloadUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Gagal membuka tautan unduhan.')),
                    );
                  }
                }
              },
              child: const Text('Update Sekarang'),
            ),
          ],
        ),
      ),
    );
  }
}
