import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/marketplace_order_entity.dart';
import 'marketplace_orders_view.dart';

/// Halaman Struk/Resi Digital setelah transaksi marketplace berhasil.
class MarketplaceReceiptView extends StatelessWidget {
  const MarketplaceReceiptView({super.key, required this.orders});
  final List<MarketplaceOrderEntity> orders;

  @override
  Widget build(BuildContext context) {
    final firstOrder = orders.first;
    final totalPoin = orders.fold<int>(0, (sum, o) => sum + o.totalPointsSpent);
    final totalItems = orders.fold<int>(0, (sum, o) => sum + o.quantity);

    return Scaffold(
      backgroundColor: const Color(0xFF0F4C2E),
      body: SafeArea(
        child: Column(
          children: [
            // ─── Top Bar ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded,
                      color: Colors.white, size: 28),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Transaksi Berhasil!',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.home_rounded, color: Colors.white),
                    onPressed: () {
                      // Pop semua ke root
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ─── Struk Card ──────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Header struk
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF009966), Color(0xFF00CC88)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(24),
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.receipt_long_rounded,
                                color: Colors.white,
                                size: 40,
                              ),
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'BERSEKA MARKETPLACE',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Bukti Pembelian',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Zigzag separator
                      _ReceiptDivider(color: const Color(0xFF009966)),

                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Kode Klaim (jika single order)
                            if (orders.length == 1) ...[
                              Center(
                                child: Column(
                                  children: [
                                    const Text(
                                      'KODE KLAIM',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textHint,
                                        letterSpacing: 1.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    GestureDetector(
                                      onTap: () {
                                        Clipboard.setData(ClipboardData(
                                            text: firstOrder.claimCode));
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          const SnackBar(
                                            content:
                                                Text('Kode disalin ke clipboard!'),
                                            backgroundColor:
                                                AppColors.primaryGreen,
                                            behavior: SnackBarBehavior.floating,
                                          ),
                                        );
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 24, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryGreen
                                              .withValues(alpha: 0.08),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                          border: Border.all(
                                            color: AppColors.primaryGreen
                                                .withValues(alpha: 0.3),
                                            style: BorderStyle.solid,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              firstOrder.claimCode,
                                              style: const TextStyle(
                                                fontSize: 22,
                                                fontWeight: FontWeight.w800,
                                                color: AppColors.primaryGreen,
                                                letterSpacing: 2,
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            const Icon(Icons.copy_rounded,
                                                color: AppColors.primaryGreen,
                                                size: 18),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    const Text(
                                      'Ketuk untuk menyalin kode',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textHint),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                              const Divider(color: AppColors.divider),
                              const SizedBox(height: 12),
                            ],

                            // Info struk
                            _ReceiptRow(
                              label: 'Tanggal',
                              value: DateFormat('d MMMM yyyy', 'id_ID')
                                  .format(firstOrder.createdAt),
                            ),
                            _ReceiptRow(
                              label: 'Waktu',
                              value: DateFormat('HH:mm:ss')
                                  .format(firstOrder.createdAt),
                            ),
                            _ReceiptRow(
                              label: 'Status',
                              value: '⏳ Menunggu Klaim',
                              valueColor: AppColors.warningYellow,
                            ),
                            const SizedBox(height: 12),
                            const Divider(color: AppColors.divider),
                            const SizedBox(height: 12),

                            // Detail produk
                            const Text(
                              'DETAIL PRODUK',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textHint,
                                letterSpacing: 1.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 10),
                            ...orders.map(
                              (order) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            order.productName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14,
                                            ),
                                          ),
                                          Text(
                                            '${order.pointsPerUnit} Poin × ${order.quantity}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                          if (orders.length > 1)
                                            Text(
                                              'Kode: ${order.claimCode}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.primaryGreen,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${NumberFormat('#,###').format(order.totalPointsSpent)} Pts',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                        color: AppColors.primaryGreen,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const Divider(color: AppColors.divider),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total ($totalItems item)',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                  ),
                                ),
                                Text(
                                  '${NumberFormat('#,###').format(totalPoin)} Pts',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const Divider(color: AppColors.divider),
                            const SizedBox(height: 12),

                            // Instruksi klaim
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.warningYellow
                                    .withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppColors.warningYellow
                                      .withValues(alpha: 0.4),
                                ),
                              ),
                              child: const Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.info_outline_rounded,
                                      color: AppColors.warningYellow, size: 18),
                                  SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Tunjukkan kode klaim ini kepada petugas Bank Sampah di RW Anda untuk mengambil barang. Kode berlaku 30 hari.',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                        height: 1.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ─── Bottom Buttons ──────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white54),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MarketplaceOrdersView(),
                        ),
                      ),
                      child: const Text('Riwayat Pesanan'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF0F4C2E),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () =>
                          Navigator.of(context).popUntil((r) => r.isFirst),
                      child: const Text(
                        'Kembali ke Beranda',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Baris info di dalam struk
class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({
    required this.label,
    required this.value,
    this.valueColor,
  });
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Efek zigzag/perforasi pada struk
class _ReceiptDivider extends StatelessWidget {
  const _ReceiptDivider({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 24,
      child: Row(
        children: List.generate(20, (i) {
          final isLeft = i == 0;
          final isRight = i == 19;
          return Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: i.isEven ? color.withValues(alpha: 0.05) : Colors.white,
                borderRadius: isLeft
                    ? const BorderRadius.only(
                        bottomLeft: Radius.circular(12))
                    : isRight
                        ? const BorderRadius.only(
                            bottomRight: Radius.circular(12))
                        : null,
              ),
            ),
          );
        }),
      ),
    );
  }
}
