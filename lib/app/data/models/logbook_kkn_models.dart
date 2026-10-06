import 'package:equatable/equatable.dart';

/// Metadata paginasi dari server
class PaginationMeta extends Equatable {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: (json['page'] as num?)?.toInt() ?? 1,
      limit: (json['limit'] as num?)?.toInt() ?? 10,
      total: (json['total'] as num?)?.toInt() ?? 0,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
    );
  }

  @override
  List<Object?> get props => [page, limit, total, totalPages];
}

/// Response paginasi logbook mahasiswa
class LogbookPaginationResponse extends Equatable {
  final bool success;
  final int total;
  final List<Map<String, dynamic>> data;
  final PaginationMeta pagination;

  const LogbookPaginationResponse({
    required this.success,
    required this.total,
    required this.data,
    required this.pagination,
  });

  factory LogbookPaginationResponse.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];
    final List<Map<String, dynamic>> list = rawData is List
        ? rawData
            .map((e) => e is Map<String, dynamic>
                ? e
                : Map<String, dynamic>.from(e as Map))
            .toList()
        : [];

    final rawPagination = json['pagination'] as Map<String, dynamic>? ?? {};
    final totalCount = (json['total'] as num?)?.toInt() ?? list.length;

    return LogbookPaginationResponse(
      success: json['success'] == true,
      total: totalCount,
      data: list,
      pagination: rawPagination.isNotEmpty
          ? PaginationMeta.fromJson(rawPagination)
          : PaginationMeta(
              page: 1,
              limit: list.isNotEmpty ? list.length : 10,
              total: totalCount,
              totalPages: 1,
            ),
    );
  }

  @override
  List<Object?> get props => [success, total, data, pagination];
}

/// Ringkasan statistik KPI logbook mahasiswa dari endpoint /mahasiswa/stats
class LogbookStats extends Equatable {
  final int total;
  final int pendingKetua;
  final int pendingDpl;
  final int approved;
  final int revisi;

  const LogbookStats({
    required this.total,
    required this.pendingKetua,
    required this.pendingDpl,
    required this.approved,
    required this.revisi,
  });

  factory LogbookStats.fromJson(Map<String, dynamic> json) {
    return LogbookStats(
      total: (json['total'] as num?)?.toInt() ??
          (json['totalSubmitted'] as num?)?.toInt() ??
          0,
      pendingKetua: (json['pendingKetua'] as num?)?.toInt() ??
          (json['menungguKetua'] as num?)?.toInt() ??
          0,
      pendingDpl: (json['pendingDpl'] as num?)?.toInt() ??
          (json['menungguDpl'] as num?)?.toInt() ??
          0,
      approved: (json['approved'] as num?)?.toInt() ??
          (json['disetujui'] as num?)?.toInt() ??
          0,
      revisi: (json['revisi'] as num?)?.toInt() ??
          (json['perluRevisi'] as num?)?.toInt() ??
          0,
    );
  }

  @override
  List<Object?> get props => [total, pendingKetua, pendingDpl, approved, revisi];
}
