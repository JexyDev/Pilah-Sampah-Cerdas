sed -i '/final dailyPointsProvider = FutureProvider<int>((ref) async {/i \
/// Provider total frekuensi setor sampah\n\
final totalSetoranProvider = FutureProvider<int>((ref) async {\n\
  final history = await ref.watch(pointHistoryProvider.future);\n\
  final setoranHistory = history.where((h) {\n\
    final descLower = h.description.toLowerCase();\n\
    final isAktivasi = descLower.contains('\''aktivasi'\'') || descLower.contains('\''activation'\'');\n\
    final isPunishment = h.points < 0 || descLower.contains('\''penalti'\'') || descLower.contains('\''punishment'\'');\n\
    final isRedeem = descLower.contains('\''redeem'\'') || descLower.contains('\''tukar'\'');\n\
    final isPresensi = descLower.contains('\''presensi'\'') || descLower.contains('\''geofence'\'');\n\
    return h.points > 0 && !isAktivasi && !isPunishment && !isRedeem && !isPresensi;\n\
  });\n\
  return setoranHistory.length;\n\
});\n\
' ./lib/app/modules/riwayat/controllers/riwayat_controller.dart
bash patch_controller.sh
