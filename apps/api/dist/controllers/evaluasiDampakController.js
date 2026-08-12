import { evaluasiDampakService } from "../services/evaluasiDampakService.js";
/** Mengambil userId dari JWT payload yang sudah di-decode oleh authMiddleware */
function getUserId(req) {
    return req.user.userId || req.user.id;
}
/** Mengambil role dari JWT payload */
function getUserRole(req) {
    return req.user?.role || "";
}
export const evaluasiDampakController = {
    /**
     * GET /evaluasi-dampak/baseline
     * Mengambil data baseline (SurveiKelurahan) — scope ke DPL atau semua.
     */
    getBaselineData: async (req, res) => {
        try {
            const data = await evaluasiDampakService.getBaselineData(getUserId(req), getUserRole(req));
            res.json({ success: true, data });
        }
        catch (error) {
            console.error("[evaluasiDampakController.getBaselineData] error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
    /**
     * PUT /evaluasi-dampak/baseline/:kelurahanId/validate
     * DPL memvalidasi atau merevisi data baseline tertentu.
     */
    validateBaseline: async (req, res) => {
        try {
            const kelurahanId = parseInt(req.params.kelurahanId, 10);
            const { status, catatan } = req.body;
            if (!["VALID", "REVISI"].includes(status)) {
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: "Status harus 'VALID' atau 'REVISI'",
                });
                return;
            }
            const data = await evaluasiDampakService.validateBaseline(getUserId(req), kelurahanId, status, catatan);
            res.json({ success: true, data });
        }
        catch (error) {
            console.error("[evaluasiDampakController.validateBaseline] error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
    /**
     * GET /evaluasi-dampak/endline
     * Mengambil data endline (EndlineSurveiKelurahan) — scope ke DPL atau semua.
     */
    getEndlineData: async (req, res) => {
        try {
            const data = await evaluasiDampakService.getEndlineData(getUserId(req), getUserRole(req));
            res.json({ success: true, data });
        }
        catch (error) {
            console.error("[evaluasiDampakController.getEndlineData] error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
    /**
     * PUT /evaluasi-dampak/endline/:kelurahanId/validate
     * DPL memvalidasi atau merevisi data endline tertentu.
     */
    validateEndline: async (req, res) => {
        try {
            const kelurahanId = parseInt(req.params.kelurahanId, 10);
            const { status, catatan } = req.body;
            if (!["VALID", "REVISI"].includes(status)) {
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: "Status harus 'VALID' atau 'REVISI'",
                });
                return;
            }
            const data = await evaluasiDampakService.validateEndline(getUserId(req), kelurahanId, status, catatan);
            res.json({ success: true, data });
        }
        catch (error) {
            console.error("[evaluasiDampakController.validateEndline] error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
    /**
     * GET /evaluasi-dampak/komparasi
     * Mengambil data perbandingan Baseline vs Endline per kelurahan.
     */
    getKomparasiDampak: async (req, res) => {
        try {
            const data = await evaluasiDampakService.getKomparasiDampak(getUserId(req), getUserRole(req));
            res.json({ success: true, data });
        }
        catch (error) {
            console.error("[evaluasiDampakController.getKomparasiDampak] error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
};
