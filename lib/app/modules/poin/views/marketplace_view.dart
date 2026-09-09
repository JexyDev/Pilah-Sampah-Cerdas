import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/marketplace_product_entity.dart';
import '../controllers/marketplace_controller.dart';
import '../../../modules/riwayat/controllers/riwayat_controller.dart';
import 'marketplace_cart_view.dart';

class MarketplaceView extends ConsumerStatefulWidget {
  const MarketplaceView({super.key});

  @override
  ConsumerState<MarketplaceView> createState() => _MarketplaceViewState();
}

class _MarketplaceViewState extends ConsumerState<MarketplaceView> {
  String _selectedKategori = 'Semua';

  static const _kategoriList = [
    'Semua',
    'Sembako',
    'Kebersihan',
    'Alat Rumah',
    'Aksesoris',
    'Pertanian',
  ];

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(marketplaceProductsProvider);
    final cart = ref.watch(cartProvider);
    final cartTotal = ref.watch(cartTotalItemsProvider);
    final totalPointsAsync = ref.watch(totalPointsProvider);

    final filtered = _selectedKategori == 'Semua'
        ? products
        : products.where((p) => p.kategori == _selectedKategori).toList();

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
          'Belanja Poin',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_rounded,
                    color: AppColors.textPrimary),
                onPressed: cartTotal == 0
                    ? null
                    : () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MarketplaceCartView(),
                          ),
                        ),
              ),
              if (cartTotal > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.dangerRed,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '$cartTotal',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // ─── Saldo Poin Banner ───────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: totalPointsAsync.when(
              skipLoadingOnReload: true,
              data: (total) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF009966), Color(0xFF00CC88)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.stars_rounded, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Saldo Poin Anda',
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                        Text(
                          '${NumberFormat('#,###').format(total)} PTS',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    if (cart.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Total Keranjang',
                            style: TextStyle(color: Colors.white70, fontSize: 10),
                          ),
                          Text(
                            '-${NumberFormat('#,###').format(products.isEmpty ? 0 : ref.read(cartProvider.notifier).totalCost(products))} PTS',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              loading: () => const SizedBox(height: 52),
              error: (_, __) => const SizedBox(height: 52),
            ),
          ),

          // ─── Filter Kategori ─────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.only(bottom: 12),
            child: SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _kategoriList.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final k = _kategoriList[i];
                  final isSelected = k == _selectedKategori;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedKategori = k),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primaryGreen
                            : AppColors.backgroundCanvas,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primaryGreen
                              : AppColors.border,
                        ),
                      ),
                      child: Text(
                        k,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const Divider(height: 1),

          // ─── Grid Produk ─────────────────────────────────────────────────
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Text(
                      'Tidak ada produk di kategori ini.',
                      style: TextStyle(color: AppColors.textHint),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.78,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) =>
                        _ProductCard(product: filtered[i]),
                  ),
          ),
        ],
      ),
      // Checkout FAB
      floatingActionButton: cartTotal > 0
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const MarketplaceCartView()),
              ),
              backgroundColor: AppColors.primaryGreen,
              icon: const Icon(Icons.shopping_cart_checkout_rounded),
              label: Text('Keranjang ($cartTotal)'),
            )
          : null,
    );
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────
class _ProductCard extends ConsumerWidget {
  const _ProductCard({required this.product});
  final MarketplaceProductEntity product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final qtyInCart = cart[product.id] ?? 0;

    return GestureDetector(
      onTap: product.isAvailable
          ? () => _showDetail(context, ref)
          : null,
      child: AnimatedOpacity(
        opacity: product.isAvailable ? 1.0 : 0.5,
        duration: const Duration(milliseconds: 200),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: qtyInCart > 0
                  ? AppColors.primaryGreen
                  : AppColors.border,
              width: qtyInCart > 0 ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon area
              Container(
                height: 90,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.08),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(15),
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: _buildProductIcon(product.iconData, 48),
                    ),
                    if (!product.isAvailable)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.dangerRed,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'Habis',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    if (qtyInCart > 0)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$qtyInCart di keranjang',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.kategori,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textHint,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.stars_rounded,
                            size: 14, color: AppColors.warningYellow),
                        const SizedBox(width: 4),
                        Text(
                          '${product.pointsCost} Poin',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sisa: ${product.stock}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDetail(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProductDetailSheet(product: product),
    );
  }
}

// ─── Product Detail Bottom Sheet ──────────────────────────────────────────────
class _ProductDetailSheet extends ConsumerStatefulWidget {
  const _ProductDetailSheet({required this.product});
  final MarketplaceProductEntity product;

  @override
  ConsumerState<_ProductDetailSheet> createState() =>
      _ProductDetailSheetState();
}

class _ProductDetailSheetState extends ConsumerState<_ProductDetailSheet> {
  int _qty = 1;

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final qtyInCart = cart[widget.product.id] ?? 0;
    final totalQty = qtyInCart + _qty;
    final canAdd = totalQty <= widget.product.stock;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
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
          const SizedBox(height: 20),
          // Icon besar
          Center(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: _buildProductIcon(widget.product.iconData, 56),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  widget.product.kategori,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            widget.product.name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            widget.product.description,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.stars_rounded,
                  color: AppColors.warningYellow, size: 20),
              const SizedBox(width: 6),
              Text(
                '${widget.product.pointsCost} Poin / unit',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryGreen,
                ),
              ),
              const Spacer(),
              Text(
                'Stok: ${widget.product.stock}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textHint,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Qty selector
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Jumlah: ',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              _QtyButton(
                icon: Icons.remove,
                onTap: () {
                  if (_qty > 1) setState(() => _qty--);
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  '$_qty',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _QtyButton(
                icon: Icons.add,
                onTap: canAdd
                    ? () => setState(() => _qty++)
                    : null,
              ),
            ],
          ),
          if (!canAdd)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Center(
                child: Text(
                  'Maks. stok tersedia: ${widget.product.stock}',
                  style: const TextStyle(
                    color: AppColors.dangerRed,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: canAdd
                      ? () {
                          ref
                              .read(cartProvider.notifier)
                              .addItem(widget.product.id, qty: _qty);
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).clearSnackBars();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                '${widget.product.name} ($_qty) ditambahkan ke keranjang!',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              backgroundColor: AppColors.primaryGreen,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      : null,
                  child: Text(
                    'Tambah ke Keranjang  (+${widget.product.pointsCost * _qty} Pts)',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: onTap != null
              ? AppColors.primaryGreen
              : AppColors.backgroundCanvas,
          shape: BoxShape.circle,
          border: Border.all(
            color: onTap != null ? AppColors.primaryGreen : AppColors.border,
          ),
        ),
        child: Icon(
          icon,
          size: 18,
          color: onTap != null ? Colors.white : AppColors.textHint,
        ),
      ),
    );
  }
}

class _ProductIcon extends StatelessWidget {
  const _ProductIcon({required this.codePoint, required this.size});
  final int codePoint;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(
      IconData(codePoint, fontFamily: 'MaterialIcons'),
      size: size,
      color: AppColors.primaryGreen,
    );
  }
}

Widget _buildProductIcon(int codePoint, double size) =>
    _ProductIcon(codePoint: codePoint, size: size);
