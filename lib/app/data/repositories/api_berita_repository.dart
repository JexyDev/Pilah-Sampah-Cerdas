import 'package:dio/dio.dart';
import '../providers/api_client.dart';
import '../models/news_article_model.dart';

class ApiBeritaRepository {
  final ApiClient _apiClient;

  ApiBeritaRepository(this._apiClient);

  /// Mengambil daftar berita terbit
  Future<List<NewsArticleModel>> getPublishedNews({
    int limit = 10,
    int offset = 0,
    String? kategori,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (kategori != null && kategori != 'Semua' && kategori.trim().isNotEmpty) {
        queryParams['kategori'] = kategori;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await _apiClient.dio.get(
        '/berita',
        queryParameters: queryParams,
      );

      final dynamic raw = response.data;
      final List itemsList = (raw is Map && (raw['items'] != null || raw['data'] != null))
          ? (raw['items'] ?? raw['data'])
          : (raw is List ? raw : []);

      return itemsList
          .map((item) => NewsArticleModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Gagal memuat berita terbaru';
      throw Exception(msg);
    } catch (e) {
      throw Exception('Terjadi kesalahan saat memproses data berita: $e');
    }
  }

  /// Mengambil detail satu berita
  Future<NewsArticleModel> getNewsDetail(String slugOrId) async {
    try {
      final response = await _apiClient.dio.get('/berita/$slugOrId');
      final dynamic raw = response.data;
      final dataMap = raw['data'] ?? raw;
      return NewsArticleModel.fromJson(Map<String, dynamic>.from(dataMap));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Berita tidak ditemukan';
      throw Exception(msg);
    }
  }
}
