import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../values/app_colors.dart';
import 'safe_storage.dart';

/// Provider reaktif untuk memicu rebuild UI ketika status penyembunyian riwayat berubah.
final hiddenHistoryVersionProvider = StateProvider<int>((ref) => 0);

/// Service untuk mengelola penyembunyian riwayat dari sisi antarmuka klien (UI).
///
/// Opsi A: Client-Side Hide / Clear Display.
/// Menyembunyikan riwayat dari layar HP tanpa menghapus data audit & transaksi di database VPS.
/// Menggunakan dual-layer persistence (SharedPreferences + SafeStorage) agar data tidak hilang saat logout-login.
class HiddenHistoryService {
  HiddenHistoryService._();

  static const String _prefixClearTime = 'hidden_history_clear_time_';
  static const String _prefixHiddenIds = 'hidden_history_ids_';

  // Scope identifier untuk 6 halaman riwayat
  static const String scopeWargaWaste = 'warga_waste';
  static const String scopeWargaPoints = 'warga_points';
  static const String scopeMahasiswaKkn = 'mahasiswa_kkn';
  static const String scopeMahasiswaPoints = 'mahasiswa_points';
  static const String scopePetugasTasks = 'petugas_tasks';
  static const String scopePetugasPoints = 'petugas_points';

  static SharedPreferences? _prefs;
  static const SafeStorage _storage = SafeStorage();

  /// Memastikan instance SharedPreferences telah dimuat ke memori dan tersinkronisasi dari SafeStorage.
  static Future<SharedPreferences> ensureInitialized() async {
    _prefs ??= await SharedPreferences.getInstance();

    // Auto-restore dari SafeStorage jika SharedPreferences sempat ter-wipe saat logout
    const scopes = [
      scopeWargaWaste,
      scopeWargaPoints,
      scopeMahasiswaKkn,
      scopeMahasiswaPoints,
      scopePetugasTasks,
      scopePetugasPoints,
    ];
    for (final s in scopes) {
      final keyTime = '$_prefixClearTime$s';
      final keyIds = '$_prefixHiddenIds$s';
      if (_prefs!.getInt(keyTime) == null) {
        final backupTime = await _storage.read(key: 'backup_$keyTime');
        if (backupTime != null) {
          final t = int.tryParse(backupTime);
          if (t != null) await _prefs!.setInt(keyTime, t);
        }
      }
      if (_prefs!.getStringList(keyIds) == null) {
        final backupIds = await _storage.read(key: 'backup_$keyIds');
        if (backupIds != null && backupIds.isNotEmpty) {
          await _prefs!.setStringList(keyIds, backupIds.split(','));
        }
      }
    }

    return _prefs!;
  }

  /// Menyembunyikan seluruh tampilan riwayat saat ini untuk scope tertentu.
  /// Menyimpan seluruh ID aktif dan timestamp toleran agar data lama tidak bocor kembali.
  static Future<void> clearDisplay(
    String scope, {
    List<String>? currentItemIds,
  }) async {
    try {
      final p = await ensureInitialized();
      final nowLocal = DateTime.now().millisecondsSinceEpoch;
      final nowUtc = DateTime.now().toUtc().millisecondsSinceEpoch;
      final safeNow = nowLocal > nowUtc ? nowLocal : nowUtc;
      await p.setInt('$_prefixClearTime$scope', safeNow);
      await _storage.write(key: 'backup_$_prefixClearTime$scope', value: '$safeNow');

      final key = '$_prefixHiddenIds$scope';
      final list = p.getStringList(key) ?? [];
      if (currentItemIds != null && currentItemIds.isNotEmpty) {
        for (final id in currentItemIds) {
          if (id.isNotEmpty && !list.contains(id)) {
            list.add(id);
          }
        }
        await p.setStringList(key, list);
        await _storage.write(key: 'backup_$key', value: list.join(','));
      }
      debugPrint(
        '[HiddenHistoryService] Display cleared for scope: $scope with ${currentItemIds?.length ?? 0} ids at $safeNow',
      );
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error clearing display: $e');
    }
  }

  /// Memulihkan seluruh tampilan riwayat yang sebelumnya disembunyikan.
  static Future<void> restoreDisplay(String scope) async {
    try {
      final p = await ensureInitialized();
      await p.remove('$_prefixClearTime$scope');
      await p.remove('$_prefixHiddenIds$scope');
      await _storage.delete(key: 'backup_$_prefixClearTime$scope');
      await _storage.delete(key: 'backup_$_prefixHiddenIds$scope');
      debugPrint('[HiddenHistoryService] Display restored for scope: $scope');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error restoring display: $e');
    }
  }

