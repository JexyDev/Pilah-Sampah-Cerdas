import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../data/models/news_article_model.dart';

class BeritaCardWidget extends StatelessWidget {
  final NewsArticleModel article;
  final VoidCallback onTap;
  final bool isHorizontalList;

  const BeritaCardWidget({
    super.key,
    required this.article,
    required this.onTap,
    this.isHorizontalList = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: isHorizontalList ? 260 : double.infinity,
      margin: isHorizontalList ? const EdgeInsets.only(right: 14) : EdgeInsets.zero,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail & Badge
            Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: article.fullImageUrl,
                  memCacheWidth: 400,
                  memCacheHeight: 260,
                  height: 130,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    height: 130,
                    color: const Color(0xFFF1F5F9),
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    height: 130,
                    color: const Color(0xFFE2E8F0),
                    child: const Icon(Icons.image_not_supported_outlined, color: Colors.grey),
                  ),
                ),
                // Kategori disembunyikan
              ],
            ),

            // Metadata & Teks
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        article.date,
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                      if (article.readTime.isNotEmpty) ...[
                        const Text(
                          ' • ',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                        ),
                        Text(
                          article.readTime,
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    article.summary,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF475569),
                      height: 1.35,
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
