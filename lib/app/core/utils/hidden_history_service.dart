import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../values/app_colors.dart';
import '../values/api_constants.dart';
import '../../data/providers/api_client.dart';
import '../../data/providers/repository_providers.dart' show apiClientProvider;
import 'safe_storage.dart';

/// Provider reaktif untuk memicu rebuild UI ketika status penyembunyian riwayat berubah.
final hiddenHistoryVersionProvider = StateProvider<int>((ref) => 0);

/// Service untuk mengelola pembersihan riwayat tampilan (Hybrid: Client-side Hide + Server Cutoff).
///
/// Menyembunyikan riwayat seketika dari layar HP (0 ms respons) dan melakukan server-side cutoff
/// ke backend VPS agar request riwayat berikutnya menghasilkan 0 KB payload.
/// Saldo total poin dan seluruh catatan audit hukum di backend tetap aman 100%.
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

  // Active user ID for strict multi-user isolation
  static String? _activeUserId;

  // Fast in-memory cache for 60fps zero-allocation scroll performance
  static final Map<String, int?> _memClearTimes = {};
  static final Map<String, Set<String>> _memHiddenIds = {};

  static String _scopedKey(String prefix, String scope, [String? userId]) {
    final uid = userId ?? _activeUserId;
    if (uid != null && uid.isNotEmpty) {
      return '$prefix${uid}_$scope';
    }
    return '$prefix$scope';
  }

  /// Set user ID yang sedang aktif untuk mengisolasi riwayat per akun secara ketat.
  static void setActiveUser(String? userId) {
    if (_activeUserId != userId) {
      _activeUserId = userId;
      _memClearTimes.clear();
      _memHiddenIds.clear();
      if (_prefs != null && userId != null && userId.isNotEmpty) {
        _loadUserCache(userId);
      }
    }
  }

  static void _loadUserCache(String userId) {
    const scopes = [
      scopeWargaWaste,
      scopeWargaPoints,
      scopeMahasiswaKkn,
      scopeMahasiswaPoints,
      scopePetugasTasks,
      scopePetugasPoints,
    ];
    for (final s in scopes) {
      final keyTime = _scopedKey(_prefixClearTime, s, userId);
      final keyIds = _scopedKey(_prefixHiddenIds, s, userId);
      _memClearTimes[s] = _prefs?.getInt(keyTime);
      final savedIds = _prefs?.getStringList(keyIds);
      _memHiddenIds[s] = savedIds != null ? Set<String>.from(savedIds) : <String>{};
    }
  }

  /// Memastikan instance SharedPreferences telah dimuat ke memori dan tersinkronisasi dari SafeStorage.
  static Future<SharedPreferences> ensureInitialized() async {
    _prefs = await SharedPreferences.getInstance();

    const scopes = [
      scopeWargaWaste,
      scopeWargaPoints,
      scopeMahasiswaKkn,
      scopeMahasiswaPoints,
      scopePetugasTasks,
      scopePetugasPoints,
    ];

    // Bersihkan legacy un-scoped keys yang bocor lintas akun pada versi lama
    for (final s in scopes) {
      final oldKeyTime = '$_prefixClearTime$s';
      final oldKeyIds = '$_prefixHiddenIds$s';
      if (_prefs!.containsKey(oldKeyTime)) await _prefs!.remove(oldKeyTime);
      if (_prefs!.containsKey(oldKeyIds)) await _prefs!.remove(oldKeyIds);
      await _storage.delete(key: 'backup_$oldKeyTime');
      await _storage.delete(key: 'backup_$oldKeyIds');
    }

    if (_activeUserId != null && _activeUserId!.isNotEmpty) {
      _loadUserCache(_activeUserId!);
    }

    return _prefs!;
  }

  /// Memetakan scope halaman riwayat ke endpoint cutoff backend VPS.
  static String? mapScopeToEndpoint(String scope) {
    switch (scope) {
      case scopeWargaPoints:
      case scopeMahasiswaPoints:
      case scopePetugasPoints:
        return ApiEndpoints.pointsClear;
      case scopeWargaWaste:
        return ApiEndpoints.transactionsDepositsClear;
      case scopeMahasiswaKkn:
        return ApiEndpoints.kknActivityLogClear;
      case scopePetugasTasks:
        return ApiEndpoints.petugasRiwayatClear;
      default:
        return null;
    }
  }

  /// Mengirimkan sinyal server-side cutoff ke backend VPS secara asinkron.
  static Future<void> syncServerClear(String scope, [ApiClient? client]) async {
    final endpoint = mapScopeToEndpoint(scope);
    if (endpoint == null || client == null) return;
    try {
      await client.dio.post(endpoint);
      debugPrint('[HiddenHistoryService] Server cutoff synced for scope: $scope via $endpoint');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Warning: Failed to sync server cutoff for $scope: $e');
    }
  }

  /// Memetakan scope halaman riwayat ke itemType pada tabel user_hidden_history_items backend.
  static String? mapScopeToItemType(String scope) {
    switch (scope) {
      case scopeWargaPoints:
      case scopeMahasiswaPoints:
      case scopePetugasPoints:
        return 'POINT';
      case scopeWargaWaste:
        return 'WASTE_DEPOSIT';
      case scopeMahasiswaKkn:
        return 'KKN_ACTIVITY';
      case scopePetugasTasks:
        return 'PETUGAS_TASK';
      default:
        return null;
    }
  }

  /// Mengirimkan sinyal server-side exclude satuan (1-1) ke backend VPS secara asinkron.
  static Future<void> syncServerHideItem(String scope, String itemId, [ApiClient? client]) async {
    final itemType = mapScopeToItemType(scope);
    if (itemType == null || client == null) return;
    try {
      await client.dio.delete(ApiEndpoints.historyExcludeItem(itemType, itemId));
      debugPrint('[HiddenHistoryService] Server exclude synced for $itemType:$itemId');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Warning: Failed to sync server exclude for $itemType:$itemId: $e');
    }
  }

  /// Mengirimkan sinyal server-side multi-exclude (batch) ke backend VPS secara asinkron.
  static Future<void> syncServerExcludeItems(String scope, List<String> itemIds, [ApiClient? client]) async {
    final itemType = mapScopeToItemType(scope);
    if (itemType == null || client == null || itemIds.isEmpty) return;
    try {
      await client.dio.post(
        ApiEndpoints.historyExclude,
        data: {
          'itemType': itemType,
          'itemIds': itemIds,
        },
      );
      debugPrint('[HiddenHistoryService] Server multi-exclude synced for $itemType: ${itemIds.length} items');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Warning: Failed to sync server multi-exclude for $itemType: $e');
    }
  }

  /// Menyembunyikan seluruh tampilan riwayat saat ini untuk scope tertentu.
  /// Menyimpan seluruh ID aktif dan timestamp toleran agar data lama tidak bocor kembali,
  /// serta mensinkronisasikan cutoff ke backend VPS jika ApiClient tersedia.
  /// Menyembunyikan seluruh tampilan riwayat saat ini untuk scope tertentu.
  /// Menyimpan seluruh ID aktif dan timestamp toleran agar data lama tidak bocor kembali,
  /// serta mensinkronisasikan cutoff ke backend VPS jika ApiClient tersedia.
  static Future<void> clearDisplay(
    String scope, {
    List<String>? currentItemIds,
    ApiClient? apiClient,
  }) async {
    try {
      final p = await ensureInitialized();
      final nowLocal = DateTime.now().millisecondsSinceEpoch;
      final nowUtc = DateTime.now().toUtc().millisecondsSinceEpoch;
      final safeNow = nowLocal > nowUtc ? nowLocal : nowUtc;
      final keyTime = _scopedKey(_prefixClearTime, scope);
      await p.setInt(keyTime, safeNow);
      await _storage.write(key: 'backup_$keyTime', value: '$safeNow');

      final keyIds = _scopedKey(_prefixHiddenIds, scope);
      final list = p.getStringList(keyIds) ?? [];
      if (currentItemIds != null && currentItemIds.isNotEmpty) {
        for (final id in currentItemIds) {
          if (id.isNotEmpty && !list.contains(id)) {
            list.add(id);
          }
        }
        await p.setStringList(keyIds, list);
        await _storage.write(key: 'backup_$keyIds', value: list.join(','));
      }

      // Update memory cache seketika (O(1))
      _memClearTimes[scope] = safeNow;
      _memHiddenIds[scope] = Set<String>.from(list);

      debugPrint(
        '[HiddenHistoryService] Display cleared for scope: $scope with ${currentItemIds?.length ?? 0} ids at $safeNow (key: $keyTime)',
      );

      // Sinkronisasikan server-side cutoff di background (non-blocking)
      if (apiClient != null) {
        unawaited(syncServerClear(scope, apiClient));
      }
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error clearing display: $e');
    }
  }

  /// Memulihkan seluruh tampilan riwayat yang sebelumnya disembunyikan.
  static Future<void> restoreDisplay(String scope) async {
    try {
      final p = await ensureInitialized();
      final keyTime = _scopedKey(_prefixClearTime, scope);
      final keyIds = _scopedKey(_prefixHiddenIds, scope);
      await p.remove(keyTime);
      await p.remove(keyIds);
      await _storage.delete(key: 'backup_$keyTime');
      await _storage.delete(key: 'backup_$keyIds');
      _memClearTimes.remove(scope);
      _memHiddenIds[scope] = <String>{};
      debugPrint('[HiddenHistoryService] Display restored for scope: $scope (key: $keyTime)');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error restoring display: $e');
    }
  }

  /// Menyembunyikan satu item spesifik berdasarkan ID (Swipe to Delete / Hapus 1-1).
  static Future<void> hideItem(String scope, String id, {ApiClient? apiClient}) async {
    try {
      final p = await ensureInitialized();
      final key = _scopedKey(_prefixHiddenIds, scope);
      final list = p.getStringList(key) ?? [];
      if (!list.contains(id)) {
        list.add(id);
        await p.setStringList(key, list);
        await _storage.write(key: 'backup_$key', value: list.join(','));
        _memHiddenIds[scope] ??= <String>{};
        _memHiddenIds[scope]!.add(id);
      }
      if (apiClient != null) {
        unawaited(syncServerHideItem(scope, id, apiClient));
      }
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error hiding item: $e');
    }
  }

  /// Menyembunyikan beberapa item spesifik berdasarkan kumpulan ID (Multi-Select).
  static Future<void> hideItems(
    String scope,
    List<String> ids, {
    ApiClient? apiClient,
  }) async {
    try {
      final p = await ensureInitialized();
      final key = _scopedKey(_prefixHiddenIds, scope);
      final list = p.getStringList(key) ?? [];
      final newIds = <String>[];
      for (final id in ids) {
        if (!list.contains(id)) {
          list.add(id);
          newIds.add(id);
        }
      }
      if (newIds.isNotEmpty) {
        await p.setStringList(key, list);
        await _storage.write(key: 'backup_$key', value: list.join(','));
        _memHiddenIds[scope] ??= <String>{};
        _memHiddenIds[scope]!.addAll(newIds);
      }
      if (apiClient != null && ids.isNotEmpty) {
        unawaited(syncServerExcludeItems(scope, ids, apiClient));
      }
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error hiding multiple items: $e');
    }
  }

  /// Memeriksa apakah satu item riwayat layak ditampilkan di UI (O(1) in-memory cache, zero allocation).
  static bool isVisibleSync({
    required String scope,
    required String id,
    DateTime? createdAt,
  }) {
    // 1. Cek apakah ID ada di set tersembunyi (O(1) instant lookup)
    final hiddenSet = _memHiddenIds[scope];
    if (hiddenSet != null && hiddenSet.contains(id)) return false;

    // 2. Cek apakah item dibuat sebelum timestamp pembersihan (O(1) integer comparison)
    final clearTime = _memClearTimes[scope] ?? _prefs?.getInt(_scopedKey(_prefixClearTime, scope));
    if (clearTime != null && createdAt != null) {
      if (createdAt.millisecondsSinceEpoch <= clearTime) {
        return false;
      }
    }

    return true;
  }

  /// Reset seluruh in-memory dan local cache riwayat tersembunyi saat logout atau pergantian sesi.
  static Future<void> resetSession() async {
    _memClearTimes.clear();
    _memHiddenIds.clear();
    _activeUserId = null;
    try {
      _prefs = await SharedPreferences.getInstance();
      final keys = _prefs!.getKeys().where((k) => k.startsWith(_prefixClearTime) || k.startsWith(_prefixHiddenIds)).toList();
      for (final k in keys) {
        await _prefs!.remove(k);
      }
      const storage = SafeStorage();
      final allStorage = await storage.readAll();
      for (final k in allStorage.keys) {
        if (k.startsWith('backup_$_prefixClearTime') || k.startsWith('backup_$_prefixHiddenIds')) {
          await storage.delete(key: k);
        }
      }
      debugPrint('[HiddenHistoryService] Session cache reset.');
    } catch (e) {
      debugPrint('[HiddenHistoryService] Error reset session: $e');
    }
  }

  /// Memeriksa apakah scope saat ini memiliki riwayat yang sedang disembunyikan.
  static bool hasHiddenItemsSync(String scope) {
    final clearTime = _memClearTimes[scope] ?? _prefs?.getInt(_scopedKey(_prefixClearTime, scope));
    if (clearTime != null && clearTime > 0) return true;
    final hiddenSet = _memHiddenIds[scope];
    return hiddenSet != null && hiddenSet.isNotEmpty;
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
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem<String>(
          value: 'clear',
          child: Row(
            children: [
              Icon(Icons.delete_sweep_rounded, color: AppColors.dangerRed, size: 20),
              SizedBox(width: 10),
              Text(
                'Hapus Riwayat',
                style: TextStyle(
                  color: AppColors.dangerRed,
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
            Icon(Icons.delete_sweep_rounded, color: AppColors.dangerRed, size: 24),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Hapus Riwayat?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: const Text(
          'Seluruh riwayat ini akan dihapus dari akun Anda agar aplikasi tetap ringan. Saldo poin Anda tetap aman 100%.',
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
              final client = ref.read(apiClientProvider);
              await HiddenHistoryService.clearDisplay(
                scope,
                currentItemIds: currentIds,
                apiClient: client,
              );
              ref.read(hiddenHistoryVersionProvider.notifier).state++;
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Riwayat berhasil dihapus'),
                    backgroundColor: AppColors.primaryGreen,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}

/// Widget wrapper untuk mendukung Swipe-to-Delete (Hapus 1-1 dinamis berbasis itemId).
class DismissibleHistoryItem extends ConsumerWidget {
  final String scope;
  final String itemId;
  final Widget child;
  final VoidCallback? onDismissed;
  final String confirmTitle;
  final String confirmMessage;

  const DismissibleHistoryItem({
    super.key,
    required this.scope,
    required this.itemId,
    required this.child,
    this.onDismissed,
    this.confirmTitle = 'Hapus Item Riwayat?',
    this.confirmMessage =
        'Item riwayat ini akan dihapus dari akun Anda agar aplikasi tetap ringan. Saldo poin Anda tetap aman 100%.',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (itemId.isEmpty) return child;

    return Dismissible(
      key: ValueKey('dismiss_${scope}_$itemId'),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.dangerRed,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
            SizedBox(width: 6),
            Text(
              'Hapus',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (dialogCtx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    confirmTitle,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            content: Text(
              confirmMessage,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx, false),
                child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.dangerRed,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => Navigator.pop(dialogCtx, true),
                child: const Text('Hapus'),
              ),
            ],
          ),
        ) ?? false;
      },
      onDismissed: (direction) async {
        final client = ref.read(apiClientProvider);
        await HiddenHistoryService.hideItem(scope, itemId, apiClient: client);
        ref.read(hiddenHistoryVersionProvider.notifier).state++;
        onDismissed?.call();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Item riwayat berhasil dihapus'),
              backgroundColor: AppColors.primaryGreen,
              duration: Duration(seconds: 2),
            ),
          );
        }
      },
      child: child,
    );
  }
}
