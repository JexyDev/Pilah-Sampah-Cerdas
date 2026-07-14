import { aiService } from "./src/services/aiService.js";
import { authService } from "./src/services/authService.js";

async function run() {
  console.log("Testing AI Mock Service with Redis Queue...");
  try {
    // 1. Get Admin User
    const loginResult = await authService.login("admin@pilahsampah.id", "password123");
    const userId = loginResult.user.id;
    console.log("Testing AI request for User ID:", userId);

    // 2. Perform 3 concurrent AI requests
    console.log("Dispatching 3 concurrent AI detection requests...");
    const reqs = [
      aiService.detectWasteMock(userId, "http://mock.com/1.jpg"),
      aiService.detectWasteMock(userId, "http://mock.com/2.jpg"),
      aiService.detectWasteMock(userId, "http://mock.com/3.jpg"),
    ];

    const results = await Promise.allSettled(reqs);

    results.forEach((res, i) => {
      if (res.status === "fulfilled") {
        console.log(`✅ Req ${i+1} Success:`, res.value);
      } else {
        console.error(`❌ Req ${i+1} Failed:`, res.reason.message);
      }
    });

  } catch (error) {
    console.error("Fatal Test error:", error);
  } finally {
    process.exit(0);
  }
}

run();
