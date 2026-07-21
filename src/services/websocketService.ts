/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyAccessToken } from "../utils/jwtUtils.js";
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";

const prisma = new PrismaClient();

// Map to store connected clients by userId
const clients = new Map<string, WebSocket>();

export const websocketService = {
  init: (server: Server) => {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    wss.on("connection", (ws: WebSocket) => {
      let clientUserId: string | null = null;

      ws.on("message", async (messageStr: string) => {
        try {
          const msg = JSON.parse(messageStr);

          // 1. Authentication
          if (msg.type === "AUTH") {
            const token = msg.token;
            if (!token) return;
            const decoded = verifyAccessToken(token);
            if (decoded) {
              clientUserId = decoded.userId;
              clients.set(clientUserId, ws);
              ws.send(JSON.stringify({ type: "AUTH_SUCCESS", message: "Authenticated successfully" }));
            }
          }

          // 2. Live Location Updates from Petugas
          if (msg.type === "LOCATION_UPDATE") {
            if (!clientUserId) return;
            const { latitude, longitude } = msg;
            if (latitude !== undefined && longitude !== undefined) {
              // Update live coordinates in DB
              await prisma.petugasResidu.updateMany({
                where: { userId: clientUserId },
                data: {
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                },
              });
            }
          }
        } catch (error) {
          // Silent catch to prevent crash
        }
      });

      ws.on("close", () => {
        if (clientUserId) {
          clients.delete(clientUserId);
        }
      });
    });

    console.log("WebSocket Server initialized and attached to HTTP Server.");
  },

  /**
   * Broadcast a dispatch task to all Petugas Residu within radius
   */
  broadcastDispatch: async (binId: string, qrCode: string, binLat: number, binLng: number) => {
    // 1. Get dispatch radius config
    const radiusVal = await configService.getConfig("dispatch_radius_km");
    const radiusLimit = radiusVal ? Number(radiusVal) : 2.0;

    // 2. Get all Petugas Residu with coordinates
    const allPetugas = await prisma.petugasResidu.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // 3. Filter by distance and broadcast
    for (const petugas of allPetugas) {
      const distanceMeters = getDistanceMeters(
        binLat,
        binLng,
        Number(petugas.latitude),
        Number(petugas.longitude)
      );
      const distance = distanceMeters / 1000;

      if (distance <= radiusLimit) {
        const ws = clients.get(petugas.userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "DISPATCH_ALERT",
              binId,
              qrCode,
              latitude: binLat,
              longitude: binLng,
              distanceKm: Math.round(distance * 100) / 100,
            })
          );
        }
      }
    }
  },
};
