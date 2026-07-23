/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import api from "./api";

export interface SetorPayload {
  qrCode: string;
  detectedType: string;
  estimatedVolume: number;
  householdId: string;
}

export const setorSampah = async (payload: any) => {
  try {
    const response = await api.post(`/bins/scan`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error setor sampah:", error);
    // Return standard error shape if available
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw error;
  }
};
