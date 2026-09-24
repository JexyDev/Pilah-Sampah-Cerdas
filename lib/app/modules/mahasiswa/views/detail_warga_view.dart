import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../routes/app_routes.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../controllers/detail_warga_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../controllers/aktivasi_warga_controller.dart';
import '../../auth/controllers/auth_controller.dart' show authProvider;

class DetailWargaView extends ConsumerStatefulWidget {
  const DetailWargaView({super.key});

  @override
  ConsumerState<DetailWargaView> createState() => _DetailWargaViewState();
}

class _DetailWargaViewState extends ConsumerState<DetailWargaView> {
  bool _initialized = false;
  WargaDampingan? _localWarga;
  int _logStatusFilterIndex = 0; // 0: Semua, 1: Sesuai, 2: Tidak Sesuai

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final rawArgs = ModalRoute.of(context)?.settings.arguments;
    WargaDampingan? targetWarga;

    if (rawArgs is WargaDampingan) {
      targetWarga = rawArgs;
    } else if (rawArgs is Map<String, dynamic>) {
      try {
        final wargaMap = rawArgs['warga'] as Map<String, dynamic>? ?? rawArgs;
        targetWarga = WargaDampingan.fromJson(wargaMap);
      } catch (_) {}
    } else if (rawArgs is String && rawArgs.isNotEmpty) {
      final all = ref.read(mahasiswaControllerProvider).wargaList;
      targetWarga = all.where((w) => w.wargaId == rawArgs).firstOrNull;
      if (targetWarga == null) {
        final aktivasiList = ref.read(aktivasiWargaProvider).wargaList;
        for (final item in aktivasiList) {
          final w = item is WargaDampingan
              ? item
              : WargaDampingan.fromJson(item as Map<String, dynamic>);
          if (w.wargaId == rawArgs || w.binId == rawArgs) {
            targetWarga = w;
            break;
          }
        }
      }
    }

