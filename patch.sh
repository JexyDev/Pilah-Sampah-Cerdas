sed -i 's/void _onQrDetected/Future<bool> _onQrDetected/g' lib/app/modules/petugas_pemilahan/views/aktivasi_tong_komunal_view.dart
sed -i 's/resumeCamera()/resetScanner()/g' lib/app/modules/petugas_pemilahan/views/aktivasi_tong_komunal_view.dart
sed -i 's/overlayText/hint/g' lib/app/modules/petugas_pemilahan/views/aktivasi_tong_komunal_view.dart
