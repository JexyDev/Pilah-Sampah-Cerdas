import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
class RedisService {
    client;
    isConnected = false;
    queue = [];
    processing = 0;
    MAX_CONCURRENT = 5; // Process up to 5 concurrent AI detections
    // Fallback in-memory storage if Redis is offline
    memoryQuota = {};
    constructor() {
        this.initializeRedis();
    }
    async initializeRedis() {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        this.client = createClient({ url: redisUrl });
        this.client.on("error", (err) => {
            console.warn("Redis connection error, falling back to in-memory mode:", err.message);
            this.isConnected = false;
        });
        try {
            await this.client.connect();
            console.log("Redis connected successfully.");
            this.isConnected = true;
        }
        catch (e) {
            console.warn("Could not connect to Redis. Running in-memory mode.");
            this.isConnected = false;
        }
    }
    // Check and decrement daily quota
    async checkAndUseQuota(userId) {
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
                    EX: 86400 // Expire in 1 day
                });
                return true;
            }
            catch (err) {
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
    // Refund quota (e.g. if request times out or is invalid)
    async refundQuota(userId) {
        const today = new Date().toISOString().split("T")[0];
        const key = `quota:${userId}:${today}`;
        if (this.isConnected) {
            try {
                const countStr = await this.client.get(key);
                if (countStr) {
                    const count = parseInt(countStr, 10);
                    if (count > 0) {
                        await this.client.set(key, (count - 1).toString(), {
                            EX: 86400
                        });
                    }
                }
                return;
            }
            catch (err) {
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
    async enqueueAiTask(taskFn) {
        if (this.queue.length >= 100) {
            throw new Error("QUEUE_FULL: Antrian penuh (maks 100 request). Coba beberapa saat lagi.");
        }
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            this.queue.push({ id, resolve, reject });
            console.log(`Task ${id} added to FIFO queue. Queue length: ${this.queue.length}`);
            this.processQueue(taskFn);
        });
    }
    async processQueue(taskFn) {
        if (this.processing >= this.MAX_CONCURRENT || this.queue.length === 0) {
            return;
        }
        const nextTask = this.queue.shift();
        if (!nextTask)
            return;
        this.processing++;
        console.log(`Processing task ${nextTask.id}. Active processing: ${this.processing}`);
        try {
            const result = await taskFn();
            nextTask.resolve(result);
        }
        catch (error) {
            nextTask.reject(error);
        }
        finally {
            this.processing--;
            // Process next in queue
            this.processQueue(taskFn);
        }
    }
}
export const redisService = new RedisService();