  /// Menyembunyikan satu item spesifik berdasarkan ID.
  static Future<void> hideItem(String scope, String id) async {
    try {
      final p = await ensureInitialized();
      final key = '$_prefixHiddenIds$scope';
      final list = p.getStringList(key) ?? [];
      if (!list.contains(id)) {
        list.add(id);
        await p.setStringList(key, list);
        await _storage.write(key: 'backup_$key', value: list.join(','));
      }
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error hiding item: $e');
    }
  }

  /// Memeriksa apakah satu item riwayat layak ditampilkan di UI (Synchronous dari cache in-memory).
  static bool isVisibleSync({
    required String scope,
    required String id,
    DateTime? createdAt,
  }) {
    if (_prefs == null) return true;

    // 1. Cek apakah ID ada di daftar tersembunyi
    final hiddenIds = _prefs!.getStringList('$_prefixHiddenIds$scope');
    if (hiddenIds != null && hiddenIds.contains(id)) return false;

    // 2. Cek apakah item dibuat sebelum timestamp pembersihan
    final clearTime = _prefs!.getInt('$_prefixClearTime$scope');
    if (clearTime != null && createdAt != null) {
      if (createdAt.millisecondsSinceEpoch <= clearTime) {
        return false;
      }
    }

    return true;
  }

  /// Memeriksa apakah scope saat ini memiliki riwayat yang sedang disembunyikan.
  static bool hasHiddenItemsSync(String scope) {
    if (_prefs == null) return false;
    final clearTime = _prefs!.getInt('$_prefixClearTime$scope');
    if (clearTime != null && clearTime > 0) return true;
    final hiddenIds = _prefs!.getStringList('$_prefixHiddenIds$scope');
    return hiddenIds != null && hiddenIds.isNotEmpty;
  }
}

/// Widget tombol aksi menu di AppBar untuk membersihkan atau memulihkan riwayat tampilan.
class HiddenHistoryActionMenu extends ConsumerWidget {
  final String scope;
  final Color? iconColor;
  final List<String> Function()? getItemIds;

  const HiddenHistoryActionMenu({
    super.key,
    required this.scope,
    this.iconColor,
    this.getItemIds,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch versi agar icon/menu ikut bereaksi jika ada perubahan status
    ref.watch(hiddenHistoryVersionProvider);
    final hasHidden = HiddenHistoryService.hasHiddenItemsSync(scope);

    return PopupMenuButton<String>(
      icon: Icon(
        Icons.more_vert_rounded,
        color: iconColor ?? AppColors.textPrimary,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tooltip: 'Pilihan Riwayat',
      onSelected: (value) async {
        if (value == 'clear') {
          _confirmClear(context, ref);
        } else if (value == 'restore') {
          await HiddenHistoryService.restoreDisplay(scope);
          ref.read(hiddenHistoryVersionProvider.notifier).state++;
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Tampilan riwayat berhasil dipulihkan'),
                backgroundColor: AppColors.primaryGreen,
                duration: Duration(seconds: 2),
              ),
            );
          }
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem<String>(
          value: 'clear',
          child: Row(
            children: [
              Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed, size: 20),
              SizedBox(width: 10),
              Text(
                'Bersihkan Riwayat',
                style: TextStyle(
                  color: AppColors.dangerRed,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        if (hasHidden)
          const PopupMenuItem<String>(
            value: 'restore',
            child: Row(
              children: [
                Icon(Icons.restore_rounded, color: AppColors.primaryGreen, size: 20),
                SizedBox(width: 10),
                Text(
                  'Pulihkan Tampilan',
                  style: TextStyle(
                    color: AppColors.primaryGreen,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  void _confirmClear(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.cleaning_services_rounded, color: AppColors.dangerRed, size: 24),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Bersihkan Tampilan?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: const Text(
          'Daftar riwayat ini akan dibersihkan dari layar HP Anda. Catatan transaksi dan saldo resmi di server tetap aman dan tidak terhapus.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              final currentIds = getItemIds?.call();
              await HiddenHistoryService.clearDisplay(
                scope,
                currentItemIds: currentIds,
              );
              ref.read(hiddenHistoryVersionProvider.notifier).state++;
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Tampilan riwayat berhasil dibersihkan'),
                    backgroundColor: AppColors.primaryGreen,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
            child: const Text('Bersihkan'),
          ),
        ],
      ),
    );
  }
}
