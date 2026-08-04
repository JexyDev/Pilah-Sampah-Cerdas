/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TrashCare API Documentation",
      version: "1.0.0",
      description: "Dokumentasi API untuk sistem manajemen pilah sampah cerdas (pilahsampah.id)",
    },
    servers: [
      {
        url: "http://157.10.252.252/api/v1",
        description: "VPS Production Server (157.10.252.252)",
      },
      {
        url: "http://192.168.1.16:3000/api/v1",
        description: "Local Wi-Fi Network Server (192.168.1.16)",
      },
      {
        url: "http://localhost:3000/api/v1",
        description: "Localhost Server",
      },
    ],
    tags: [
      { name: "Authentication", description: "Login, OTP WhatsApp, Logout, & Session Status" },
      { name: "Executive & Monitoring (Camat, Lurah, Admin DLH)", description: "API Read-Only Web Monitoring untuk Camat, Lurah, dan Admin DLH" },
      { name: "Kelurahan & Wilayah", description: "Manajemen Kelurahan (Dago, Sekeloa, dll), RW, & RT Coblong" },
      { name: "Petugas Residu", description: "API Khusus Petugas Residu (Input Timbangan Manual & Web Monitoring Hilir)" },
      { name: "DPL", description: "API Monitoring & Evaluasi Dosen Pembimbing Lapangan (DPL)" },
      { name: "Mahasiswa KKN", description: "API Penugasan, QR Batch, Absensi & Dampingan Mahasiswa KKN" },
      { name: "Pengurus RW", description: "API Approval Warga, Fasilitas, & Ide Daur Ulang Pengurus RW/RT" },
      { name: "Bins", description: "Manajemen Tempat Sampah, Status QR, & Aktivasi" },
      { name: "Users", description: "Manajemen Pengguna & Profil" },
      { name: "Dashboard", description: "Statistik KPI & Agregasi Wilayah" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Masukkan JWT Token dari response login (tanpa prefix Bearer)",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/routes/*.js",
    "./dist/routes/*.js",
    "apps/api/src/routes/*.ts",
    "apps/api/src/routes/*.js",
    "apps/api/dist/routes/*.js"
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI page
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger documentation initialized at http://localhost:3000/api-docs");
}
