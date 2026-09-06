/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { redisService } from "./redisService.js";

const prisma = new PrismaClient();

export class ConfigService {
  /**
   * Get configuration parameter by key with Redis caching
   */
  async getConfig(key: string): Promise<string> {
    const cached = await redisService.getConfigCache(key);
    if (cached !== null) {
      return cached;
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    const val = config ? config.value : "";
    await redisService.setConfigCache(key, val);
    return val;
  }

  /**
   * Update configuration parameter & invalidate Redis cache
   */
  async updateConfig(key: string, value: string): Promise<any> {
    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value, tipe: "string", deskripsi: "" },
    });

    await redisService.invalidateConfigCache(key);
    return updated;
  }

  /**
   * Get all configuration parameters
   */
  async getAllConfigs() {
    return prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
    });
  }
}

export const configService = new ConfigService();
