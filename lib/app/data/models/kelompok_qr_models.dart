// d:/berseka/mobile/lib/app/data/models/kelompok_qr_models.dart

class KelompokQrResponse {
  final bool success;
  final String message;
  final KelompokQrData? data;

  KelompokQrResponse({required this.success, required this.message, this.data});

  factory KelompokQrResponse.fromJson(Map<String, dynamic> json) {
    return KelompokQrResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null ? KelompokQrData.fromJson(json['data']) : null,
    );
  }
}

class KelompokQrData {
  final KelompokInfoData kelompok;
  final KuotaQrData kuota;
  final ExportEndpointsData exportEndpoints;
  final PetunjukPercetakanData petunjukUntukPercetakan;
  final List<StikerQrItem> items;

  KelompokQrData({
    required this.kelompok,
    required this.kuota,
    required this.exportEndpoints,
    required this.petunjukUntukPercetakan,
    required this.items,
  });

  factory KelompokQrData.fromJson(Map<String, dynamic> json) {
    return KelompokQrData(
      kelompok: KelompokInfoData.fromJson(json['kelompok'] ?? {}),
      kuota: KuotaQrData.fromJson(json['kuota'] ?? {}),
      exportEndpoints: ExportEndpointsData.fromJson(
        json['exportEndpoints'] ?? {},
      ),
      petunjukUntukPercetakan: PetunjukPercetakanData.fromJson(
        json['petunjukUntukPercetakan'] ?? {},
      ),
      items:
          (json['items'] as List?)
              ?.map((e) => StikerQrItem.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class KelompokInfoData {
  final String id;
  final String nama;
  final String kelurahan;
  final List<String> cakupanRw;
  final String dpl;
  final String dplPhone;

  KelompokInfoData({
    required this.id,
    required this.nama,
    required this.kelurahan,
    required this.cakupanRw,
    required this.dpl,
    required this.dplPhone,
  });

  factory KelompokInfoData.fromJson(Map<String, dynamic> json) {
    return KelompokInfoData(
      id: json['id'] ?? '',
      nama: json['nama'] ?? '',
      kelurahan: json['kelurahan'] ?? '',
      cakupanRw:
          (json['cakupanRw'] as List?)?.map((e) => e.toString()).toList() ?? [],
      dpl: json['dpl'] ?? '',
      dplPhone: json['dplPhone'] ?? '',
    );
  }
}

class KuotaQrData {
  final int targetTotal;
  final int totalBins;
  final int organikCount;
  final int anorganikCount;
  final int tersediaBelumTerpakai;
  final int sudahTerikatWarga;
  final String statusKelengkapan;

  KuotaQrData({
    required this.targetTotal,
    required this.totalBins,
    required this.organikCount,
    required this.anorganikCount,
    required this.tersediaBelumTerpakai,
    required this.sudahTerikatWarga,
    required this.statusKelengkapan,
  });

  factory KuotaQrData.fromJson(Map<String, dynamic> json) {
    return KuotaQrData(
      targetTotal: json['targetTotal'] ?? 0,
      totalBins: json['totalBins'] ?? 0,
      organikCount: json['organikCount'] ?? 0,
      anorganikCount: json['anorganikCount'] ?? 0,
      tersediaBelumTerpakai: json['tersediaBelumTerpakai'] ?? 0,
      sudahTerikatWarga: json['sudahTerikatWarga'] ?? 0,
      statusKelengkapan: json['statusKelengkapan'] ?? '',
    );
  }
}

class ExportEndpointsData {
  final String exportPrintHtml;

  ExportEndpointsData({required this.exportPrintHtml});

  factory ExportEndpointsData.fromJson(Map<String, dynamic> json) {
    return ExportEndpointsData(exportPrintHtml: json['exportPrintHtml'] ?? '');
  }
}

class PetunjukPercetakanData {
  final String standarUkuran;
  final String bahanRekomendasi;
  final String metodeCetak;

  PetunjukPercetakanData({
    required this.standarUkuran,
    required this.bahanRekomendasi,
    required this.metodeCetak,
  });

  factory PetunjukPercetakanData.fromJson(Map<String, dynamic> json) {
    return PetunjukPercetakanData(
      standarUkuran: json['standarUkuran'] ?? '',
      bahanRekomendasi: json['bahanRekomendasi'] ?? '',
      metodeCetak: json['metodeCetak'] ?? '',
    );
  }
}

class StikerQrItem {
  final String id;
  final int nomorUrut;
  final String qrCode;
  final String jenis;
  final String kategoriNama;
  final String warnaLabel;
  final String hexColor;
  final String status;
  final bool isAvailable;
  final WargaTerikatData? terikatWarga;
  final String? tanggalAktivasi;
  final SpesifikasiStikerData spesifikasiStiker;
  final AsetUrlData asetUrl;

  StikerQrItem({
    required this.id,
    required this.nomorUrut,
    required this.qrCode,
    required this.jenis,
    required this.kategoriNama,
    required this.warnaLabel,
    required this.hexColor,
    required this.status,
    required this.isAvailable,
    this.terikatWarga,
    this.tanggalAktivasi,
    required this.spesifikasiStiker,
    required this.asetUrl,
  });

  factory StikerQrItem.fromJson(Map<String, dynamic> json) {
    return StikerQrItem(
      id: json['id'] ?? '',
      nomorUrut: json['nomorUrut'] ?? 0,
      qrCode: json['qrCode'] ?? '',
      jenis: json['jenis'] ?? '',
      kategoriNama: json['kategoriNama'] ?? '',
      warnaLabel: json['warnaLabel'] ?? '',
      hexColor: json['hexColor'] ?? '',
      status: json['status'] ?? '',
      isAvailable: json['isAvailable'] ?? false,
      terikatWarga: json['terikatWarga'] != null
          ? WargaTerikatData.fromJson(json['terikatWarga'])
          : null,
      tanggalAktivasi: json['tanggalAktivasi'],
      spesifikasiStiker: SpesifikasiStikerData.fromJson(
        json['spesifikasiStiker'] ?? {},
      ),
      asetUrl: AsetUrlData.fromJson(json['asetUrl'] ?? {}),
    );
  }
}

class WargaTerikatData {
  final String id;
  final String nama;
  final String telepon;
  final String alamat;

  WargaTerikatData({
    required this.id,
    required this.nama,
    required this.telepon,
    required this.alamat,
  });

  factory WargaTerikatData.fromJson(Map<String, dynamic> json) {
    return WargaTerikatData(
      id: json['id'] ?? '',
      nama: json['nama'] ?? '',
      telepon: json['telepon'] ?? '',
      alamat: json['alamat'] ?? '',
    );
  }
}

class SpesifikasiStikerData {
  final String ukuranCm;
  final int lebarMm;
  final int tinggiMm;
  final String resolusiPixel;
  final String orientasi;

  SpesifikasiStikerData({
    required this.ukuranCm,
    required this.lebarMm,
    required this.tinggiMm,
    required this.resolusiPixel,
    required this.orientasi,
  });

  factory SpesifikasiStikerData.fromJson(Map<String, dynamic> json) {
    return SpesifikasiStikerData(
      ukuranCm: json['ukuranCm'] ?? '',
      lebarMm: json['lebarMm'] ?? 0,
      tinggiMm: json['tinggiMm'] ?? 0,
      resolusiPixel: json['resolusiPixel'] ?? '',
      orientasi: json['orientasi'] ?? '',
    );
  }
}

class AsetUrlData {
  final String qrCodeSvg;
  final String templateBackgroundUrl;

  AsetUrlData({required this.qrCodeSvg, required this.templateBackgroundUrl});

  factory AsetUrlData.fromJson(Map<String, dynamic> json) {
    return AsetUrlData(
      qrCodeSvg: json['qrCodeSvg'] ?? '',
      templateBackgroundUrl: json['templateBackgroundUrl'] ?? '',
    );
  }
}
