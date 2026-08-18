import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';

class KelompokKknView extends ConsumerWidget {
  const KelompokKknView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(kelompokKknProvider);
    final notifier = ref.read(kelompokKknProvider.notifier);
    final user = ref.watch(authProvider).user;

    final kel = user?.kelurahan.isNotEmpty == true ? user!.kelurahan : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';
    final kelDisplay = kel.toLowerCase().startsWith('kel') ? kel : 'Kel. $kel';

    final KelompokKknData kelompokData = state.kelompok ?? KelompokKknData(
      groupId: user?.id ?? '',
      groupName: kel != '-' ? 'Kelompok KKN $kel RW $rw' : 'Kelompok KKN',
      poskoLocation: kel != '-' ? 'Posko KKN RW $rw, $kelDisplay' : '-',
      dosenPembimbing: '-',
      totalGroupPoints: 0,
      members: user != null ? [
        KelompokMemberData(
          userId: user.id,
          nim: user.nim.isNotEmpty ? user.nim : '-',
          name: user.name.isNotEmpty ? user.name : '-',
          jurusan: user.prodi.isNotEmpty ? user.prodi : (user.jurusan.isNotEmpty ? user.jurusan : '-'),
          individualPoints: 0,
          isLeader: true,
        ),
      ] : [],
    );

    // Deduplicate members by name
    final uniqueMembers = <String, KelompokMemberData>{};
    for (final m in kelompokData.members) {
      final key = m.name.toLowerCase().trim();
      if (!uniqueMembers.containsKey(key) || m.isLeader) {
        uniqueMembers[key] = m;
      }
    }
    // Ensure ONLY ONE leader exists to fix the double KETUA badge bug (First found wins)
    bool hasFoundLeader = false;
    final membersToDisplay = <KelompokMemberData>[];
    
