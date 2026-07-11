import { v4 as uuidv4 } from "uuid";
import { aiRepository } from "../repositories/aiRepository.js";
import { redisService } from "./redisService.js";

export class AiService {
  /**
   * Mock AI Detection using Redis Queue with strict limits
   */
  async detectWasteMock(userId: string, imageUrl: string) {
    // 1. Check Quota via Redis
    const hasQuota = await redisService.checkAndUseQuota(userId);
    if (!hasQuota) {
      throw new Error("QUOTA_EXCEEDED");
    }

    const requestId = uuidv4();
    const finalImageUrl = imageUrl || "http://mock-storage/waste.jpg";

    try {
      // 2. Enqueue the AI Task into FIFO Queue (max 2 concurrent from redisService)
      const result = await redisService.enqueueAiTask(() => {
        return new Promise((resolve, reject) => {
          // Decide AI computation duration (15% chance of timeout > 2000ms)
          const isTimeout = Math.random() < 0.15;
          const duration = isTimeout ? 2500 : 1200;

          // 20% chance of image unreadable failure
          const isUnreadable = Math.random() < 0.20;

          const timeoutId = setTimeout(() => {
            if (isTimeout) {
              reject(new Error("AI_TIMEOUT"));
            } else if (isUnreadable) {
              reject(new Error("IMAGE_UNREADABLE"));
            } else {
              const types = ["ORGANIC", "NON_ORGANIC"];
              const detectedType = types[Math.floor(Math.random() * types.length)];
              // Estimate volume between 1.5 and 6.0 Liters
              const volumeEstimate = parseFloat((Math.random() * 4.5 + 1.5).toFixed(2));
              resolve({
                requestId,
                detectedType,
                volumeEstimate,
                isBlurry: false
              });
            }
          }, duration);

          // Standard 2-second threshold for client response timeout
          setTimeout(() => {
            clearTimeout(timeoutId);
            reject(new Error("AI_TIMEOUT"));
          }, 2000);
        });
      });

      // 3. Write Success Log
      await aiRepository.logRequest(userId, requestId, finalImageUrl, "SUCCESS").catch((err) => {
        console.warn("Failed to write AI success log to DB:", err.message);
      });

      return result;

    } catch (error: any) {
      // Handle Failure
      const isTimeout = error.message === "AI_TIMEOUT";
      const failureStatus = isTimeout ? "TIMEOUT" : "IMAGE_UNREADABLE";
      
      // Write Failed Log
      await aiRepository.logRequest(userId, requestId, finalImageUrl, failureStatus).catch(() => {});

      // Refund Quota
      await redisService.refundQuota(userId);

      throw error;
    }
  }
}

export const aiService = new AiService();
