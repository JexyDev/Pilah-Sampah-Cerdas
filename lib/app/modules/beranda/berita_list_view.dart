import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/values/app_colors.dart';
import '../shared/widgets/app_error.dart';
import '../shared/widgets/skeleton_loading.dart';
import 'controllers/berita_controller.dart';
import 'widgets/berita_card_widget.dart';
import 'widgets/berita_detail_sheet.dart';

class BeritaListView extends ConsumerWidget {
  const BeritaListView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final beritaAsync = ref.watch(semuaBeritaProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Semua Informasi & Berita',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: beritaAsync.when(
        data: (beritaList) {
          if (beritaList.isEmpty) {
            return const Center(
              child: Text(
                'Belum ada berita terbaru.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            itemCount: beritaList.length,
            itemBuilder: (context, index) {
              final article = beritaList[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: SizedBox(
                  // Override width from card constraint
                  width: double.infinity,
                  child: BeritaCardWidget(
                    article: article,
                    isHorizontalList: false,
                    onTap: () {
                      showBeritaDetailSheet(context, article);
                    },
                  ),
                ),
              );
            },
          );
        },
        loading: () => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          itemBuilder: (context, index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: SkeletonLoading(
                width: double.infinity,
                height: 260,
                borderRadius: BorderRadius.circular(16),
              ),
            );
          },
        ),
        error: (error, stack) {
          debugPrint('Error memuat berita: $error');
          return Center(
            child: AppError(
              message: 'Gagal memuat berita. Silakan coba lagi.',
              onRetry: () => ref.invalidate(semuaBeritaProvider),
            ),
          );
        },
      ),
    );
  }
}
