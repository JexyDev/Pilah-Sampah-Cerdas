import '../../core/values/app_config.dart';

class NewsArticleModel {
  final String id;
  final String slug;
  final String title;
  final String category;
  final String date;
  final String readTime;
  final String location;
  final String rawImageUrl;
  final String summary;
  final String content;
  final String author;
  final int viewCount;

  NewsArticleModel({
    required this.id,
    required this.slug,
    required this.title,
    required this.category,
    required this.date,
    required this.readTime,
    required this.location,
    required this.rawImageUrl,
    required this.summary,
    required this.content,
    required this.author,
    this.viewCount = 0,
  });

  /// Mengonversi path relatif (/image/.. atau /uploads/..) menjadi URL publik lengkap
  String get fullImageUrl => AppConfig.getImageUrl(rawImageUrl);

  factory NewsArticleModel.fromJson(Map<String, dynamic> json) {
    // Normalisasi author (bisa berupa String atau Map)
    String authorText = 'Tim KKN & DLH';
    if (json['authorName'] != null && json['authorName'].toString().isNotEmpty) {
      authorText = json['authorName'].toString();
    } else if (json['author'] is Map && json['author']['name'] != null) {
      authorText = json['author']['name'].toString();
    } else if (json['author'] is String && json['author'].toString().isNotEmpty) {
      authorText = json['author'].toString();
    }

    final rawTitle = json['title'] ?? json['judul'] ?? 'Berita Lingkungan';
    final rawSummary = json['summary'] ?? json['ringkasan'] ?? '';
    final rawContent = json['content'] ?? json['konten'] ?? rawSummary;

    return NewsArticleModel(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      title: rawTitle.toString(),
      category: (json['category'] ?? json['kategori'] ?? 'Kegiatan').toString(),
      date: (json['date'] ?? json['publishedAt'] ?? '').toString(),
      readTime: (json['readTime'] ?? '3 min baca').toString(),
      location: (json['location'] ?? 'Kota Bandung').toString(),
      rawImageUrl: (json['imageUrl'] ?? json['gambarUrl'] ?? '').toString(),
      summary: rawSummary.toString(),
      content: rawContent.toString(),
      author: authorText,
      viewCount: json['viewCount'] is int ? json['viewCount'] : 0,
    );
  }
}
