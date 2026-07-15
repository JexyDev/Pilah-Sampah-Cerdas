import { householdRepository } from "../repositories/householdRepository.js";

export class HouseholdService {
  /**
   * Register a new household.
   */
  async registerHousehold(userId: string, address: string, rtRwId: number, latitude: number, longitude: number) {
    // 1. Check if user already has a household in this specific RT/RW (to avoid duplicates)
    const existing = await householdRepository.findHouseholdByUserAndArea(userId, rtRwId);
    if (existing) {
      throw new Error("HOUSEHOLD_ALREADY_EXISTS");
    }

    // 2. Create the household with precise DECIMAL(11,8) GPS coordinates
    const household = await householdRepository.createHousehold({
      userId,
      address,
      rtRwId,
      latitude,
      longitude,
    });

    return household;
  }

  /**
   * Get households by user.
   */
  async getHouseholdsByUser(userId: string) {
    return householdRepository.findHouseholdsByUserId(userId);
  }
  
  /**
   * Get specific household details.
   */
  async getHouseholdById(id: string) {
    const household = await householdRepository.findHouseholdById(id);
    if (!household) {
      throw new Error("HOUSEHOLD_NOT_FOUND");
    }
    return household;
  }

  /**
   * Get all households in the system.
   */
  async getAllHouseholds() {
    return householdRepository.findAll();
  }
}

export const householdService = new HouseholdService();
