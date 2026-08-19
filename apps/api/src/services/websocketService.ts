import { prisma } from "../lib/prisma.js";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyAccessToken } from "../utils/jwtUtils.js";
import { configService } from "./configService.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";


// Map to store connected clients by userId
const clients = new Map<string, WebSocket>();
const allSockets = new Set<WebSocket>();

export const websocketService = {
  init: (server: Server) => {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    wss.on("connection", (ws: WebSocket) => {
      allSockets.add(ws);
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
              ws.send(
                JSON.stringify({ type: "AUTH_SUCCESS", message: "Authenticated successfully" })
              );
            }
          }

          // 2. Live Location Updates from Petugas & Mahasiswa KKN
          if (msg.type === "LOCATION_UPDATE") {
            if (!clientUserId) return;
            const { latitude, longitude } = msg;
            if (latitude !== undefined && longitude !== undefined) {
              const latNum = Number(latitude);
              const lngNum = Number(longitude);

              const user = await prisma.user.findUnique({
                where: { id: clientUserId },
                include: { role: true },
              });

              if (user?.role?.name === "MAHASISWA_KKN") {
                await prisma.studentLocation.create({
                  data: {
                    studentId: clientUserId,
                    latitude: latNum,
                    longitude: lngNum,
                  },
                });
                websocketService.broadcastStudentLocation({
                  studentId: clientUserId,
                  latitude: latNum,
                  longitude: lngNum,
                  recordedAt: new Date().toISOString(),
                });
              } else if (
                user?.role?.name === "PETUGAS_RESIDU" ||
                user?.role?.name === "PETUGAS_PEMILAHAN"
              ) {
                await prisma.petugasResidu.updateMany({
                  where: { userId: clientUserId },
                  data: {
                    latitude: latNum,
                    longitude: lngNum,
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error("[WebSocketService] message processing error:", error);
        }
      });

      ws.on("close", () => {
        allSockets.delete(ws);
        if (clientUserId) {
          clients.delete(clientUserId);
        }
      });

      ws.on("error", () => {
        allSockets.delete(ws);
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

  /**
   * Broadcast an audit log to connected developer clients
   */
  broadcastAuditLog: (logData: any) => {
    const message = JSON.stringify({
      type: "NEW_AUDIT_LOG",
      data: logData,
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  },

  /**
   * Broadcast a newly created waste deposit to all monitoring dashboards
   */
  broadcastDeposit: (depositData: any) => {
    const message = JSON.stringify({
      type: "NEW_DEPOSIT",
      data: depositData,
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error("[WebSocketService] broadcastDeposit send error:", err);
        }
      }
    });
  },

  /**
   * Broadcast student location update to connected monitoring clients
   */
  broadcastStudentLocation: async (locationData: any) => {
    let payload = locationData;
    if (locationData.studentId && !locationData.student) {
      try {
        const studentUser = await prisma.user.findUnique({
          where: { id: locationData.studentId },
          select: {
            id: true,
            name: true,
            phone: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
                kelompokId: true,
              },
            },
          },
        });
        if (studentUser) {
          payload = {
            ...locationData,
            student: studentUser,
          };
        }
      } catch (_e) {
        // Fallback to raw location data
      }
    }

    const message = JSON.stringify({
      type: "STUDENT_LOCATION_UPDATE",
      data: payload,
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error("[WebSocketService] broadcastStudentLocation send error:", err);
        }
      }
    });
  },

  /**
   * Broadcast student logout event to immediately remove marker on monitoring map
   */
  broadcastStudentLogout: (studentId: string) => {
    const message = JSON.stringify({
      type: "STUDENT_LOGOUT",
      data: {
        studentId,
        loggedOutAt: new Date().toISOString(),
      },
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error("[WebSocketService] broadcastStudentLogout send error:", err);
        }
      }
    });
  },

  /**
   * Broadcast removal of a student GPS location pin
   */
  broadcastStudentLocationRemoved: (studentId: string) => {
    const message = JSON.stringify({
      type: "STUDENT_LOCATION_REMOVED",
      data: {
        studentId,
        removedAt: new Date().toISOString(),
      },
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error("[WebSocketService] broadcastStudentLocationRemoved send error:", err);
        }
      }
    });
  },

  /**
   * Broadcast student check-out / session completion event
   */
  broadcastStudentCheckout: (checkoutData: any) => {
    const message = JSON.stringify({
      type: "STUDENT_CHECKOUT",
      data: checkoutData,
    });

    allSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error("[WebSocketService] broadcastStudentCheckout send error:", err);
        }
      }
    });
  },
};
