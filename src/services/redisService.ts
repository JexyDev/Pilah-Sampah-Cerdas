/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

class RedisService {
  private client: any;
  private isConnected = false;
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: Function;
    reject: Function;
  }> = [];
  private processing = 0;
  private MAX_CONCURRENT = 5; // Process up to 5 concurrent AI detections

  // Fallback in-memory storage if Redis is offline
  private memoryQuota: Record<string, number> = {};

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err: any) => {
      console.warn("Redis connection error, falling back to in-memory mode:", err.message);
      this.isConnected = false;
    });

    try {
      await this.client.connect();
      console.log("Redis connected successfully.");
      this.isConnected = true;
    } catch {
      console.warn("Could not connect to Redis. Running in-memory mode.");
      this.isConnected = false;
    }
  }

  // Check and decrement daily quota
  async checkAndUseQuota(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const key = `quota:${userId}:${today}`;
    const limit = 50; // Max 50 request AI per day

    if (this.isConnected) {
      try {
        const countStr = await this.client.get(key);
        const count = countStr ? parseInt(countStr, 10) : 0;
        if (count >= limit) {
          return false;
        }
        await this.client.set(key, (count + 1).toString(), {
          EX: 86400, // Expire in 1 day
        });
        return true;
      } catch (err) {
        console.error("Redis error checking quota, using memory fallback", err);
      }
    }

    // In-memory fallback
    const memKey = `${userId}:${today}`;
    const count = this.memoryQuota[memKey] || 0;
    if (count >= limit) {
      return false;
    }
    this.memoryQuota[memKey] = count + 1;
    return true;
  }

  // Get remaining quota for the user today
  async getRemainingQuota(userId: string): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const key = `quota:${userId}:${today}`;
    const limit = 50;

    if (this.isConnected) {
      try {
        const countStr = await this.client.get(key);
        const count = countStr ? parseInt(countStr, 10) : 0;
        return Math.max(0, limit - count);
      } catch (err) {
        console.error("Redis error getting quota, using memory fallback", err);
      }
    }

    const memKey = `${userId}:${today}`;
    const count = this.memoryQuota[memKey] || 0;
    return Math.max(0, limit - count);
  }

  // Refund quota (e.g. if request times out or is invalid)
  async refundQuota(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    const key = `quota:${userId}:${today}`;

    if (this.isConnected) {
      try {
        const countStr = await this.client.get(key);
        if (countStr) {
          const count = parseInt(countStr, 10);
          if (count > 0) {
            await this.client.set(key, (count - 1).toString(), {
              EX: 86400,
            });
          }
        }
        return;
      } catch (err) {
        console.error("Redis error refunding quota", err);
      }
    }

    const memKey = `${userId}:${today}`;
    const count = this.memoryQuota[memKey] || 0;
    if (count > 0) {
      this.memoryQuota[memKey] = count - 1;
    }
  }

  // Push task to FIFO queue
  async enqueueAiTask(taskFn: () => Promise<any>): Promise<any> {
    if (this.queue.length >= 100) {
      throw new Error("QUEUE_FULL: Antrian penuh (maks 100 request). Coba beberapa saat lagi.");
    }

    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.queue.push({ id, fn: taskFn, resolve, reject });
      console.log(`Task ${id} added to FIFO queue. Queue length: ${this.queue.length}`);

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing >= this.MAX_CONCURRENT || this.queue.length === 0) {
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) return;

    this.processing++;
    console.log(`Processing task ${nextTask.id}. Active processing: ${this.processing}`);

    try {
      const result = await nextTask.fn();
      nextTask.resolve(result);
    } catch (error) {
      nextTask.reject(error);
    } finally {
      this.processing--;
      // Process next in queue
      this.processQueue();
    }
  }

  // Get config from cache
  async getConfigCache(key: string): Promise<string | null> {
    const redisKey = `config:${key}`;
    if (this.isConnected) {
      try {
        return await this.client.get(redisKey);
      } catch (err) {
        console.error(`Redis error getting config cache for ${key}`, err);
      }
    }
    return this.memoryQuota[redisKey] !== undefined ? String(this.memoryQuota[redisKey]) : null;
  }

  // Set config cache
  async setConfigCache(key: string, value: string): Promise<void> {
    const redisKey = `config:${key}`;
    if (this.isConnected) {
      try {
        await this.client.set(redisKey, value, {
          EX: 3600,
        });
        return;
      } catch (err) {
        console.error(`Redis error setting config cache for ${key}`, err);
      }
    }
    this.memoryQuota[redisKey] = value as any;
  }

  // Invalidate config cache
  async invalidateConfigCache(key: string): Promise<void> {
    const redisKey = `config:${key}`;
    if (this.isConnected) {
      try {
        await this.client.del(redisKey);
        return;
      } catch (err) {
        console.error(`Redis error deleting config cache for ${key}`, err);
      }
    }
    delete this.memoryQuota[redisKey];
  }
}

export const redisService = new RedisService();
