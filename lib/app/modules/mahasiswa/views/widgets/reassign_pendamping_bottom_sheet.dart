import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/values/app_colors.dart';
import '../../../../data/models/mahasiswa_kkn_models.dart';
import '../../../../data/providers/repository_providers.dart';
import '../../../auth/controllers/auth_controller.dart';
import '../../controllers/aktivasi_warga_controller.dart';
import '../../controllers/kelompok_kkn_controller.dart';
import '../../controllers/mahasiswa_controller.dart';

/// Bottom sheet dialog for reassigning companion student (Ketua KKN only).
class ReassignPendampingBottomSheet {
  /// Opens the bottom sheet modal.
  static Future<void> show({
    required BuildContext context,
    required WidgetRef ref,
    required WargaDampingan warga,
    required KelompokKknState kelompokState,
    Future<void> Function(WargaDampingan updatedWarga)? onSuccess,
  }) async {
    // Ensure group data is loaded
    if (kelompokState.kelompok == null) {
      await ref.read(kelompokKknProvider.notifier).fetchKelompok();
    }
    final latestKelompokState = ref.read(kelompokKknProvider);
    final members = latestKelompokState.kelompok?.members ?? [];

    if (!context.mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return _ReassignBottomSheetContent(
          sheetContext: sheetContext,
          parentContext: context,
          ref: ref,
          warga: warga,
          members: members,
          onSuccess: onSuccess,
        );
      },
    );
  }
}

class _ReassignBottomSheetContent extends StatefulWidget {
  const _ReassignBottomSheetContent({
    required this.sheetContext,
    required this.parentContext,
    required this.ref,
    required this.warga,
    required this.members,
    this.onSuccess,
  });

  final BuildContext sheetContext;
  final BuildContext parentContext;
  final WidgetRef ref;
  final WargaDampingan warga;
  final List<KelompokMemberData> members;
  final Future<void> Function(WargaDampingan updatedWarga)? onSuccess;

  @override
  State<_ReassignBottomSheetContent> createState() =>
      _ReassignBottomSheetContentState();
}

class _ReassignBottomSheetContentState
    extends State<_ReassignBottomSheetContent> {
  String? _selectedTargetId;
  String? _selectedTargetName;
  late final TextEditingController _reasonCtrl;
  bool _isSubmitting = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _reasonCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final warga = widget.warga;
    final members = widget.members;

    final rawCurrentStudentId = warga.pendampingKkn?.id.isNotEmpty == true
        ? warga.pendampingKkn!.id
        : warga.mahasiswaId;

    return Container(
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
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
                        '${warga.address.isNotEmpty ? warga.address : "-"}${warga.rw.isNotEmpty ? " • RW ${warga.rw}" : ""}',
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
                if (!warga.isActivated) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.warningOrange.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.warningOrange.withValues(alpha: 0.3),
                      ),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          size: 16,
                          color: AppColors.warningOrange,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Warga ini belum aktivasi tempat sampah. Pengalihan tetap dapat diproses, dan stiker QR tempat sampah dapat diaktivasi oleh pendamping baru.',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.textPrimary,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
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
                    key: ValueKey('target_student_$_selectedTargetId'),
                    initialValue: _selectedTargetId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      hintText: '-- Pilih Rekan Mahasiswa --',
                      hintStyle: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textHint,
                      ),
                    ),
                    items: members.map((m) {
                      // Check whether this member is the current companion across multiple identifiers
                      final isCurrent = (rawCurrentStudentId.isNotEmpty &&
                              (m.userId == rawCurrentStudentId ||
                                  m.nim == rawCurrentStudentId)) ||
                          (warga.pendampingName.isNotEmpty &&
                              m.name.trim().toLowerCase() ==
                                  warga.pendampingName.trim().toLowerCase()) ||
                          (warga.pendampingKkn != null &&
                              (m.userId == warga.pendampingKkn!.id ||
                                  (warga.pendampingKkn!.nim.isNotEmpty &&
                                      m.nim == warga.pendampingKkn!.nim) ||
                                  (warga.pendampingKkn!.name.isNotEmpty &&
                                      m.name.trim().toLowerCase() ==
                                          warga.pendampingKkn!.name.trim().toLowerCase())));

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
                    onChanged: _isSubmitting
                        ? null
                        : (val) {
                            setState(() {
                              _selectedTargetId = val;
                              final m = members
                                  .where((x) => x.userId == val)
                                  .firstOrNull;
                              _selectedTargetName = m?.name;
                              _errorText = null;
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
                  controller: _reasonCtrl,
                  maxLines: 2,
                  enabled: !_isSubmitting,
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
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                  ),
                ),
                if (_errorText != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _errorText!,
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
                        onPressed: _isSubmitting
                          ? null
                          : () => Navigator.pop(widget.sheetContext),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
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
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isSubmitting
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
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (_selectedTargetId == null || _selectedTargetId!.isEmpty) {
      setState(() {
        _errorText = 'Silakan pilih mahasiswa tujuan pengalihan.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });

    final ref = widget.ref;
    final warga = widget.warga;
    final parentCtx = widget.parentContext;
    final sheetCtx = widget.sheetContext;
    final selectedId = _selectedTargetId!;
    final selectedName = _selectedTargetName;
    final reasonText = _reasonCtrl.text.trim();

    try {
      final repo = ref.read(kknRepositoryProvider);
      final success = await repo.reassignWargaPendamping(
        warga.wargaId,
        targetStudentId: selectedId,
        reason: reasonText.isNotEmpty ? reasonText : null,
      );

      if (success) {
        if (sheetCtx.mounted) {
          Navigator.pop(sheetCtx);
        }
        if (parentCtx.mounted) {
          ScaffoldMessenger.of(parentCtx).showSnackBar(
            SnackBar(
              content: Text(
                'Warga berhasil dialihkan ke ${selectedName ?? 'mahasiswa target'}',
              ),
              backgroundColor: AppColors.success,
            ),
          );
        }

        // 1. Refresh mahasiswa controller
        await ref.read(mahasiswaControllerProvider.notifier).refresh();

        // 2. Refresh aktivasi warga provider to prevent stale data overwrite
        final authUser = ref.read(authProvider).user;
        final kelompok = ref.read(kelompokKknProvider).kelompok;
        String kel = authUser?.kelurahan ?? kelompok?.kelurahan ?? '';
        String rw = authUser?.rw ??
            (kelompok?.cakupanRw.isNotEmpty == true
                ? kelompok!.cakupanRw.join(', ')
                : '');
        await ref.read(aktivasiWargaProvider.notifier).fetchWargaWithRegion(
              kelurahan: kel,
              rw: rw,
              force: true,
            );

        // 3. Find updated warga instance and notify callback
        final updatedList = ref.read(mahasiswaControllerProvider).wargaList;
        final updated =
            updatedList.where((w) => w.wargaId == warga.wargaId).firstOrNull;

        final fallbackUpdated = updated ??
            warga.copyWith(
              mahasiswaId: selectedId,
              pendampingName: selectedName ?? '',
              pendampingKkn: PendampingKkn(
                id: selectedId,
                name: selectedName ?? '',
              ),
            );

        if (widget.onSuccess != null) {
          await widget.onSuccess!(fallbackUpdated);
        }
      }
    } catch (err) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorText = err.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }
}
