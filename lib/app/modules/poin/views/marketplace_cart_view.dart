import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/marketplace_order_entity.dart';
import '../controllers/marketplace_controller.dart';
import '../../../modules/riwayat/controllers/riwayat_controller.dart';
import 'marketplace_receipt_view.dart';

class MarketplaceCartView extends ConsumerWidget {
  const MarketplaceCartView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final products = ref.watch(marketplaceProductsProvider);
    final totalPointsAsync = ref.watch(totalPointsProvider);

    // Build cart items
    final cartItems = cart.entries.map((entry) {
      final product = products.where((p) => p.id == entry.key).firstOrNull;
      return (product: product, qty: entry.value);
    }).where((item) => item.product != null).toList();

    final totalCost = ref.read(cartProvider.notifier).totalCost(products);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Keranjang Belanja',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Kosongkan Keranjang?'),
                  content: const Text(
                      'Semua item di keranjang akan dihapus.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Batal'),
                    ),
                    TextButton(
                      onPressed: () {
                        ref.read(cartProvider.notifier).clear();
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      child: const Text(
                        'Kosongkan',
                        style: TextStyle(color: AppColors.dangerRed),
                      ),
                    ),
                  ],
                ),
              );
            },
            child: const Text(
              'Kosongkan',
              style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
            ),
          ),
        ],
      ),
      body: cartItems.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.shopping_cart_outlined,
                      size: 64, color: AppColors.textHint),
                  SizedBox(height: 12),
                  Text('Keranjang kosong',
                      style: TextStyle(color: AppColors.textHint)),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: cartItems.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final item = cartItems[i];
                      final product = item.product!;
                      final qty = item.qty;
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: AppColors.primaryGreen
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: _ProductIcon(codePoint: product.iconData, size: 32),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    product.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${product.pointsCost} Poin × $qty = ${product.pointsCost * qty} Poin',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Qty control
                            Row(
                              children: [
                                _SmallQtyBtn(
                                  icon: Icons.remove,
                                  onTap: () => ref
                                      .read(cartProvider.notifier)
                                      .updateQty(product.id, qty - 1),
                                ),
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 10),
                                  child: Text(
                                    '$qty',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16),
                                  ),
                                ),
                                _SmallQtyBtn(
                                  icon: Icons.add,
                                  onTap: qty < product.stock
                                      ? () => ref
                                          .read(cartProvider.notifier)
                                          .updateQty(product.id, qty + 1)
                                      : null,
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                // ─── Total & Checkout ──────────────────────────────────────
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black12,
                          blurRadius: 8,
                          offset: Offset(0, -2)),
                    ],
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  child: Column(
                    children: [
                      totalPointsAsync.when(
                        skipLoadingOnReload: true,
                        data: (total) => Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Saldo Poin Kamu',
                                    style: TextStyle(
                                        color: AppColors.textSecondary)),
                                Text(
                                  '${NumberFormat('#,###').format(total)} Pts',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Belanja',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16)),
                                Text(
                                  '${NumberFormat('#,###').format(totalCost)} Pts',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Sisa Setelah Bayar',
                                    style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 13)),
                                Text(
                                  '${NumberFormat('#,###').format((total - totalCost).clamp(0, 9999999))} Pts',
                                  style: TextStyle(
                                    color: total >= totalCost
                                        ? AppColors.textSecondary
                                        : AppColors.dangerRed,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            if (total < totalCost)
                              Container(
                                margin: const EdgeInsets.only(top: 10),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.dangerRed
                                      .withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.warning_rounded,
                                        color: AppColors.dangerRed, size: 16),
                                    SizedBox(width: 8),
                                    Text(
                                      'Poin tidak mencukupi untuk transaksi ini.',
                                      style: TextStyle(
                                          color: AppColors.dangerRed,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: total >= totalCost
                                      ? AppColors.primaryGreen
                                      : AppColors.textHint,
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                onPressed: total >= totalCost
                                    ? () => _showConfirmation(
                                        context, ref, total, totalCost, cartItems)
                                    : null,
                                child: const Text(
                                  'Bayar Sekarang',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        loading: () => const CircularProgressIndicator(),
                        error: (_, __) =>
                            const Text('Gagal memuat saldo poin.'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  void _showConfirmation(
    BuildContext context,
    WidgetRef ref,
    int saldo,
    int totalCost,
    List<({dynamic product, int qty})> cartItems,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.shopping_bag_rounded, color: AppColors.primaryGreen),
            SizedBox(width: 10),
            Text('Konfirmasi Pembayaran',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Total ${cartItems.length} jenis produk',
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Poin',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                Text(
                  '${NumberFormat('#,###').format(totalCost)} Pts',
                  style: const TextStyle(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Sisa Poin',
                    style: TextStyle(color: AppColors.textSecondary)),
                Text(
                  '${NumberFormat('#,###').format(saldo - totalCost)} Pts',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await _processCheckout(context, ref, cartItems);
            },
            child: const Text('Bayar',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Future<void> _processCheckout(
    BuildContext context,
    WidgetRef ref,
    List<({dynamic product, int qty})> cartItems,
  ) async {
    final orders = <MarketplaceOrderEntity>[];
    for (final item in cartItems) {
      final order = await ref.read(marketplaceOrdersProvider.notifier).addOrder(
            product: item.product,
            quantity: item.qty,
          );
      await ref
          .read(marketplaceProductsProvider.notifier)
          .decreaseStock(item.product.id, item.qty);
      orders.add(order);
    }
    ref.read(cartProvider.notifier).clear();

    if (context.mounted) {
      // Navigasi ke halaman resi, hapus semua halaman sebelumnya (cart + marketplace tetap ada tapi kembali ke root)
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => MarketplaceReceiptView(orders: orders),
        ),
      );
    }
  }
}

class _SmallQtyBtn extends StatelessWidget {
  const _SmallQtyBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: onTap != null
              ? AppColors.primaryGreen.withValues(alpha: 0.1)
              : AppColors.backgroundCanvas,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color:
                onTap != null ? AppColors.primaryGreen : AppColors.border,
          ),
        ),
        child: Icon(icon,
            size: 16,
            color:
                onTap != null ? AppColors.primaryGreen : AppColors.textHint),
      ),
    );
  }
}

IconData _resolveIcon(int codePoint) {
  if (codePoint == Icons.kitchen.codePoint) return Icons.kitchen;
  if (codePoint == Icons.set_meal.codePoint) return Icons.set_meal;
  if (codePoint == Icons.clean_hands.codePoint) return Icons.clean_hands;
  if (codePoint == Icons.water_drop.codePoint) return Icons.water_drop;
  if (codePoint == Icons.shopping_bag.codePoint) return Icons.shopping_bag;
  if (codePoint == Icons.bolt.codePoint) return Icons.bolt;
  return Icons.inventory_2_outlined;
}

class _ProductIcon extends StatelessWidget {
  const _ProductIcon({required this.codePoint, required this.size});
  final int codePoint;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(
      _resolveIcon(codePoint),
      size: size,
      color: AppColors.primaryGreen,
    );
  }
}