    for (final m in uniqueMembers.values) {
      if (m.isLeader && !hasFoundLeader) {
        membersToDisplay.add(m);
        hasFoundLeader = true;
      } else if (m.isLeader && hasFoundLeader) {
        // Strip the leader status from the secondary member
        membersToDisplay.add(m.copyWith(isLeader: false));
      } else {
        membersToDisplay.add(m);
      }
    }
    membersToDisplay.sort((a, b) {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return 0;
    });

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Kelompok KKN',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => notifier.fetchKelompok(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.fetchKelompok(),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (state.isLoading) ...[
                const SizedBox(height: 100),
                const Center(
                  child: CircularProgressIndicator(color: AppColors.primaryGreen),
                ),
              ] else ...[
                // Header Kelompok & Dosen Pendamping Lapangan (DPL)
                Card(
                  elevation: 3,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Container(
                    padding: const EdgeInsets.all(18.0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [AppColors.primaryGreen, AppColors.successDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.groups_rounded, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    kelompokData.groupName,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, color: Colors.white70, size: 14),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          kelompokData.poskoLocation,
                                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 14),
                          child: Divider(color: Colors.white24, height: 1),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Dosen Pendamping Lapangan (DPL):',
                                    style: TextStyle(fontSize: 11, color: Colors.white60),
                                  ),
                                  Text(
                                    kelompokData.dosenPembimbing,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                // Card Posko KKN Kelompok & Status Verifikasi
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Container(
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: kelompokData.poskoStatus == 'APPROVED'
                            ? AppColors.primaryGreen.withValues(alpha: 0.4)
                            : (kelompokData.poskoStatus == 'PENDING'
                                ? Colors.orange.withValues(alpha: 0.4)
                                : Colors.grey.withValues(alpha: 0.3)),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: kelompokData.poskoStatus == 'APPROVED'
                                        ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                        : (kelompokData.poskoStatus == 'PENDING'
                                            ? Colors.orange.withValues(alpha: 0.1)
                                            : Colors.grey.withValues(alpha: 0.1)),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.place_rounded,
                                    color: kelompokData.poskoStatus == 'APPROVED'
                                        ? AppColors.primaryGreen
                                        : (kelompokData.poskoStatus == 'PENDING' ? Colors.orange : Colors.grey),
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                const Text(
                                  'Titik Posko KKN',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: kelompokData.poskoStatus == 'APPROVED'
                                    ? AppColors.primaryGreen.withValues(alpha: 0.15)
                                    : (kelompokData.poskoStatus == 'PENDING'
                                        ? Colors.orange.withValues(alpha: 0.15)
                                        : Colors.grey.withValues(alpha: 0.15)),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                kelompokData.poskoStatus == 'APPROVED'
                                    ? 'TERVERIFIKASI AKTIF'
                                    : (kelompokData.poskoStatus == 'PENDING' ? 'MENUNGGU VERIFIKASI RW' : 'BELUM DIDAFTARKAN'),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: kelompokData.poskoStatus == 'APPROVED'
                                      ? AppColors.primaryGreen
                                      : (kelompokData.poskoStatus == 'PENDING' ? Colors.orange.shade800 : Colors.grey.shade700),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          kelompokData.poskoLocation,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Alamat: ${kelompokData.poskoAlamat}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.gps_fixed_rounded, size: 13, color: Colors.black45),
                            const SizedBox(width: 4),
                            Text(
                              'Koordinat: ${kelompokData.latitude.toStringAsFixed(6)}, ${kelompokData.longitude.toStringAsFixed(6)}',
                              style: const TextStyle(fontSize: 11, color: Colors.black54, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                        if (kelompokData.isUserLeader ||
                            (user != null && membersToDisplay.any((m) => m.isLeader && m.name.toLowerCase().trim() == user.name.toLowerCase().trim()))) ...[
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () => _showRegisterPoskoDialog(context, ref, kelompokData),
                              icon: const Icon(Icons.edit_location_alt_rounded, size: 18, color: Colors.white),
                              label: Text(
                                kelompokData.poskoStatus == 'UNREGISTERED'
                                    ? 'Daftarkan Lokasi Posko (GPS HP)'
                                    : 'Perbarui Lokasi Posko KKN',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryGreen,
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Card Total Poin Kelompok (Akumulasi)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGreen.withValues(alpha: 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.stars_rounded, color: AppColors.primaryGreen, size: 36),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Poin Akumulasi Kelompok',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${kelompokData.calculatedTotalPoints} Poin',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryGreen,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok',
                              style: const TextStyle(fontSize: 11, color: Colors.black45),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Subtitle Anggota
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Anggota Kelompok KKN',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${membersToDisplay.length} Orang',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // List Anggota Kelompok
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: membersToDisplay.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final member = membersToDisplay[index];
                    final isCurrentUser = user != null && (member.name.toLowerCase().trim() == user.name.toLowerCase().trim());
                    return Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: CircleAvatar(
                          backgroundColor: member.isLeader
                              ? AppColors.primaryGreen
                              : AppColors.primaryBlueDark.withValues(alpha: 0.1),
                          foregroundColor: member.isLeader ? Colors.white : AppColors.primaryBlueDark,
                          child: Text(
                            member.name.isNotEmpty ? member.name[0].toUpperCase() : 'M',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                member.name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ),
                            if (member.isLeader)
                              Container(
                                margin: const EdgeInsets.only(left: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryGreen.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'KETUA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ),
                            if (isCurrentUser)
                              Container(
                                margin: const EdgeInsets.only(left: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                                ),
                                child: const Text(
                                  'ANDA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryBlue,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        subtitle: Text(
                          member.nim.isNotEmpty ? member.nim : '-',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${member.individualPoints} Pts',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                            const Text(
                              'Individu',
                              style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Read-only notice
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryBlue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: AppColors.primaryBlueDark, size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Keanggotaan & DPL kelompok KKN dikelola oleh Admin DLH. Aplikasi mobile bersifat read-only.',
                          style: TextStyle(fontSize: 11, color: AppColors.primaryBlueDark),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showRegisterPoskoDialog(BuildContext context, WidgetRef ref, KelompokKknData kelompokData) {
    final namaCtrl = TextEditingController(text: kelompokData.groupName.isNotEmpty ? 'Posko KKN ${kelompokData.groupName}' : 'Posko KKN');
    final alamatCtrl = TextEditingController(text: kelompokData.poskoAlamat != '-' ? kelompokData.poskoAlamat : '');
    double currentLat = kelompokData.latitude;
    double currentLng = kelompokData.longitude;
    File? selectedFoto;
    bool isFetchingGps = false;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> fetchLocation() async {
              setModalState(() => isFetchingGps = true);
              try {
                LocationPermission permission = await Geolocator.checkPermission();
                if (permission == LocationPermission.denied) {
                  permission = await Geolocator.requestPermission();
                }
                if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
                  final pos = await Geolocator.getCurrentPosition(
                    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
                  );
                  setModalState(() {
                    currentLat = pos.latitude;
                    currentLng = pos.longitude;
                    isFetchingGps = false;
                  });
                } else {
                  setModalState(() => isFetchingGps = false);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Izin akses lokasi GPS ditolak.')),
                    );
                  }
                }
              } catch (e) {
                setModalState(() => isFetchingGps = false);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal mendapatkan GPS: $e')),
                  );
                }
              }
            }

            Future<void> pickPhoto() async {
              final picker = ImagePicker();
              final source = await showModalBottomSheet<ImageSource>(
                context: context,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
                builder: (bctx) => SafeArea(
                  child: Wrap(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primaryGreen),
                        title: const Text('Kamera HP'),
                        onTap: () => Navigator.pop(bctx, ImageSource.camera),
                      ),
                      ListTile(
                        leading: const Icon(Icons.photo_library_rounded, color: AppColors.primaryGreen),
                        title: const Text('Galeri HP'),
                        onTap: () => Navigator.pop(bctx, ImageSource.gallery),
                      ),
                    ],
                  ),
                ),
              );
              if (source != null) {
                final picked = await picker.pickImage(source: source, imageQuality: 80);
                if (picked != null) {
                  setModalState(() {
                    selectedFoto = File(picked.path);
                  });
                }
              }
            }

            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Pendaftaran Posko KKN',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Pastikan Anda berada di lokasi fisik posko untuk merekam koordinat GPS perangkat secara akurat.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const Divider(height: 24),
                    TextField(
                      controller: namaCtrl,
                      decoration: InputDecoration(
                        labelText: 'Nama Posko KKN',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.apartment_rounded, color: AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: alamatCtrl,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Alamat Lengkap Posko',
                        hintText: 'Misal: Jl. Cisitu Lama No. 14, RT 02 / RW 08',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.map_rounded, color: AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // GPS Box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.my_location_rounded, color: AppColors.primaryGreen, size: 18),
                                  SizedBox(width: 6),
                                  Text(
                                    'Koordinat GPS',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                ],
                              ),
                              TextButton.icon(
                                onPressed: isFetchingGps ? null : fetchLocation,
                                icon: isFetchingGps
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                                      )
                                    : const Icon(Icons.refresh_rounded, size: 16),
                                label: Text(isFetchingGps ? 'Merekam GPS...' : 'Ambil GPS HP'),
                              ),
                            ],
                          ),
                          Text(
                            'Lat: ${currentLat.toStringAsFixed(6)}, Lng: ${currentLng.toStringAsFixed(6)}',
                            style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.black87),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Foto Box
                    InkWell(
                      onTap: pickPhoto,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 90,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                        ),
                        child: selectedFoto != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.file(selectedFoto!, fit: BoxFit.cover),
                              )
                            : const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt_outlined, color: AppColors.primaryGreen, size: 28),
                                  SizedBox(height: 4),
                                  Text('Unggah Foto Posko (Opsional)', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                if (alamatCtrl.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Alamat lengkap posko wajib diisi.')),
                                  );
                                  return;
                                }
                                setModalState(() => isSubmitting = true);
                                final req = RegisterPoskoRequest(
                                  nama: namaCtrl.text.trim(),
                                  alamat: alamatCtrl.text.trim(),
                                  latitude: currentLat,
                                  longitude: currentLng,
                                  fotoPath: selectedFoto?.path,
                                );
                                final success = await ref.read(kelompokKknProvider.notifier).registerPosko(req);
                                setModalState(() => isSubmitting = false);
                                if (success && context.mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Posko KKN berhasil didaftarkan! Menunggu verifikasi RW setempat.'),
                                      backgroundColor: AppColors.primaryGreen,
                                    ),
                                  );
                                } else if (context.mounted) {
                                  final err = ref.read(kelompokKknProvider).error ?? 'Gagal mendaftarkan posko.';
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(err), backgroundColor: Colors.red),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: isSubmitting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text(
                                'Kirim Pendaftaran Posko',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
