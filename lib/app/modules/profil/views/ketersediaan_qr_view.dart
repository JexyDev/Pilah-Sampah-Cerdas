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
            _buildFilters(state, controller),
            const SizedBox(height: 16),
            Expanded(
              child: _buildContent(state),
            ),
          ],
        ),
      ),
      floatingActionButton: state.items.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: state.isLoading ? null : () => controller.exportToPdf(),
              backgroundColor: AppColors.primaryGreen,
              icon: state.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.print, color: Colors.white),
              label: const Text(
                'Cetak QR',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildFilters(KetersediaanQrState state, KetersediaanQrController controller) {
    final categories = ['Semua', 'Organik', 'Anorganik'];
    return SingleChildScrollView(
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
    );
  }

  Widget _buildContent(KetersediaanQrState state) {
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
        childAspectRatio: 0.8,
      ),
      itemCount: state.items.length,
      itemBuilder: (context, index) {
        final item = state.items[index];
        final qrCodeStr = item['qrCode']?.toString() ?? 'UNKNOWN';
        final categoryName = item['category']?['name']?.toString() ?? 'Unknown';
        final isOrganik = categoryName.toLowerCase() == 'organik';

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
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
              )
            ],
          ),
        );
      },
    );
  }
}
