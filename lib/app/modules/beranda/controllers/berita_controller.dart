import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/news_article_model.dart';
import '../../../data/providers/repository_providers.dart';

final beritaListProvider = FutureProvider<List<NewsArticleModel>>((ref) async {
  final repository = ref.read(beritaRepositoryProvider);
  // Ambil beberapa berita terbaru (limit 5) untuk ditampilkan di beranda
  return repository.getPublishedNews(limit: 5);
});

final semuaBeritaProvider = FutureProvider<List<NewsArticleModel>>((ref) async {
  final repository = ref.read(beritaRepositoryProvider);
  // Ambil lebih banyak berita untuk halaman Semua Berita
  return repository.getPublishedNews(limit: 20);
});