    if (targetWarga != null &&
        (!_initialized || targetWarga.wargaId != _localWarga?.wargaId)) {
      _localWarga = targetWarga;
      Future.microtask(() {
        if (!mounted) return;
        ref
            .read(detailWargaControllerProvider.notifier)
            .setWarga(targetWarga!);
        ref.read(mahasiswaControllerProvider.notifier).refresh();
      });
    }
    if (ref.read(kelompokKknProvider).kelompok == null) {
      Future.microtask(() {
        if (mounted) {
          ref.read(kelompokKknProvider.notifier).fetchKelompok();
        }
      });
    }
    _initialized = true;
  }

  @override
  void dispose() {
    _localWarga = null;
    super.dispose();
  }

  Future<void> _handleClaimWarga(
    BuildContext context,
    WidgetRef ref,
    WargaDampingan warga,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Konfirmasi Klaim Warga',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text('Klaim ${warga.wargaName} sebagai warga dampingan Anda?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Klaim', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.claimWargaMandiri(warga.wargaId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Berhasil mengklaim warga dampingan!'),
            backgroundColor: AppColors.success,
          ),
        );
        // Refresh data warga di list & detail
        ref.read(mahasiswaControllerProvider.notifier).refresh();
        Navigator.pop(context);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(detailWargaControllerProvider);
    // ponytail: Prioritaskan state.warga HANYA jika ID-nya cocok dengan _localWarga (bukan data basi)
    final warga = (state.warga != null &&
            (_localWarga == null || state.warga!.wargaId == _localWarga!.wargaId))
        ? state.warga!
        : _localWarga;
    final kelompokState = ref.watch(kelompokKknProvider);
    final authState = ref.watch(authProvider);
    final currentUser = authState.user;
    final isKetua = (currentUser?.isKetua == true) ||
        (kelompokState.kelompok?.members.any(
              (m) =>
                  ((m.userId.isNotEmpty && m.userId == currentUser?.id) ||
                      (currentUser?.nim.isNotEmpty == true &&
                          m.nim == currentUser?.nim) ||
                      (currentUser?.name.isNotEmpty == true &&
                          m.name.trim().toLowerCase() ==
                              currentUser?.name.trim().toLowerCase())) &&
                  m.isLeader,
            ) ==
            true);

    // Auto-sync listener saat background refresh atau data warga diperbarui
    ref.listen<MahasiswaState>(mahasiswaControllerProvider, (prev, next) {
      final targetId = _localWarga?.wargaId ?? state.warga?.wargaId;
      if (targetId != null && targetId.isNotEmpty) {
        final updated =
            next.wargaList.where((w) => w.wargaId == targetId).firstOrNull;
        if (updated != null) {
          ref.read(detailWargaControllerProvider.notifier).setWarga(updated);
        }
      }
    });

    if (warga == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
          title: const Text('Detail Warga'),
        ),
        body: const Center(
          child: Text(
            'Data warga tidak tersedia.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        title: const Text(
          'Detail Warga',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // ── Fixed Profile Header ────────────────────────
          _buildWargaHeader(warga, kelompokState, isKetua),

          // ── Content ────────────────────────────────────
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primaryGreen,
              onRefresh: () async {
                await ref.read(mahasiswaControllerProvider.notifier).refresh();
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppDimensions.md),
                children: [
                  // Status badge
                  if (warga.needsReeducation)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: AppDimensions.md),
                      decoration: BoxDecoration(
                        color: AppColors.warningOrange.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(
                          AppDimensions.radiusMd,
                        ),
                        border: Border.all(
                          color: AppColors.warningOrange.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: AppColors.warningOrange,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Warga ini membutuhkan edukasi ulang. Tingkat kesalahan: ${warga.errorPercentage.toStringAsFixed(1)}%',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.warningOrange,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // ── Card Pendamping KKN (ECO/BERSEKA-MOBILE/2026-09/002) ──
                  _buildPendampingDetailCard(warga, isKetua, kelompokState),
                  const SizedBox(height: AppDimensions.md),

                  // Stat Cards
                  _buildStatCards(warga, state),
                  const SizedBox(height: AppDimensions.md),

                  // Chart Section
                  _buildChartSection(warga),
                  const SizedBox(height: AppDimensions.md),

                  // Riwayat Pemilahan Terakhir
                  _buildRecentLogsSection(
                    warga.recentLogs,
                    warga.totalActivities,
                  ),
                  const SizedBox(height: AppDimensions.lg),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Header Warga
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildWargaHeader(
    WargaDampingan warga,
    KelompokKknState kelompokState,
    bool isKetua,
  ) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar besar
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                warga.wargaName.isNotEmpty
                    ? warga.wargaName[0].toUpperCase()
                    : '?',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  warga.wargaName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        _formatWargaAddress(warga),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (warga.phone.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.phone_outlined,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        warga.phone,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(
                      Icons.delete_outline_rounded,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Builder(
                        builder: (_) {
                          final org = warga.binOrganikId;
                          final anorg = warga.binAnorganikId;
                          final hasOrg = org != null && org.trim().isNotEmpty;
                          final hasAnorg =
                              anorg != null && anorg.trim().isNotEmpty;
                          const defaultStyle = TextStyle(
                            fontSize: 12,
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          );

                          if (hasOrg && hasAnorg && org != anorg) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Organik: $org',
                                  style: defaultStyle,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Anorganik: $anorg',
                                  style: defaultStyle,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            );
                          }
                          if (hasOrg) {
                            return Text(
                              'Organik: $org',
                              style: defaultStyle,
                              overflow: TextOverflow.ellipsis,
                            );
                          }
                          if (hasAnorg) {
                            return Text(
                              'Anorganik: $anorg',
                              style: defaultStyle,
                              overflow: TextOverflow.ellipsis,
                            );
                          }
                          if (warga.binId.isEmpty ||
                              warga.binId == 'Belum Ada Tempat Sampah') {
                            return const Text(
                              'Belum Ada Tempat Sampah',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            );
                          }
                          return Text(
                            'ID: ${warga.binId}',
                            style: defaultStyle,
                            overflow: TextOverflow.ellipsis,
                          );
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (warga.isActivated) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.verified_rounded,
                              size: 12,
                              color: AppColors.primaryGreen,
                            ),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Builder(
                                builder: (_) {
                                  String mName = warga.pendampingName;
                                  if (mName.isEmpty &&
                                      warga.mahasiswaId.isNotEmpty) {
                                    final mem = kelompokState.kelompok?.members
                                        .where(
                                          (m) => m.userId == warga.mahasiswaId,
                                        )
                                        .firstOrNull;
                                    if (mem != null) {
                                      mName = mem.name;
                                    }
                                  }
                                  return Text(
                                    mName.isNotEmpty
                                        ? 'Diaktivasi oleh: $mName'
                                        : 'Aktivasi Mandiri',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primaryGreen,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      InkWell(
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            AppRoutes.aktivasiWarga,
                            arguments: {
                              'warga': {
                                'id': warga.wargaId,
                                'name': warga.wargaName,
                                'rw': warga.rw,
                                'kelurahan': warga.kelurahan,
                                'address': warga.address,
                              },
                            },
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.qr_code_scanner, size: 12, color: AppColors.primaryBlue),
                              SizedBox(width: 4),
                              Text(
                                'Aktivasi Tempat Sampah',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (warga.pendampingName.isEmpty &&
                        warga.mahasiswaId.isEmpty) ...[
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => _handleClaimWarga(context, ref, warga),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppColors.primaryBlue.withValues(alpha: 0.35),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.person_add_alt_1_rounded,
                                size: 12,
                                color: AppColors.primaryBlueDark,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Klaim Warga',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlueDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                // ── Status Pendamping KKN & Alihkan Action (ECO/BERSEKA-MOBILE/2026-09/002) ───────────
                Builder(
                  builder: (_) {
                    final pendamping = warga.pendampingKkn?.name.isNotEmpty == true
                        ? warga.pendampingKkn!.name
                        : warga.pendampingName;
                    final hasPendamping = pendamping.trim().isNotEmpty &&
                        pendamping.trim().toLowerCase() != 'null';

                    return Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: hasPendamping
                                ? const Color(0xFFEBF5FF)
                                : AppColors.warningOrange.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: hasPendamping
                                  ? const Color(0xFF90CDF4)
                                  : AppColors.warningOrange.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                hasPendamping
                                    ? Icons.verified_user_rounded
                                    : Icons.person_outline_rounded,
                                size: 12,
                                color: hasPendamping
                                    ? AppColors.primaryBlueDark
                                    : AppColors.warningOrange,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                hasPendamping
                                    ? 'Pendamping: $pendamping'
                                    : 'Belum Ada Pendamping (Mandiri)',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: hasPendamping
                                      ? AppColors.primaryBlueDark
                                      : AppColors.warningOrange,
                                ),
                              ),
                            ],
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            if (!isKetua) {
                              final authUser = ref.read(authProvider).user;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Akses Terbatas: Hanya Ketua Kelompok KKN yang berwenang mengalihkan mahasiswa pendamping (Akun Anda: ${authUser?.name ?? "Anggota"}).',
                                  ),
                                  backgroundColor: AppColors.warningOrange,
                                ),
                              );
                              return;
                            }
                            _showReassignBottomSheet(
                              context,
                              ref,
                              warga,
                              kelompokState,
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isKetua
                                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                  : Colors.grey.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isKetua
                                    ? AppColors.primaryGreen.withValues(alpha: 0.4)
                                    : Colors.grey.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  isKetua ? Icons.swap_horiz_rounded : Icons.lock_outline,
                                  size: 13,
                                  color: isKetua ? AppColors.primaryGreen : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  'Alihkan',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isKetua ? AppColors.primaryGreen : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Card Detail Pendamping KKN (ECO/BERSEKA-MOBILE/2026-09/002)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildPendampingDetailCard(
    WargaDampingan warga,
    bool isKetua,
    KelompokKknState kelompokState,
  ) {
    final pendamping = warga.pendampingKkn;
    final hasPendampingObj = pendamping != null && pendamping.name.isNotEmpty;
    final fallbackName = warga.pendampingName;
    final hasFallback = fallbackName.trim().isNotEmpty &&
        fallbackName.trim().toLowerCase() != 'null';
    final hasAnyPendamping = hasPendampingObj || hasFallback;

    final displayName =
        hasPendampingObj ? pendamping.name : (hasFallback ? fallbackName : null);
    final nim = pendamping?.nim;
    final jurusan = pendamping?.jurusan;
    final phone = pendamping?.phone;
    final kelompok = pendamping?.kelompokName;

    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(
          color: hasAnyPendamping
              ? const Color(0xFF90CDF4).withValues(alpha: 0.5)
              : AppColors.warningOrange.withValues(alpha: 0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (hasAnyPendamping
                          ? AppColors.primaryBlue
                          : AppColors.warningOrange)
                      .withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  hasAnyPendamping
                      ? Icons.badge_outlined
                      : Icons.person_off_outlined,
                  size: 20,
                  color: hasAnyPendamping
                      ? AppColors.primaryBlueDark
                      : AppColors.warningOrange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mahasiswa Pendamping KKN',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasAnyPendamping
                          ? 'Penanggung jawab pembinaan & pendampingan warga'
                          : 'Belum ada mahasiswa pendamping (Status Mandiri)',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.divider),
          const SizedBox(height: 12),
          if (hasAnyPendamping) ...[
            _buildInfoRow(Icons.person_rounded, 'Nama', displayName ?? '-'),
            if (nim != null && nim.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(Icons.pin_outlined, 'NIM', nim),
            ],
            if (jurusan != null && jurusan.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(Icons.school_outlined, 'Jurusan', jurusan),
            ],
            if (phone != null && phone.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(Icons.phone_outlined, 'Kontak', phone),
            ],
            if (kelompok != null && kelompok.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(Icons.group_outlined, 'Kelompok', kelompok),
            ],
          ] else ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.warningOrange.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: AppColors.warningOrange,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Warga ini belum terikat dengan mahasiswa pendamping manapun dalam kelompok KKN.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.warningOrange,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                if (!isKetua) {
                  final authUser = ref.read(authProvider).user;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Akses Terbatas: Hanya Ketua Kelompok KKN yang berwenang mengalihkan mahasiswa pendamping (Akun Anda: ${authUser?.name ?? "Anggota"}).',
                      ),
                      backgroundColor: AppColors.warningOrange,
                    ),
                  );
                  return;
                }
                _showReassignBottomSheet(
                  context,
                  ref,
                  warga,
                  kelompokState,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    isKetua ? AppColors.primaryGreen : Colors.grey.shade400,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 10),
                elevation: 0,
              ),
              icon: Icon(
                isKetua ? Icons.swap_horiz_rounded : Icons.lock_outline,
                size: 18,
              ),
              label: Text(
                isKetua
                    ? 'Alihkan Mahasiswa Pendamping'
                    : 'Alihkan Mahasiswa Pendamping (Khusus Ketua)',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              isKetua
                  ? 'Aksi khusus Ketua Kelompok KKN (Reassign Pendamping)'
                  : 'Hanya Ketua Kelompok yang dapat mengalihkan pendamping warga.',
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _showReassignBottomSheet(
    BuildContext context,
    WidgetRef ref,
    WargaDampingan warga,
    KelompokKknState kelompokState,
  ) async {
    // Pastikan data kelompok tersedia
    if (kelompokState.kelompok == null) {
      await ref.read(kelompokKknProvider.notifier).fetchKelompok();
    }
    final latestKelompokState = ref.read(kelompokKknProvider);
    final members = latestKelompokState.kelompok?.members ?? [];
    final currentStudentId = warga.pendampingKkn?.id ?? warga.mahasiswaId;

    if (!context.mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        String? selectedTargetId;
        String? selectedTargetName;
        final reasonCtrl = TextEditingController();
        bool isSubmitting = false;
        String? errorText;

        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.swap_horiz_rounded,
                              color: AppColors.primaryGreen,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Alihkan Pendamping Warga',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Otoritas Khusus Ketua Kelompok KKN',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.primaryGreen,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCanvas,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              warga.wargaName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatWargaAddress(warga),
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Text(
                                  'Pendamping Saat Ini: ',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    (warga.pendampingKkn?.name.isNotEmpty == true)
                                        ? warga.pendampingKkn!.name
                                        : (warga.pendampingName.isNotEmpty
                                            ? warga.pendampingName
                                            : 'Belum Ada (Mandiri)'),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Pilih Mahasiswa Pendamping Baru *',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (members.isEmpty)
                        const Text(
                          'Tidak ada anggota kelompok yang ditemukan.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.dangerRed,
                          ),
                        )
                      else
                        DropdownButtonFormField<String>(
                          initialValue: selectedTargetId,
                          isExpanded: true,
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            hintText: '-- Pilih Rekan Mahasiswa --',
                            hintStyle: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textHint,
                            ),
                          ),
                          items: members.map((m) {
                            final isCurrent = (m.userId == currentStudentId);
                            final label =
                                '${m.name}${m.isLeader ? ' (Ketua)' : ''}${isCurrent ? ' (Saat Ini)' : ''}';
                            return DropdownMenuItem<String>(
                              value: m.userId,
                              enabled: !isCurrent,
                              child: Text(
                                label,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isCurrent
                                      ? AppColors.textHint
                                      : AppColors.textPrimary,
                                  fontWeight: isCurrent
                                      ? FontWeight.normal
                                      : FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: isSubmitting
                              ? null
                              : (val) {
                                  setModalState(() {
                                    selectedTargetId = val;
                                    final m = members
                                        .where((x) => x.userId == val)
                                        .firstOrNull;
                                    selectedTargetName = m?.name;
                                    errorText = null;
                                  });
                                },
                        ),
                      const SizedBox(height: 14),
                      const Text(
                        'Alasan Pengalihan (Opsional)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: reasonCtrl,
                        maxLines: 2,
                        enabled: !isSubmitting,
                        decoration: InputDecoration(
                          hintText:
                              'Misal: Pembagian beban wilayah, perputaran binaan',
                          hintStyle: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textHint,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide:
                                const BorderSide(color: AppColors.border),
                          ),
                        ),
                      ),
                      if (errorText != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          errorText!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.dangerRed,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: isSubmitting
                                  ? null
                                  : () => Navigator.pop(sheetContext),
                              style: OutlinedButton.styleFrom(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text('Batal'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: isSubmitting
                                  ? null
                                  : () async {
                                      if (selectedTargetId == null ||
                                          selectedTargetId!.isEmpty) {
                                        setModalState(() {
                                          errorText =
                                              'Silakan pilih mahasiswa tujuan pengalihan.';
                                        });
                                        return;
                                      }
                                      setModalState(() {
                                        isSubmitting = true;
                                        errorText = null;
                                      });
                                      try {
                                        final repo =
                                            ref.read(kknRepositoryProvider);
                                        final success =
                                            await repo.reassignWargaPendamping(
                                          warga.wargaId,
                                          targetStudentId: selectedTargetId!,
                                          reason:
                                              reasonCtrl.text.trim().isNotEmpty
                                                  ? reasonCtrl.text.trim()
                                                  : null,
                                        );
                                        if (success) {
                                          if (sheetContext.mounted) {
                                            Navigator.pop(sheetContext);
                                          }
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'Warga berhasil dialihkan ke ${selectedTargetName ?? 'mahasiswa target'}',
                                                ),
                                                backgroundColor:
                                                    AppColors.success,
                                              ),
                                            );
                                            // Refresh data
                                            await ref
                                                .read(mahasiswaControllerProvider
                                                    .notifier)
                                                .refresh();
                                            final updatedList = ref
                                                .read(mahasiswaControllerProvider)
                                                .wargaList;
                                            final updated = updatedList
                                                .where((w) =>
                                                    w.wargaId == warga.wargaId)
                                                .firstOrNull;
                                            if (updated != null && mounted) {
                                              setState(() {
                                                _localWarga = updated;
                                              });
                                              ref
                                                  .read(
                                                    detailWargaControllerProvider
                                                        .notifier,
                                                  )
                                                  .setWarga(updated);
                                            }
                                          }
                                        }
                                      } catch (err) {
                                        setModalState(() {
                                          isSubmitting = false;
                                          errorText = err
                                              .toString()
                                              .replaceAll('Exception: ', '');
                                        });
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryGreen,
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: isSubmitting
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'Konfirmasi Alihkan',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Stat Cards
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStatCards(WargaDampingan warga, DetailWargaState state) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Total Aktivitas',
                  value: '${warga.totalActivities}',
                  color: AppColors.primaryGreen,
                  icon: Icons.analytics_outlined,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.divider),
              Expanded(
                child: _StatItem(
                  label: 'Total Berat',
                  value: '${state.totalWeightKg.toStringAsFixed(1)} kg',
                  color: AppColors.primaryBlueDark,
                  icon: Icons.scale_outlined,
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: AppColors.divider),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Benar',
                  value:
                      '${warga.correctCount} (${warga.correctPercentage.toStringAsFixed(0)}%)',
                  color: AppColors.success,
                  icon: Icons.check_circle_outline_rounded,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.divider),
              Expanded(
                child: _StatItem(
                  label: 'Salah',
                  value:
                      '${warga.incorrectCount} (${warga.errorPercentage.toStringAsFixed(0)}%)',
                  color: AppColors.dangerRed,
                  icon: Icons.cancel_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Chart Section (Horizontal Bar)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildChartSection(WargaDampingan warga) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Distribusi Pemilahan',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),

          // Bar — Benar
          _HorizontalBar(
            label: 'Pemilahan Benar',
            percentage: warga.correctPercentage,
            color: AppColors.success,
          ),
          const SizedBox(height: 12),

          // Bar — Salah
          _HorizontalBar(
            label: 'Pemilahan Salah',
            percentage: warga.errorPercentage,
            color: AppColors.dangerRed,
          ),
        ],
      ),
    );
  }

  String _formatWargaAddress(WargaDampingan warga) {
    final raw = warga.address.trim();
    final hasAddr = raw.isNotEmpty &&
        raw != '-' &&
        raw != 'Alamat tidak diketahui' &&
        raw != 'Alamat belum diisi';
    final rwClean = warga.rw
        .replaceAll(RegExp(r'^RW\s*', caseSensitive: false), '')
        .trim();
    final rwStr = rwClean.isNotEmpty ? 'RW $rwClean' : '';
    final kelStr = warga.kelurahan.isNotEmpty ? 'Kel. ${warga.kelurahan}' : '';
    final wilayah = [rwStr, kelStr].where((s) => s.isNotEmpty).join(', ');

    if (hasAddr) {
      if (wilayah.isNotEmpty && !raw.toUpperCase().contains('RW')) {
        return '$raw ($wilayah)';
      }
      return raw;
    }
    return wilayah.isNotEmpty ? wilayah : 'Alamat belum diatur';
  }

  Widget _buildRecentLogsSection(
    List<WasteLogEntry> logs,
    int totalActivities,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Aktivitas Pemilahan Terbaru',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      totalActivities > logs.length
                          ? '${logs.length} setoran paling baru dari total $totalActivities aktivitas'
                          : 'Riwayat pemilahan sampah warga',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (logs.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusSm,
                    ),
                    border: Border.all(
                      color: AppColors.primaryGreen.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Text(
                    totalActivities > logs.length
                        ? '${logs.length} Terbaru'
                        : '${logs.length} Setoran',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ),
            ],
          ),
          if (logs.isNotEmpty) ...[
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip(
                    'Semua (${logs.length})',
                    _logStatusFilterIndex == 0,
                    () => setState(() => _logStatusFilterIndex = 0),
                  ),
                  const SizedBox(width: 8),
                  _buildFilterChip(
                    'Sesuai (${logs.where((l) => l.isCorrect).length})',
                    _logStatusFilterIndex == 1,
                    () => setState(() => _logStatusFilterIndex = 1),
                  ),
                  const SizedBox(width: 8),
                  _buildFilterChip(
                    'Tidak Sesuai (${logs.where((l) => !l.isCorrect).length})',
                    _logStatusFilterIndex == 2,
                    () => setState(() => _logStatusFilterIndex = 2),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (logs.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Center(
                child: Text(
                  'Belum ada riwayat aktivitas pemilahan.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            )
          else ...[
            ...() {
              final filteredLogs = logs.where((l) {
                if (_logStatusFilterIndex == 1 && !l.isCorrect) return false;
                if (_logStatusFilterIndex == 2 && l.isCorrect) return false;
                return true;
              }).toList();

              if (filteredLogs.isEmpty) {
                return [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14.0),
                    child: Center(
                      child: Text(
                        _logStatusFilterIndex == 1
                            ? 'Tidak ada setoran sesuai pada riwayat terbaru.'
                            : 'Tidak ada setoran tidak sesuai pada riwayat terbaru.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ];
              }
              return filteredLogs.map((log) => _buildLogItem(log)).toList();
            }(),
          ],
          if (totalActivities > logs.length) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
                border: Border.all(
                  color: AppColors.primaryGreen.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.sync_rounded,
                    size: 16,
                    color: AppColors.primaryGreen,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Daftar ini memuat ${logs.length} setoran paling baru. Setiap kali warga menyetor sampah, riwayat terlama otomatis digantikan oleh setoran terbaru.',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.successDark,
                        fontWeight: FontWeight.w500,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.border,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primaryGreen.withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildLogItem(WasteLogEntry log) {
    final isOrg = log.category.toLowerCase().contains('organik') &&
        !log.category.toLowerCase().contains('anorganik') &&
        !log.category.toLowerCase().contains('non');
    final catColor = isOrg ? AppColors.primaryGreen : AppColors.primaryBlueDark;
    final isCorrect = log.isCorrect;
    final dateStr =
        '${log.createdAt.day.toString().padLeft(2, '0')}/${log.createdAt.month.toString().padLeft(2, '0')}/${log.createdAt.year} ${log.createdAt.hour.toString().padLeft(2, '0')}:${log.createdAt.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundCanvas,
        borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: catColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              log.category,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: catColor,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${log.weightKg.toStringAsFixed(2)} kg',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  dateStr,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: isCorrect
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isCorrect
                      ? Icons.check_circle_outline_rounded
                      : Icons.error_outline_rounded,
                  size: 12,
                  color: isCorrect ? AppColors.success : AppColors.dangerRed,
                ),
                const SizedBox(width: 4),
                Text(
                  isCorrect ? 'Sesuai' : 'Tidak Sesuai',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isCorrect ? AppColors.success : AppColors.dangerRed,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Subwidgets
// ═══════════════════════════════════════════════════════════════════════════════

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _HorizontalBar extends StatelessWidget {
  const _HorizontalBar({
    required this.label,
    required this.percentage,
    required this.color,
  });

  final String label;
  final double percentage;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            Text(
              '${percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 8,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
