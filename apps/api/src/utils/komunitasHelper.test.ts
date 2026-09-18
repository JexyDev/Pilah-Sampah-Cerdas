import { describe, it, expect } from "vitest";
import { generateWargaBersekaId, generateKomunitasId } from "./komunitasHelper.js";

describe("komunitasHelper - generateWargaBersekaId", () => {
  it("should generate ID in exact WB-PPKKCCXXXNNNNN format", () => {
    const id = generateWargaBersekaId({
      provinsiKode: "32",
      kabupatenKode: "73",
      kecamatanKode: "02",
      phone: "081234567321",
      sequenceNumber: 1,
    });

    expect(id).toBe("WB-32730232100001");
  });

  it("should handle full Kemendagri codes by slicing last 2 digits", () => {
    const id = generateWargaBersekaId({
      provinsiKode: "32",
      kabupatenKode: "32.73",
      kecamatanKode: "32.73.02",
      phone: "089876543456",
      sequenceNumber: 25,
    });

    expect(id).toBe("WB-32730245600025");
  });

  it("should fallback to default codes when values are null/empty", () => {
    const id = generateWargaBersekaId({
      provinsiKode: null,
      kabupatenKode: null,
      kecamatanKode: null,
      phone: null,
      sequenceNumber: 1,
    });

    expect(id).toBe("WB-32730200000001");
  });

  it("should generate random KOM-XXXXXX for legacy helper", () => {
    const id = generateKomunitasId();
    expect(id).toMatch(/^KOM-[A-Z0-9]{6}$/);
  });
});
