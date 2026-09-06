/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Factory & Implementasi Adapter Vendor AI (Mock + HTTP Vendor Ready)
 */
import { v4 as uuidv4 } from "uuid";
/**
 * Mock AI Adapter untuk lingkungan Development & Testing
 */
export class MockWasteAiAdapter {
    async classifyWaste(payload) {
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
export class VendorWasteAiAdapter {
    endpoint;
    apiKey;
    constructor(endpoint, apiKey) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }
    async classifyWaste(payload) {
        if (!this.endpoint) {
            throw new Error("AI_VENDOR_ENDPOINT_MISSING");
        }
        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    imageUrl: payload.imageUrl,
                    clientApp: "Trashcare-Bandung",
                }),
            });
            if (!response.ok) {
                throw new Error(`AI Vendor returned HTTP ${response.status}`);
            }
            const data = (await response.json());
            return {
                requestId: data.requestId || uuidv4(),
                detectedType: data.label || data.detectedType || "organik",
                confidenceScore: Number(data.confidence || data.confidenceScore || 0.9),
                estimatedVolumeLiter: Number(data.volumeLiter || 2.0),
                detections: data.detections || [],
                vendorName: data.vendorName || "ExternalVendorAI",
                rawPayload: data,
            };
        }
        catch (error) {
            console.error("[VendorWasteAiAdapter] Error calling vendor AI API:", error.message);
            // Fallback to Mock if vendor call fails
            const fallback = new MockWasteAiAdapter();
            return fallback.classifyWaste(payload);
        }
    }
}
/**
 * Factory untuk memilih adapter berdasarkan environment variable `AI_VENDOR_PROVIDER`
 */
export class WasteAiAdapterFactory {
    static getAdapter() {
        const provider = process.env.AI_VENDOR_PROVIDER || "MOCK";
        if (provider === "VENDOR") {
            const endpoint = process.env.AI_VENDOR_ENDPOINT || "";
            const apiKey = process.env.AI_VENDOR_API_KEY || "";
            return new VendorWasteAiAdapter(endpoint, apiKey);
        }
        return new MockWasteAiAdapter();
    }
}
