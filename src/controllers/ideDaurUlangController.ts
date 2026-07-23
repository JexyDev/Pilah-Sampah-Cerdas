import { Request, Response } from "express";
import { ideDaurUlangService } from "../services/ideDaurUlangService.js";

export class IdeDaurUlangController {
  async submitIde(req: Request, res: Response) {
    try {
      const { judul, material } = req.body;
      const userId = (req as any).user.userId;
      const foto = req.file ? `/uploads/${req.file.filename}` : null;

      if (!judul || !material) {
        return res.status(400).json({ success: false, message: "Judul dan material wajib diisi" });
      }

      const ide = await ideDaurUlangService.createIde(userId, judul, material, foto);
      res.status(201).json({ success: true, data: ide });
    } catch (error) {
      console.error("[IdeDaurUlangController] submitIde error:", error);
      res.status(500).json({ success: false, message: "Gagal submit ide" });
    }
  }

  async getIdeDaurUlang(req: Request, res: Response) {
    try {
      const { search, status } = req.query;
      const ides = await ideDaurUlangService.getSemuaIde({
        search: search as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data: ides });
    } catch (error) {
      console.error("[IdeDaurUlangController] getIdeDaurUlang error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil ide" });
    }
  }

  async getMyIde(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const ides = await ideDaurUlangService.getIdeWarga(userId);
      res.status(200).json({ success: true, data: ides });
    } catch (error) {
      console.error("[IdeDaurUlangController] getMyIde error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil ide" });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approvedBy = (req as any).user.userId;
      const ide = await ideDaurUlangService.approveIde(id, approvedBy);
      res.status(200).json({ success: true, data: ide });
    } catch (error) {
      console.error("[IdeDaurUlangController] approve error:", error);
      res.status(500).json({ success: false, message: "Gagal approve ide" });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rejectedBy = (req as any).user.userId;
      const ide = await ideDaurUlangService.rejectIde(id, rejectedBy);
      res.status(200).json({ success: true, data: ide });
    } catch (error) {
      console.error("[IdeDaurUlangController] reject error:", error);
      res.status(500).json({ success: false, message: "Gagal reject ide" });
    }
  }
}

export const ideDaurUlangController = new IdeDaurUlangController();
