import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../lib/prisma.js";
import { pemanfaatanService } from "./pemanfaatanService.js";

describe("Pemanfaatan Service CRUD & Business Logic Tests", () => {
  let rtRwArea: any;
  let testUser: any;

  beforeAll(async () => {
    await prisma.kritikSaranPemanfaatan.deleteMany({});
    await prisma.pemanfaatan.deleteMany({});
    rtRwArea = await prisma.rw.findFirst();
    testUser = await prisma.user.findFirst();
  });

  it("should perform full CRUD on pemanfaatan program with economic valuation and sanitization", async () => {
    // 1. Create with XSS script in program name
    const created = await pemanfaatanService.create({
      rwId: rtRwArea.id,
      nomorCaraPemanfaatan: `CARA-${Date.now()}`,
      program: "<script>alert('xss')</script>BURUAN_SAE",
      teknologi: "Kompos Organik",
      bahanBaku: "Sampah Organik Dapur",
      volumeBahanBaku: 50.0,
      unitBahanBaku: "Kg",
      hasil: 10.0,
      unitHasil: "Kg",
      fotoDokumentasiUrl: "https://picsum.photos/400/300",
      tanggalPencatatan: new Date(),
    });

    expect(created).toHaveProperty("id");
    // Sanitized: script tag stripped
    expect(created.namaProgram).not.toContain("<script>");
    expect(created.namaProgram).toContain("BURUAN_SAE");
    // Economic valuation calculated: 10 kg * Rp 2.500 = Rp 25.000
    expect(created.nilaiEkonomiRp).toBe(25000);

    // 2. Read All
    const all = await pemanfaatanService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);

    // 3. Read One
    const one = await pemanfaatanService.getById(created.id);
    expect(one.jenisProgram).toBe("Kompos Organik");
    expect(one.nilaiEkonomiRp).toBe(25000);

    // 4. Update
    const updated = await pemanfaatanService.update(created.id, {
      teknologi: "Maggot BSF",
      hasil: 20.0,
    });
    expect(updated.jenisProgram).toBe("Maggot BSF");
    // 20 kg Maggot * Rp 8.000 = Rp 160.000
    expect(updated.nilaiEkonomiRp).toBe(160000);

    // 5. Delete
    await pemanfaatanService.delete(created.id);
    await expect(pemanfaatanService.getById(created.id)).rejects.toThrow();
  });

  it("should perform full feedback lifecycle with rating bounds and authorization checks", async () => {
    if (!testUser) return;

    // 1. Create feedback with rating clamping
    const feedback = await pemanfaatanService.createFeedback(testUser.id, {
      judul: "<b>Usulan Komposter RW 01</b>",
      kategori: "Pengolahan Kompos",
      isiKritikSaran: "Mohon ditambah kapasitas bak komposter di pos RW.",
      rating: 10, // Should be clamped to 5
      rwId: rtRwArea?.id,
    });

    expect(feedback).toHaveProperty("id");
    expect(feedback.rating).toBe(5);
    expect(feedback.judul).not.toContain("<b>");
    expect(feedback.status).toBe("MENUNGGU");

    // 2. Read feedbacks
    const feedbackList = await pemanfaatanService.getAllFeedback({ kategori: "Pengolahan Kompos" });
    expect(feedbackList.length).toBeGreaterThanOrEqual(1);

    // 3. Respond feedback
    const responded = await pemanfaatanService.respondFeedback(feedback.id, {
      tanggapan: "Terima kasih, tim DLH akan meninjau lokasi penambahan.",
      ditanggapiOleh: "Pengelola BERSEKA RW 01",
      status: "SELESAI",
    });
    expect(responded.status).toBe("SELESAI");
    expect(responded.tanggapan).toContain("tim DLH akan meninjau");

    // 4. Authorization check on delete (random unauthorized user)
    await expect(
      pemanfaatanService.deleteFeedback(feedback.id, {
        userId: "unauthorized-user-id",
        role: "WARGA",
      })
    ).rejects.toThrow("FORBIDDEN_DELETE_FEEDBACK");

    // 5. Delete by author or admin
    await pemanfaatanService.deleteFeedback(feedback.id, {
      userId: testUser.id,
      role: "WARGA",
    });
  });
});
