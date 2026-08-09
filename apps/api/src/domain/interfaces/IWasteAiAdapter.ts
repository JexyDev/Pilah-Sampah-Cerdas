/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Interface Adapter Kontrak AI Klasifikasi Sampah (Vendor-Agnostic)
 */

export interface AiClassificationRequest {
  imageUrl: string;
  userId?: string;
  imagePath?: string;
}

export interface WasteDetectionItem {
  detectedType: "organik" | "anorganik" | "residu" | string;
  volumeEstimate: number; // liter / kg
  confidence: number; // 0.0 - 1.0
}

export interface AiClassificationResponse {
  requestId: string;
  detectedType: "organik" | "anorganik" | "residu" | "tidak_terdeteksi" | string;
  confidenceScore: number; // 0.0 - 1.0
  estimatedVolumeLiter: number;
  detections: WasteDetectionItem[];
  vendorName: string;
  rawPayload?: Record<string, any>;
}

export interface IWasteAiAdapter {
  /**
   * Mengklasifikasikan foto sampah menjadi organik/anorganik + volume + confidence
   */
  classifyWaste(payload: AiClassificationRequest): Promise<AiClassificationResponse>;
}
