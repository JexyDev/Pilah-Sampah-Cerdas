/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * OTP Service — Kirim & verifikasi kode OTP via WhatsApp (Fonnte API)
 *
 * Alur: requestOtp → simpan di Redis/memory (TTL 5 menit) → user input → verifyOtp
 * Setelah verifikasi: resetPassword (hash baru, simpan ke DB)
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/hashUtils.js";

const prisma = new PrismaClient();

/** ─── In-memory OTP store (fallback jika Redis offline) ─── */
const memStore = new Map<string, { value: string; expiresAt: number }>();

function memSet(key: string, value: string, ttlSec: number): void {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memDel(key: string): void {
  memStore.delete(key);
}

/** ─── Util: Format nomor ke +628xxx ─── */
function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("08")) p = "+62" + p.slice(1);
  else if (p.startsWith("628") && !p.startsWith("+")) p = "+" + p;
  else if (p.startsWith("8")) p = "+62" + p;
  return p;
}

/** ─── Generate 6-digit OTP numerik ─── */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** ─── Kirim pesan WA via Fonnte API ─── */
async function sendFonnteMessage(phone: string, message: string): Promise<boolean> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    // ponytail: FONNTE_TOKEN belum diset — OTP muncul di devOtp saat development
    console.warn("[OTP] FONNTE_TOKEN tidak diset di .env — OTP tidak terkirim via WhatsApp.");
    return false;
  }

  // Fonnte menerima format 628xxx (tanpa +)
  const fonnteDest = phone.replace(/^\+/, "");

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: fonnteDest,
        message,
        countryCode: "62",
      }),
    });

    const data = (await res.json()) as { status?: boolean; detail?: string };
    if (!data.status) {
      console.error("[OTP] Fonnte API error:", data.detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[OTP] Gagal menghubungi Fonnte:", err);
    return false;
  }
}

export class OtpService {
  private readonly OTP_TTL = 300; // 5 menit
  private readonly RESET_TTL = 600; // 10 menit

  /**
   * Minta OTP reset password via WhatsApp.
   * Validasi: nomor harus terdaftar & aktif di database.
   * @returns { sent, devOtp? } — devOtp hanya di NODE_ENV !== "production"
   */
  async requestOtp(phone: string): Promise<{ sent: boolean; devOtp?: string }> {
    const normalized = normalizePhone(phone);

    const user = await prisma.user.findFirst({
      where: { phone: normalized },
      select: { id: true, name: true, status: true },
    });

    if (!user) {
      throw new Error("PHONE_NOT_REGISTERED");
    }
    if (user.status !== "Aktif" && user.status !== "ACTIVE") {
      throw new Error("USER_INACTIVE");
    }

    const otp = generateOtp();
    memSet("otp:reset:" + normalized, otp, this.OTP_TTL);

    const message =
      `*TrashCare — Kode OTP Reset Kata Sandi*\n\n` +
      `Kode OTP Anda: *${otp}*\n\n` +
      `Kode ini berlaku selama *5 menit*.\n` +
      `Jangan bagikan kode ini kepada siapapun.\n\n` +
      `Jika Anda tidak meminta reset kata sandi, abaikan pesan ini.`;

    const sent = await sendFonnteMessage(normalized, message);

    if (process.env.NODE_ENV !== "production") {
      return { sent, devOtp: otp };
    }
    return { sent };
  }

  /**
   * Verifikasi kode OTP.
   * @returns { resetToken } — token sementara 10 menit untuk reset password
   */
  async verifyOtp(phone: string, otp: string): Promise<{ resetToken: string }> {
    const normalized = normalizePhone(phone);
    const stored = memGet("otp:reset:" + normalized);

    if (!stored) {
      throw new Error("OTP_EXPIRED");
    }
    if (stored !== otp.trim()) {
      throw new Error("OTP_INVALID");
    }

    // Hapus OTP agar single-use
    memDel("otp:reset:" + normalized);

    const resetToken =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    memSet("reset:token:" + normalized, resetToken, this.RESET_TTL);

    return { resetToken };
  }

  /**
   * Reset password dengan token hasil verifikasi OTP.
   */
  async resetPassword(
    phone: string,
    resetToken: string,
    newPassword: string
  ): Promise<void> {
    const normalized = normalizePhone(phone);
    const stored = memGet("reset:token:" + normalized);

    if (!stored || stored !== resetToken) {
      throw new Error("RESET_TOKEN_INVALID");
    }
    if (newPassword.length < 8) {
      throw new Error("PASSWORD_TOO_SHORT");
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.updateMany({
      where: { phone: normalized },
      data: { password: hashed },
    });

    memDel("reset:token:" + normalized);
  }
}

export const otpService = new OtpService();
