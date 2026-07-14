import { pointRepository } from "../repositories/pointRepository.js";

export class PointService {
  /**
   * Fetch point history and calculate total points for a user
   */
  async getLedger(userId: string) {
    const [history, totalPoints] = await Promise.all([
      pointRepository.getHistoryByUserId(userId),
      pointRepository.getTotalPoints(userId)
    ]);

    return {
      totalPoints,
      history
    };
  }
}

export const pointService = new PointService();
