import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
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
      builder: (context) => _UpdateDialog(
        latestVersion: latestVersion,
        downloadUrl: downloadUrl,
        isForceUpdate: isForceUpdate,
      ),
    );
  }
}

class _UpdateDialog extends StatefulWidget {
  final String latestVersion;
  final String downloadUrl;
  final bool isForceUpdate;

  const _UpdateDialog({
    required this.latestVersion,
    required this.downloadUrl,
    required this.isForceUpdate,
  });

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  bool _isDownloading = false;
  double _progress = 0.0;
  String _statusMessage = '';

  Future<void> _startDownload() async {
    setState(() {
      _isDownloading = true;
      _progress = 0.0;
      _statusMessage = 'Memulai unduhan...';
    });

    try {
      // 1. Siapkan direktori penyimpanan
      final dir = await getExternalStorageDirectory();
      final savePath = '${dir?.path ?? '/storage/emulated/0/Download'}/update_v${widget.latestVersion}.apk';

      // 2. Download menggunakan Dio
      final dio = Dio();
      await dio.download(
        widget.downloadUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _progress = received / total;
              _statusMessage = 'Mengunduh... ${(received / 1024 / 1024).toStringAsFixed(1)} MB / ${(total / 1024 / 1024).toStringAsFixed(1)} MB';
            });
          }
        },
      );

      setState(() {
        _progress = 1.0;
        _statusMessage = 'Unduhan selesai! Membuka instalasi...';
      });

      // 3. Buka (Install) APK otomatis menggunakan open_filex
      final result = await OpenFilex.open(savePath);
      if (result.type != ResultType.done && mounted) {
        // Fallback jika tidak bisa buka otomatis, lempar ke browser
        _fallbackToBrowser();
      }
    } catch (e) {
      debugPrint('Auto download failed: $e');
      if (mounted) _fallbackToBrowser();
    } finally {
      if (mounted) {
        setState(() {
          _isDownloading = false;
        });
      }
    }
  }

  void _fallbackToBrowser() async {
    final uri = Uri.parse(widget.downloadUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal mengunduh atau membuka file instalasi.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !widget.isForceUpdate && !_isDownloading,
      child: AlertDialog(
        title: const Text('Update Tersedia!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Versi terbaru aplikasi Pilah Sampah (v${widget.latestVersion}) telah tersedia. '
              'Silakan update untuk menikmati fitur terbaru dan perbaikan sistem.',
            ),
            if (_isDownloading) ...[
              const SizedBox(height: 20),
              LinearProgressIndicator(value: _progress),
              const SizedBox(height: 8),
              Text(
                _statusMessage,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ],
        ),
        actions: [
          if (!widget.isForceUpdate && !_isDownloading)
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Nanti', style: TextStyle(color: Colors.grey)),
            ),
          ElevatedButton(
            onPressed: _isDownloading ? null : _startDownload,
            child: Text(_isDownloading ? 'Memproses...' : 'Update Sekarang (Auto)'),
          ),
        ],
      ),
    );
  }
}
