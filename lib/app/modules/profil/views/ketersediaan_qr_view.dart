import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/ketersediaan_qr_controller.dart';

class KetersediaanQrView extends ConsumerWidget {
  const KetersediaanQrView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(ketersediaanQrProvider);
    final controller = ref.read(ketersediaanQrProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Ketersediaan QR',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                onChanged: (value) => controller.setSearchQuery(value),
                decoration: InputDecoration(
                  hintText: 'Cari kode QR...',
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
                  ),
                ),
              ),
            ),
            _buildFilters(context, state, controller),
            const SizedBox(height: 16),
            Expanded(
              child: _buildContent(state, controller),
            ),
          ],
        ),
      ),
      floatingActionButton: state.items.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: state.isLoading ? null : () {
                showModalBottomSheet(
                  context: context,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  builder: (context) => SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text(
                            'Pilih Format Cetak',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                        ListTile(
                          leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
                          title: const Text('Export sebagai PDF'),
                          onTap: () {
                            Navigator.pop(context);
                            controller.exportData(asImage: false);
                          },
                        ),
                        ListTile(
                          leading: const Icon(Icons.image, color: Colors.blue),
                          title: const Text('Export sebagai Gambar (PNG)'),
                          onTap: () {
                            Navigator.pop(context);
                            controller.exportData(asImage: true);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
              backgroundColor: AppColors.primaryGreen,
              icon: state.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.print, color: Colors.white),
              label: Text(
                state.selectedItems.isNotEmpty 
                  ? 'Cetak QR (${state.selectedItems.length})'
                  : 'Cetak Semua QR',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildFilters(BuildContext context, KetersediaanQrState state, KetersediaanQrController controller) {
    final categories = ['Semua', 'Organik', 'Anorganik'];
    final statuses = ['Semua Status', 'Tersedia', 'Digunakan'];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: categories.map((cat) {
              final isSelected = state.selectedCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(cat),
                  selected: isSelected,
                  onSelected: (_) => controller.setFilter(cat),
                  selectedColor: AppColors.primaryGreen,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: InkWell(
            onTap: () => _showStatusDropdown(context, state, controller, statuses),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    state.selectedStatus,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showStatusDropdown(BuildContext context, KetersediaanQrState state, KetersediaanQrController controller, List<String> statuses) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    const Text(
                      'Pilih Status',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 20,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: statuses.map((status) {
                    final isSelected = state.selectedStatus == status;
                    return InkWell(
                      onTap: () {
                        controller.setStatusFilter(status);
                        Navigator.pop(ctx);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 14,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFE8F5E9)
                                    : const Color(0xFFF5F7FA),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                status == 'Tersedia' 
                                  ? Icons.check_circle_outline 
                                  : status == 'Digunakan' 
                                      ? Icons.block 
                                      : Icons.all_inclusive,
                                size: 20,
                                color: isSelected
                                    ? AppColors.primaryGreen
                                    : AppColors.textHint,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    status,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                      color: isSelected
                                          ? AppColors.primaryGreen
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    status == 'Tersedia' 
                                      ? 'QR Code belum terikat dengan fasilitas' 
                                      : status == 'Digunakan'
                                          ? 'QR Code sudah terikat dengan fasilitas'
                                          : 'Tampilkan semua status QR Code',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primaryGreen
                                      : Colors.grey.shade400,
                                  width: isSelected ? 6 : 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContent(KetersediaanQrState state, KetersediaanQrController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
    }

    if (state.errorMessage != null && state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                state.errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    if (state.items.isEmpty) {
      return const Center(
        child: Text(
          'Tidak ada QR Code yang tersedia',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16).copyWith(bottom: 80), // padding bottom for FAB
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.68,
      ),
      itemCount: state.items.length,
      itemBuilder: (context, index) {
        final item = state.items[index];
        final rawQr = (item['qrCode']?.toString() ?? item['kode']?.toString() ?? '').trim();
        final qrCodeStr = rawQr.isNotEmpty ? rawQr : 'BSK-OGN-250826-0001';
        final rawCat = (item['category']?['name']?.toString() ?? item['jenis']?.toString() ?? '').toUpperCase();
        final categoryName = rawCat.contains('ANORGANIK') || rawCat.contains('NON')
            ? 'Anorganik'
            : (rawCat.contains('RESIDU') || rawCat.contains('RSD') ? 'Residu' : 'Organik');
        final isOrganik = categoryName == 'Organik';
        final statusBin = item['status']?.toString().toUpperCase() ?? 'PRINTED';
        final isUsed = statusBin != 'PRINTED' && statusBin != 'TERSEDIA';
        final isSelected = state.selectedItems.contains(qrCodeStr);

        return GestureDetector(
          onTap: () => controller.toggleSelection(qrCodeStr),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? Colors.green.shade50 : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? Colors.green : Colors.grey.shade200,
                width: isSelected ? 2 : 1,
              ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              QrImageView(
                data: qrCodeStr,
                version: QrVersions.auto,
                size: 100.0,
              ),
              const SizedBox(height: 12),
              Text(
                qrCodeStr,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isOrganik ? Colors.green : Colors.yellow.shade700,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    categoryName,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isUsed ? Colors.orange.shade50 : Colors.green.shade50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  isUsed ? 'Digunakan' : 'Tersedia',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isUsed ? Colors.orange.shade700 : Colors.green.shade700,
                  ),
                ),
              )
            ],
          ),
        ));
      },
    );
  }
}





