/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */
import { pemanfaatanService } from "../services/pemanfaatanService.js";
export class PemanfaatanController {
    async create(req, res) {
        try {
            const { rwId, nomorCaraPemanfaatan, program, teknologi, bahanBaku, volumeBahanBaku, unitBahanBaku, hasil, unitHasil, fotoDokumentasiUrl, tanggalPencatatan, jenisKomoditas, luasLahanM2, volumePupukDipakaiKg, bibitTelurGram, hasilKasgotKg, volumeBioaktivatorLiter, masaFermentasiHari, } = req.body;
            if (!rwId ||
                !nomorCaraPemanfaatan ||
                !program ||
                !teknologi ||
                !bahanBaku ||
                !volumeBahanBaku ||
                !unitBahanBaku ||
                !hasil ||
                !unitHasil ||
                !fotoDokumentasiUrl ||
                !tanggalPencatatan) {
                res.status(400).json({ success: false, message: "Semua field wajib diisi" });
                return;
            }
            const result = await pemanfaatanService.create({
                rwId: parseInt(rwId, 10),
                nomorCaraPemanfaatan,
                program,
                teknologi,
                bahanBaku,
                volumeBahanBaku: parseFloat(volumeBahanBaku),
                unitBahanBaku,
                hasil: parseFloat(hasil),
                unitHasil,
                fotoDokumentasiUrl,
                tanggalPencatatan: new Date(tanggalPencatatan),
                jenisKomoditas,
                luasLahanM2: luasLahanM2 ? parseFloat(luasLahanM2) : undefined,
                volumePupukDipakaiKg: volumePupukDipakaiKg ? parseFloat(volumePupukDipakaiKg) : undefined,
                bibitTelurGram: bibitTelurGram ? parseFloat(bibitTelurGram) : undefined,
                hasilKasgotKg: hasilKasgotKg ? parseFloat(hasilKasgotKg) : undefined,
                volumeBioaktivatorLiter: volumeBioaktivatorLiter
                    ? parseFloat(volumeBioaktivatorLiter)
                    : undefined,
                masaFermentasiHari: masaFermentasiHari ? parseInt(masaFermentasiHari, 10) : undefined,
            });
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const result = await pemanfaatanService.getAll();
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await pemanfaatanService.getById(id);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await pemanfaatanService.update(id, req.body);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await pemanfaatanService.delete(id);
            res.status(200).json({ success: true, message: "Program pemanfaatan berhasil dihapus" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
export const pemanfaatanController = new PemanfaatanController();
