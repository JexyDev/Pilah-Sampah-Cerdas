import { Request, Response } from "express";
import { transactionService } from "../services/transactionService.js";

export const transactionController = {
  getDeposits: async (req: Request, res: Response) => {
    try {
      const { binCode } = req.query;
      const deposits = await transactionService.getDeposits(binCode as string);
      
      const mappedDeposits = deposits.map((d: any) => ({
        id: d.id,
        warga: d.household?.user?.name || "Unknown",
        rtRw: d.bin?.rtRw?.name || `RT/RW ${d.bin?.rtRwId}`,
        jenis: d.category?.name || d.categoryId,
        berat: Number(d.weightKg),
        poin: Math.floor(Number(d.weightKg) * (d.category?.pointsPerKg || 10)),
        waktu: d.createdAt,
        status: "Selesai",
        lokasi: `Tong: ${d.bin?.qrCode}`
      }));

      res.status(200).json({ success: true, data: mappedDeposits });
    } catch (error) {
      console.error("[TransactionController] getDeposits error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil data setoran" });
    }
  }
};
