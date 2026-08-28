import 'package:equatable/equatable.dart';

class ActiveTimelineResponse extends Equatable {
  final bool success;
  final String message;
  final TimelineSummaryData? summary;
  final ActiveFaseSummary? activeFaseSummary;
  final ActiveStageData? data;

  const ActiveTimelineResponse({
    required this.success,
    required this.message,
    this.summary,
    this.activeFaseSummary,
    this.data,
  });

  factory ActiveTimelineResponse.fromJson(Map<String, dynamic> json) {
    try {
      return ActiveTimelineResponse(
        success: json['success'] ?? false,
        message: json['message'] ?? '',
        summary: json['summary'] != null ? TimelineSummaryData.fromJson(json['summary']) : null,
        activeFaseSummary: json['activeFaseSummary'] != null ? ActiveFaseSummary.fromJson(json['activeFaseSummary']) : null,
        data: json['data'] != null ? ActiveStageData.fromJson(json['data']) : null,
      );
    } catch (e, st) {
      print('Error parsing ActiveTimelineResponse: $e\n$st');
      rethrow;
    }
  }

  @override
  List<Object?> get props => [success, message, summary, activeFaseSummary, data];
}

class TimelineSummaryData extends Equatable {
  final int totalTahapan;
  final int totalSelesai;
  final int totalSedangBerjalan;
  final int totalBelumDimulai;
  final int progressPercentage;
  final String activeWeek;
  final String activeFase;
  final String activeStageId;
  final String activeStageTitle;
  final String todayDate;

  const TimelineSummaryData({
    required this.totalTahapan,
    required this.totalSelesai,
    required this.totalSedangBerjalan,
    required this.totalBelumDimulai,
    required this.progressPercentage,
    required this.activeWeek,
    required this.activeFase,
    required this.activeStageId,
    required this.activeStageTitle,
    required this.todayDate,
  });

