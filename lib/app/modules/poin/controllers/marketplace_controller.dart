import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/models/marketplace_product_entity.dart';
import '../../../data/models/marketplace_order_entity.dart';

const _kProductsKey = 'marketplace_products_v1';
const _kOrdersKey = 'marketplace_orders_v1';

// ─── Mock data produk awal ────────────────────────────────────────────────────
List<MarketplaceProductEntity> _defaultProducts() => [
      MarketplaceProductEntity(
        id: 'p1',
        name: 'Minyak Goreng 1L',
        description:
            'Minyak goreng premium 1 liter. Terbuat dari bahan pilihan, cocok untuk kebutuhan dapur sehari-hari.',
        pointsCost: 150,
        stock: 10,
        iconData: Icons.kitchen.codePoint,
        kategori: 'Sembako',
      ),
      MarketplaceProductEntity(
        id: 'p2',
        name: 'Beras 2kg',
        description:
            'Beras pulen pilihan 2kg. Cocok untuk keluarga yang aktif menjaga kebersihan lingkungan.',
        pointsCost: 200,
        stock: 8,
        iconData: Icons.set_meal.codePoint,
        kategori: 'Sembako',
      ),
      MarketplaceProductEntity(
        id: 'p3',
        name: 'Sabun Cuci Piring',
        description:
            'Sabun cuci piring 800ml, efektif membersihkan lemak. Ramah lingkungan dan biodegradable.',
        pointsCost: 75,
        stock: 15,
        iconData: Icons.clean_hands.codePoint,
        kategori: 'Kebersihan',
      ),
      MarketplaceProductEntity(
        id: 'p4',
        name: 'Botol Minum Reusable',
        description:
            'Botol minum 750ml stainless steel anti bocor. Dukung gaya hidup zero waste setiap hari.',
        pointsCost: 250,
        stock: 5,
        iconData: Icons.water_drop.codePoint,
        kategori: 'Alat Rumah',
      ),
      MarketplaceProductEntity(
        id: 'p5',
        name: 'Tas Belanja Kain',
        description:
            'Tas belanja kain kanvas ramah lingkungan, kuat dan bisa dicuci. Ukuran 35x40cm.',
        pointsCost: 100,
        stock: 20,
        iconData: Icons.shopping_bag.codePoint,
        kategori: 'Aksesoris',
      ),
      MarketplaceProductEntity(
        id: 'p6',
        name: 'Pupuk Kompos 1kg',
        description:
            'Pupuk kompos organik hasil pengolahan sampah RW. Cocok untuk tanaman hias dan sayuran.',
        pointsCost: 80,
        stock: 12,
        iconData: Icons.eco.codePoint,
        kategori: 'Pertanian',
      ),
      MarketplaceProductEntity(
        id: 'p7',
        name: 'Deterjen Cuci 500g',
        description:
            'Deterjen bubuk bersih 500g. Formula khusus untuk membersihkan pakaian dengan hasil optimal.',
        pointsCost: 90,
        stock: 0, // Sengaja habis untuk demo
        iconData: Icons.local_laundry_service.codePoint,
        kategori: 'Kebersihan',
        isActive: true,
      ),
      MarketplaceProductEntity(
        id: 'p8',
        name: 'Sikat Daur Ulang',
        description:
            'Sikat multifungsi berbahan daur ulang plastik. Cocok untuk membersihkan bin sampah.',
        pointsCost: 60,
        stock: 25,
        iconData: Icons.brush.codePoint,
        kategori: 'Alat Rumah',
      ),
    ];

// ─── Product State Notifier ──────────────────────────────────────────────────
class MarketplaceProductsNotifier
    extends StateNotifier<List<MarketplaceProductEntity>> {
  MarketplaceProductsNotifier() : super([]) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kProductsKey);
    if (raw != null) {
      final List decoded = jsonDecode(raw) as List;
      state = decoded
          .map((e) => MarketplaceProductEntity.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      state = _defaultProducts();
      await _save();
    }
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _kProductsKey,
      jsonEncode(state.map((e) => e.toJson()).toList()),
    );
  }

  /// Kurangi stok produk setelah transaksi sukses.
  Future<void> decreaseStock(String productId, int quantity) async {
    state = [
      for (final p in state)
        if (p.id == productId) p.copyWith(stock: (p.stock - quantity).clamp(0, 9999))
        else p,
    ];
    await _save();
  }

  /// Reset ke data default (untuk keperluan testing).
  Future<void> resetToDefault() async {
    state = _defaultProducts();
    await _save();
  }
}

final marketplaceProductsProvider = StateNotifierProvider<
    MarketplaceProductsNotifier, List<MarketplaceProductEntity>>(
  (_) => MarketplaceProductsNotifier(),
);

// ─── Orders State Notifier ───────────────────────────────────────────────────
class MarketplaceOrdersNotifier
    extends StateNotifier<List<MarketplaceOrderEntity>> {
  MarketplaceOrdersNotifier() : super([]) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kOrdersKey);
    if (raw != null) {
      final List decoded = jsonDecode(raw) as List;
      state = decoded
          .map((e) => MarketplaceOrderEntity.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _kOrdersKey,
      jsonEncode(state.map((e) => e.toJson()).toList()),
    );
  }

  Future<MarketplaceOrderEntity> addOrder({
    required MarketplaceProductEntity product,
    required int quantity,
  }) async {
    final now = DateTime.now();
    final claimCode = _generateClaimCode(now);
    final order = MarketplaceOrderEntity(
      id: 'ord-${now.millisecondsSinceEpoch}',
      productId: product.id,
      productName: product.name,
      productKategori: product.kategori,
      quantity: quantity,
      pointsPerUnit: product.pointsCost,
      totalPointsSpent: product.pointsCost * quantity,
      claimCode: claimCode,
      createdAt: now,
    );
    state = [order, ...state];
    await _save();
    return order;
  }

  String _generateClaimCode(DateTime now) {
    final rand = Random().nextInt(9999).toString().padLeft(4, '0');
    final dateStr =
        '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    return 'BRS-$dateStr-$rand';
  }
}

final marketplaceOrdersProvider = StateNotifierProvider<
    MarketplaceOrdersNotifier, List<MarketplaceOrderEntity>>(
  (_) => MarketplaceOrdersNotifier(),
);

// ─── Cart State ──────────────────────────────────────────────────────────────
/// `Map<productId, quantity>` — hanya in-memory, tidak perlu disimpan.
class CartNotifier extends StateNotifier<Map<String, int>> {
  CartNotifier() : super({});

  void addItem(String productId, {int qty = 1}) {
    state = {
      ...state,
      productId: (state[productId] ?? 0) + qty,
    };
  }

  void removeItem(String productId) {
    final updated = Map<String, int>.from(state);
    updated.remove(productId);
    state = updated;
  }

  void updateQty(String productId, int qty) {
    if (qty <= 0) {
      removeItem(productId);
    } else {
      state = {...state, productId: qty};
    }
  }

  void clear() => state = {};

  int get totalItems => state.values.fold(0, (a, b) => a + b);

  int totalCost(List<MarketplaceProductEntity> products) {
    int total = 0;
    for (final entry in state.entries) {
      final product = products.where((p) => p.id == entry.key).firstOrNull;
      if (product != null) {
        total += product.pointsCost * entry.value;
      }
    }
    return total;
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, Map<String, int>>(
  (_) => CartNotifier(),
);

// ─── Computed: total items in cart ───────────────────────────────────────────
final cartTotalItemsProvider = Provider<int>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.values.fold(0, (a, b) => a + b);
});
