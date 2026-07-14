import { Request, Response } from "express";
import { categoryService } from "../services/categoryService.js";

export class CategoryController {
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil kategori sampah" });
    }
  }
}

export const categoryController = new CategoryController();
