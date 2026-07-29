/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { pengangkutanService } from "./pengangkutanService.js";
import { PrismaClient, DispatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

describe("Pengangkutan Service CRUD Tests", () => {
  let bin: any;
  let petugas: any;

  beforeAll(async () => {
    await prisma.dispatchTask.deleteMany({});
    bin = await prisma.bin.findFirst({
      where: {
        status: "ACTIVE_BOUND",
      },
    });

    // If no active bin, find any bin or create a mock one
    if (!bin) {
      bin = await prisma.bin.findFirst();
    }

    petugas = await prisma.user.findFirst({
      where: {
        role: {
          name: "PETUGAS_RESIDU",
        },
      },
    });
  });

  it("should perform full CRUD on dispatch tasks", async () => {
    if (!bin) {
      console.warn("Skipping test because no Bin exists in the DB");
      return;
    }

    // 1. Create
    const created = await pengangkutanService.create({
      binId: bin.id,
      status: "PENDING",
      claimedByUserId: petugas?.id || undefined,
    });

    expect(created).toHaveProperty("id");
    expect(created.status).toBe(DispatchStatus.PENDING);
    if (petugas) {
      expect(created.claimedByUserId).toBe(petugas.id);
    }

    // 2. Read All
    const all = await pengangkutanService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);

    // 3. Read One
    const one = await pengangkutanService.getById(created.id);
    expect(one.status).toBe(DispatchStatus.PENDING);

    // 4. Update
    const updated = await pengangkutanService.update(created.id, {
      status: "CLAIMED",
    });
    expect(updated.status).toBe(DispatchStatus.CLAIMED);

    // 5. Delete
    await pengangkutanService.delete(created.id);
    await expect(pengangkutanService.getById(created.id)).rejects.toThrow();
  });
});