  factory TimelineSummaryData.fromJson(Map<String, dynamic> json) {
    return TimelineSummaryData(
      totalTahapan: (json['totalTahapan'] as num?)?.toInt() ?? 0,
      totalSelesai: (json['totalSelesai'] as num?)?.toInt() ?? 0,
      totalSedangBerjalan: (json['totalSedangBerjalan'] as num?)?.toInt() ?? 0,
      totalBelumDimulai: (json['totalBelumDimulai'] as num?)?.toInt() ?? 0,
      progressPercentage: (json['progressPercentage'] as num?)?.toInt() ?? 0,
      activeWeek: json['activeWeek']?.toString() ?? '',
      activeFase: json['activeFase']?.toString() ?? '',
      activeStageId: json['activeStageId']?.toString() ?? '',
      activeStageTitle: json['activeStageTitle']?.toString() ?? '',
      todayDate: json['todayDate']?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props => [
        totalTahapan,
        totalSelesai,
        totalSedangBerjalan,
        totalBelumDimulai,
        progressPercentage,
        activeWeek,
        activeFase,
        activeStageId,
        activeStageTitle,
        todayDate,
      ];
}

class ActiveFaseSummary extends Equatable {
  final String fase;
  final int totalTahapan;
  final int totalSelesai;
  final int totalSedangBerjalan;
  final int progressPercentage;

  const ActiveFaseSummary({
    required this.fase,
    required this.totalTahapan,
    required this.totalSelesai,
    required this.totalSedangBerjalan,
    required this.progressPercentage,
  });

  factory ActiveFaseSummary.fromJson(Map<String, dynamic> json) {
    return ActiveFaseSummary(
      fase: json['fase']?.toString() ?? '',
      totalTahapan: (json['totalTahapan'] as num?)?.toInt() ?? 0,
      totalSelesai: (json['totalSelesai'] as num?)?.toInt() ?? 0,
      totalSedangBerjalan: (json['totalSedangBerjalan'] as num?)?.toInt() ?? 0,
      progressPercentage: (json['progressPercentage'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [fase, totalTahapan, totalSelesai, totalSedangBerjalan, progressPercentage];
}

class ActiveStageData extends Equatable {
  final String id;
  final int stageIndex;
  final int totalStages;
  final String tahapMinggu;
  final String tanggal;
  final String? startDate;
  final String? endDate;
  final String fase;
  final String kegiatanUtama;
  final String outputTarget;
  final String picKeterangan;
  final String statusPelaksanaan;
  final bool isCurrentActive;
  final List<String> rekomendasiAksi;
  final List<String> pertanyaanKritis;
  final List<String> tipsSukses;
  final List<String> checklist;
  final StageRef? nextStage;
  final StageRef? prevStage;

  const ActiveStageData({
    required this.id,
    required this.stageIndex,
    required this.totalStages,
    required this.tahapMinggu,
    required this.tanggal,
    this.startDate,
    this.endDate,
    required this.fase,
    required this.kegiatanUtama,
    required this.outputTarget,
    required this.picKeterangan,
    required this.statusPelaksanaan,
    required this.isCurrentActive,
    this.rekomendasiAksi = const [],
    this.pertanyaanKritis = const [],
    this.tipsSukses = const [],
    this.checklist = const [],
    this.nextStage,
    this.prevStage,
  });

  factory ActiveStageData.fromJson(Map<String, dynamic> json) {
    return ActiveStageData(
      id: json['id']?.toString() ?? '',
      stageIndex: (json['stageIndex'] as num?)?.toInt() ?? 0,
      totalStages: (json['totalStages'] as num?)?.toInt() ?? 0,
      tahapMinggu: json['tahapMinggu']?.toString() ?? '',
      tanggal: json['tanggal']?.toString() ?? '',
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      fase: json['fase']?.toString() ?? '',
      kegiatanUtama: json['kegiatanUtama']?.toString() ?? '',
      outputTarget: json['outputTarget']?.toString() ?? '',
      picKeterangan: json['picKeterangan']?.toString() ?? '',
      statusPelaksanaan: json['statusPelaksanaan']?.toString() ?? '',
      isCurrentActive: json['isCurrentActive'] == true || json['isCurrentActive'] == 'true',
      rekomendasiAksi: (json['rekomendasiAksi'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      pertanyaanKritis: (json['pertanyaanKritis'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      tipsSukses: (json['tipsSukses'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      checklist: (json['checklist'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      nextStage: json['nextStage'] != null ? StageRef.fromJson(json['nextStage']) : null,
      prevStage: json['prevStage'] != null ? StageRef.fromJson(json['prevStage']) : null,
    );
  }

  @override
  List<Object?> get props => [
        id,
        stageIndex,
        totalStages,
        tahapMinggu,
        tanggal,
        startDate,
        endDate,
        fase,
        kegiatanUtama,
        outputTarget,
        picKeterangan,
        statusPelaksanaan,
        isCurrentActive,
        rekomendasiAksi,
        pertanyaanKritis,
        tipsSukses,
        checklist,
        nextStage,
        prevStage,
      ];
}

class StageRef extends Equatable {
  final String id;
  final String tahapMinggu;
  final String tanggal;
  final String fase;
  final String kegiatanUtama;
  final String statusPelaksanaan;

  const StageRef({
    required this.id,
    required this.tahapMinggu,
    required this.tanggal,
    required this.fase,
    required this.kegiatanUtama,
    required this.statusPelaksanaan,
  });

  factory StageRef.fromJson(Map<String, dynamic> json) {
    return StageRef(
      id: json['id']?.toString() ?? '',
      tahapMinggu: json['tahapMinggu']?.toString() ?? '',
      tanggal: json['tanggal']?.toString() ?? '',
      fase: json['fase']?.toString() ?? '',
      kegiatanUtama: json['kegiatanUtama']?.toString() ?? '',
      statusPelaksanaan: (json['statusPelaksanaan'] ?? json['status'])?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props => [id, tahapMinggu, tanggal, fase, kegiatanUtama, statusPelaksanaan];
}
