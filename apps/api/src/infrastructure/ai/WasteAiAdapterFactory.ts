/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Factory & Implementasi Adapter Vendor AI (Mock + HTTP Vendor Ready)
 */

import { v4 as uuidv4 } from "uuid";
import {
  IWasteAiAdapter,
  AiClassificationRequest,
  AiClassificationResponse,
} from "../../domain/interfaces/IWasteAiAdapter.js";

/**
 * Mock AI Adapter untuk lingkungan Development & Testing
 */
export class MockWasteAiAdapter implements IWasteAiAdapter {
  async classifyWaste(payload: AiClassificationRequest): Promise<AiClassificationResponse> {
    // Generate deterministic mock based on image URL or random confidence >= 0.90
    const isOrganic = !payload.imageUrl.toLowerCase().includes("anorganik");
    const detectedType = isOrganic ? "organik" : "anorganik";
    const confidenceScore = 0.94;
    const estimatedVolumeLiter = 2.5;

    return {
      requestId: uuidv4(),
      detectedType,
      confidenceScore,
      estimatedVolumeLiter,
      detections: [
        {
          detectedType,
          volumeEstimate: estimatedVolumeLiter,
          confidence: confidenceScore,
        },
      ],
      vendorName: "MockInternalAI-v1",
    };
  }
}

/**
 * Industry External AI Vendor Adapter (Dua Arah / Configurable Endpoint)
 */
export class VendorWasteAiAdapter implements IWasteAiAdapter {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async classifyWaste(payload: AiClassificationRequest): Promise<AiClassificationResponse> {
    if (!this.endpoint) {
      throw new Error("AI_VENDOR_ENDPOINT_MISSING");
    }

    try {
      const formData = new FormData();
      const fs = await import("fs");
      const path = await import("path");

      let resolvedPath = payload.imagePath ? path.resolve(payload.imagePath) : "";
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        if (payload.imageUrl && !payload.imageUrl.startsWith("http")) {
          const cleanUrl = payload.imageUrl.replace(/^\/?uploads\//, "");
          const candidatePath = path.resolve(process.cwd(), "uploads", cleanUrl);
          if (fs.existsSync(candidatePath)) {
            resolvedPath = candidatePath;
          }
        }
      }

      if (resolvedPath && fs.existsSync(resolvedPath)) {
        const fileBuffer = fs.readFileSync(resolvedPath);
        formData.append("image", new Blob([new Uint8Array(fileBuffer)], { type: "image/jpeg" }), "waste.jpg");
      } else if (payload.imageUrl && payload.imageUrl.startsWith("http")) {
        const imgResp = await fetch(payload.imageUrl);
        const arrayBuf = await imgResp.arrayBuffer();
        formData.append("image", new Blob([arrayBuf], { type: "image/jpeg" }), "waste.jpg");
      } else {
        throw new Error("IMAGE_UNREADABLE");
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errData = (await response.json().catch(() => ({}))) as any;
          if (errData?.detail === "NO_WASTE_DETECTED") {
            throw new Error("NO_WASTE_DETECTED");
          }
          if (errData?.detail === "IMAGE_UNREADABLE") {
            throw new Error("IMAGE_UNREADABLE");
          }
        }
        throw new Error(`AI Vendor returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const detUpper = String(data.detectedType || "").toUpperCase();
      const orgPct =
        data.organik_percent !== undefined
          ? Number(data.organik_percent)
          : detUpper === "ORGANIC" || detUpper === "ORGANIK"
          ? 95
          : 5;
      const inorgPct =
        data.non_organik_percent !== undefined
          ? Number(data.non_organik_percent)
          : 100 - orgPct;
      const isOrganic = orgPct >= inorgPct;

      return {
        requestId: data.requestId || uuidv4(),
        detectedType: isOrganic ? "ORGANIC" : "NON_ORGANIC",
        confidenceScore: Number(data.confidenceScore || Math.max(orgPct, inorgPct) / 100),
        estimatedVolumeLiter: Number(data.estimatedVolumeLiter || 2.0),
        detections: data.detections || [],
        vendorName: data.vendorName || "BERSEKA-v3c",
        annotatedImageBase64: data.annotatedImageBase64,
        rawPayload: {
          ...data,
          organik_percent: orgPct,
          non_organik_percent: inorgPct,
        },
      };
    } catch (error: any) {
      if (error.message === "NO_WASTE_DETECTED" || error.message === "IMAGE_UNREADABLE") {
        throw error;
      }
      console.error("[VendorWasteAiAdapter] Error calling vendor AI API:", error.message);
      throw error;
    }
  }
}

/**
 * Factory untuk memilih adapter berdasarkan environment variable `AI_VENDOR_PROVIDER`
 */
export class WasteAiAdapterFactory {
  static getAdapter(): IWasteAiAdapter {
    const provider = process.env.AI_VENDOR_PROVIDER || "MOCK";
    if (provider === "VENDOR") {
      const endpoint = process.env.AI_VENDOR_ENDPOINT || "";
      const apiKey = process.env.AI_VENDOR_API_KEY || "";
      return new VendorWasteAiAdapter(endpoint, apiKey);
    }
    return new MockWasteAiAdapter();
  }
}
