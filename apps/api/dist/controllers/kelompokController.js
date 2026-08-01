import { kelompokService } from "../services/kelompokService.js";
export const kelompokController = {
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";
            const result = await kelompokService.getAllKelompok(page, limit, search);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            console.error("[KelompokController] getAll error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await kelompokService.getKelompokById(id);
            if (!result) {
                res.status(404).json({ success: false, message: "Kelompok not found" });
                return;
            }
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error("[KelompokController] getById error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    create: async (req, res) => {
        try {
            const { name, dplId } = req.body;
            if (!name) {
                res.status(400).json({ success: false, message: "Nama kelompok wajib diisi" });
                return;
            }
            const result = await kelompokService.createKelompok({ name, dplId });
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            console.error("[KelompokController] create error:", error);
            res.status(500).json({
                success: false,
                message: error.code === "P2002" ? "Nama kelompok sudah digunakan" : error.message || "Failed to create kelompok",
            });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, dplId } = req.body;
            const result = await kelompokService.updateKelompok(id, { name, dplId });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error("[KelompokController] update error:", error);
            res.status(500).json({
                success: false,
                message: error.code === "P2002" ? "Nama kelompok sudah digunakan" : error.message || "Failed to update kelompok",
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await kelompokService.deleteKelompok(id);
            res.status(200).json({ success: true, message: "Kelompok berhasil dihapus" });
        }
        catch (error) {
            console.error("[KelompokController] delete error:", error);
            res.status(500).json({
                success: false,
                message: error.message === "CANNOT_DELETE_KELOMPOK_WITH_STUDENTS"
                    ? "Tidak dapat menghapus kelompok yang memiliki anggota mahasiswa"
                    : "Failed to delete kelompok",
            });
        }
    },
    getDpls: async (req, res) => {
        try {
            const dpls = await kelompokService.getDplList();
            res.status(200).json({ success: true, data: dpls });
        }
        catch (error) {
            console.error("[KelompokController] getDpls error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
};
