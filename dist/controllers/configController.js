/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { configService } from "../services/configService.js";
export class ConfigController {
    /**
     * Get all configs
     */
    async getAll(req, res) {
        try {
            const configs = await configService.getAllConfigs();
            res.status(200).json({ success: true, data: configs });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    /**
     * Update a config
     */
    async update(req, res) {
        try {
            const { key, value } = req.body;
            if (!key || value === undefined) {
                res
                    .status(400)
                    .json({ success: false, code: "BAD_REQUEST", message: "key dan value wajib diisi" });
                return;
            }
            const updated = await configService.updateConfig(key, String(value));
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
}
export const configController = new ConfigController();
