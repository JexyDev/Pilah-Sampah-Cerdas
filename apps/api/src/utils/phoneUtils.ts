/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Helper untuk menstandardisasi format nomor telepon / WhatsApp ke format internasional +62.
 * Contoh:
 * - "0812001060" -> "+62812001060"
 * - "62812001060" -> "+62812001060"
 * - "+62812001060" -> "+62812001060"
 */

export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+62" + cleaned.slice(1);
  } else if (cleaned.startsWith("62")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+62") && cleaned.startsWith("8")) {
    cleaned = "+62" + cleaned;
  }
  return cleaned;
}
