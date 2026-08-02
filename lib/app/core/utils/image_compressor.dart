import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart' as path_provider;
import 'package:path/path.dart' as p;

/// Utility terpusat untuk kompresi foto sebelum diunggah ke backend Express.js.
/// 
/// Target Batas Ukuran:
/// - AI Scan Sampah (FR-01): Target < 1MB (Max 1024 x 1024px, Quality ~80%)
/// - Reset Bin Evidence (FR-12): Target < 5MB (Max 1920 x 1080px, Quality ~85%)
/// - Update Avatar Profil (FR-16): Target < 300KB (Max 512 x 512px, Quality ~80%)
class ImageCompressor {
  ImageCompressor._();

  /// Kompresi foto secara otomatis berdasarkan target ukuran maksimum.
  static Future<String> compressImage(
    String inputPath, {
    required int maxSizeBytes,
    int maxWidth = 1080,
    int maxHeight = 1080,
    int initialQuality = 80,
  }) async {
    try {
      final inputFile = File(inputPath);
      if (!await inputFile.exists()) {
        return inputPath;
      }

      final fileSize = await inputFile.length();
      // Jika ukuran file sudah di bawah target, kembalikan file asli
      if (fileSize <= maxSizeBytes && fileSize > 0) {
        debugPrint('[ImageCompressor] File size already small ($fileSize bytes <= $maxSizeBytes bytes), skipping compression.');
        return inputPath;
      }

      final tempDir = await path_provider.getTemporaryDirectory();
      final targetPath = p.join(
        tempDir.path,
        'compressed_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );

      var quality = initialQuality;
      XFile? result = await FlutterImageCompress.compressAndGetFile(
        inputPath,
        targetPath,
        quality: quality,
        minWidth: maxWidth,
        minHeight: maxHeight,
        format: CompressFormat.jpeg,
      );

      if (result == null) {
        debugPrint('[ImageCompressor] Native compression returned null, fallback to original path.');
        return inputPath;
      }

      var compressedFile = File(result.path);
      var compressedSize = await compressedFile.length();

      // Loop penyesuaian kualitas jika masih melebihi target size
      while (compressedSize > maxSizeBytes && quality > 30) {
        quality -= 15;
        final retryPath = p.join(
          tempDir.path,
          'compressed_retry_${quality}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        );

        final retryResult = await FlutterImageCompress.compressAndGetFile(
          inputPath,
          retryPath,
          quality: quality,
          minWidth: (maxWidth * 0.8).toInt(),
          minHeight: (maxHeight * 0.8).toInt(),
          format: CompressFormat.jpeg,
        );

        if (retryResult != null) {
          compressedFile = File(retryResult.path);
          compressedSize = await compressedFile.length();
        } else {
          break;
        }
      }

      debugPrint('[ImageCompressor] Compression finished. Original: $fileSize bytes -> Compressed: $compressedSize bytes (Quality: $quality)');
      return compressedFile.path;
    } catch (e) {
      debugPrint('[ImageCompressor] Compression exception: $e. Fallback to original image.');
      return inputPath;
    }
  }
}
