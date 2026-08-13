/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { pemanfaatanService } from "./pemanfaatanService.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Pemanfaatan Service CRUD Tests", () => {
  let rtRwArea: any;

  beforeAll(async () => {
    await prisma.pemanfaatan.deleteMany({});
    rtRwArea = await prisma.rw.findFirst();
  });

  it("should perform full CRUD on pemanfaatan program", async () => {
    // 1. Create
    const created = await pemanfaatanService.create({
      rwId: rtRwArea.id,
      nomorCaraPemanfaatan: `CARA-${Date.now()}`,
      program: "BURUAN_SAE",
      teknologi: "Kompos Sirkular",
      bahanBaku: "Sampah Organik",
      volumeBahanBaku: 50.5,
      unitBahanBaku: "Kg",
      hasil: 10.0,
      unitHasil: "Kg",
      fotoDokumentasiUrl: "https://picsum.photos/400/300",
      tanggalPencatatan: new Date(),
    });

    expect(created).toHaveProperty("id");
    expect(created.program).toBe("BURUAN_SAE");

    // 2. Read All
    const all = await pemanfaatanService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);

    // 3. Read One
    const one = await pemanfaatanService.getById(created.id);
    expect(one.teknologi).toBe("Kompos Sirkular");

    // 4. Update
    const updated = await pemanfaatanService.update(created.id, {
      teknologi: "Kompos Sirkular Diperbarui",
    });
    expect(updated.teknologi).toBe("Kompos Sirkular Diperbarui");

    // 5. Delete
    await pemanfaatanService.delete(created.id);
    await expect(pemanfaatanService.getById(created.id)).rejects.toThrow();
  });
});
