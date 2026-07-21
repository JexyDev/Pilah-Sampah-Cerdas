/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { bankSampahService } from "../services/bankSampahService.js";

export class BankSampahController {
  /**
   * Add deposit/withdrawal transaction to ledger
   */
  async addTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type, amount, description } = req.body;
      if (!userId || !type || amount === undefined) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "userId, type, dan amount wajib diisi",
        });
        return;
      }
      const ledger = await bankSampahService.addTransaction(
        userId,
        type,
        Number(amount),
        description
      );
      res.status(201).json({
        success: true,
        message: "Transaksi saldo rupiah berhasil ditambahkan",
        data: ledger,
      });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get balance and transactions
   */
  async getLedger(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const ledger = await bankSampahService.getLedger(userId);
      res.status(200).json({ success: true, data: ledger });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const bankSampahController = new BankSampahController();
