/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { categoryService } from "../services/categoryService.js";

export const categoryController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error("[CategoryController] getAll error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil kategori" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      console.error("[CategoryController] create error:", error);
      res
        .status(400)
        .json({ success: false, message: "Gagal membuat kategori, nama mungkin sudah ada" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      console.error("[CategoryController] update error:", error);
      res.status(400).json({ success: false, message: "Gagal update kategori" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(200).json({ success: true, message: "Kategori dihapus" });
    } catch (error) {
      console.error("[CategoryController] delete error:", error);
      res.status(400).json({ success: false, message: "Gagal hapus kategori" });
    }
  },
};
