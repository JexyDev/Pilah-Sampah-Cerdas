/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import api from "./api";

export const predictWaste = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    // 1. Upload the image file to the backend
    const uploadResponse = await api.post("/waste/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const imageUrl = uploadResponse.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error("Gagal mendapatkan URL gambar hasil unggah.");
    }

    // 2. Perform AI detection using the uploaded image URL
    const response = await api.post(`/waste/detect-mock`, { imageUrl });

    const raw = response.data.data;
    return {
      jenis_sampah: raw.detectedType,
      estimasi_volume: raw.volumeEstimate,
      confidence: raw.confidence,
      quotaRemaining: raw.quotaRemaining,
      detections: raw.detections,
    };
  } catch (error) {
    console.error("Error predicting waste:", error);
    throw error;
  }
};
