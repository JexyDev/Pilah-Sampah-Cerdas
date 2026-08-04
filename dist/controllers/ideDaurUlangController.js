import { ideDaurUlangService } from "../services/ideDaurUlangService.js";
export class IdeDaurUlangController {
    async submitIde(req, res) {
        try {
            const { judul, material } = req.body;
            const userId = req.user.userId;
            const foto = req.file ? `/uploads/${req.file.filename}` : null;
            if (!judul || !material) {
                return res.status(400).json({ success: false, message: "Judul dan material wajib diisi" });
            }
            const ide = await ideDaurUlangService.createIde(userId, judul, material, foto);
            res.status(201).json({ success: true, data: ide });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] submitIde error:", error);
            res.status(500).json({ success: false, message: "Gagal submit ide" });
        }
    }
    async getIdeDaurUlang(req, res) {
        try {
            const { search, status } = req.query;
            const ides = await ideDaurUlangService.getSemuaIde({
                search: search,
                status: status,
            });
            res.status(200).json({ success: true, data: ides });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] getIdeDaurUlang error:", error);
            res.status(500).json({ success: false, message: "Gagal mengambil ide" });
        }
    }
    async getMyIde(req, res) {
        try {
            const userId = req.user.userId;
            const ides = await ideDaurUlangService.getIdeWarga(userId);
            res.status(200).json({ success: true, data: ides });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] getMyIde error:", error);
            res.status(500).json({ success: false, message: "Gagal mengambil ide" });
        }
    }
    async approve(req, res) {
        try {
            const { id } = req.params;
            const approvedBy = req.user.userId;
            const ide = await ideDaurUlangService.approveIde(id, approvedBy);
            res.status(200).json({ success: true, data: ide });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] approve error:", error);
            res.status(500).json({ success: false, message: "Gagal approve ide" });
        }
    }
    async reject(req, res) {
        try {
            const { id } = req.params;
            const rejectedBy = req.user.userId;
            const ide = await ideDaurUlangService.rejectIde(id, rejectedBy);
            res.status(200).json({ success: true, data: ide });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] reject error:", error);
            res.status(500).json({ success: false, message: "Gagal reject ide" });
        }
    }
    async updateIde(req, res) {
        try {
            const { id } = req.params;
            const { judul, material } = req.body;
            const foto = req.file ? `/uploads/${req.file.filename}` : null;
            if (!judul || !material) {
                return res.status(400).json({ success: false, message: "Judul dan material wajib diisi" });
            }
            const ide = await ideDaurUlangService.updateIde(id, judul, material, foto);
            res.status(200).json({ success: true, data: ide });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] updateIde error:", error);
            res.status(500).json({ success: false, message: "Gagal update ide" });
        }
    }
    async deleteIde(req, res) {
        try {
            const { id } = req.params;
            await ideDaurUlangService.deleteIde(id);
            res.status(200).json({ success: true, message: "Ide berhasil dihapus" });
        }
        catch (error) {
            console.error("[IdeDaurUlangController] deleteIde error:", error);
            res.status(500).json({ success: false, message: "Gagal menghapus ide" });
        }
    }
}
export const ideDaurUlangController = new IdeDaurUlangController();
