import { Router } from "express";

const router = Router();

// Mock endpoint for AI Waste Detection
router.post("/predict", (req, res) => {
  // In a real app, you would process req.body.image
  // Mock processing time
  setTimeout(() => {
    // Randomly choose organic or non_organic
    const isOrganic = Math.random() > 0.5;
    const type = isOrganic ? "ORGANIC" : "NON_ORGANIC";
    
    // Estimate volume between 1 to 5 liters
    const volume = Math.floor(Math.random() * 5) + 1;
    
    res.status(200).json({
      status: "success",
      data: {
        jenis_sampah: type,
        estimasi_volume: volume,
        confidence: (Math.random() * (0.99 - 0.75) + 0.75).toFixed(2)
      }
    });
  }, 1500); // 1.5 seconds mock delay
});

export default router;
