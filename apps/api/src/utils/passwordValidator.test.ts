/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Unit Test: Password Validation Engine
 */

import { describe, it, expect } from "vitest";
import { isPasswordValid, strongPasswordSchema } from "./passwordValidator.js";

describe("Password Validator Engine", () => {
  it("harus menolak kata sandi kurang dari 8 karakter", () => {
    const result = isPasswordValid("Abc12");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("minimal 8 karakter");
  });

  it("harus menolak kata sandi tanpa huruf (hanya angka)", () => {
    const result = isPasswordValid("12345678");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("minimal 1 huruf");
  });

  it("harus menolak kata sandi tanpa angka (hanya huruf)", () => {
    const result = isPasswordValid("abcdefgh");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("minimal 1 angka");
  });

  it("harus menerima kata sandi valid dengan huruf dan angka", () => {
    const result = isPasswordValid("Coblong2026");
    expect(result.ok).toBe(true);
  });

  it("harus memvalidasi dengan benar menggunakan strongPasswordSchema (Zod)", () => {
    const valid = strongPasswordSchema.safeParse("Password123");
    expect(valid.success).toBe(true);

    const invalidShort = strongPasswordSchema.safeParse("Pass1");
    expect(invalidShort.success).toBe(false);

    const invalidNoNum = strongPasswordSchema.safeParse("PasswordLong");
    expect(invalidNoNum.success).toBe(false);

    const invalidNoLetter = strongPasswordSchema.safeParse("123456789");
    expect(invalidNoLetter.success).toBe(false);
  });
});
