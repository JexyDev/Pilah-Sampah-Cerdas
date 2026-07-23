/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

export class DatabaseUnavailableError extends Error {
  constructor(message = "Database is down or unreachable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}
