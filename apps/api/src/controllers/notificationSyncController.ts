import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const notificationSyncController = {
  getSyncState: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const state = await prisma.userNotificationSync.findUnique({
        where: { userId },
      });

      if (!state) {
        res.status(200).json({
          success: true,
          data: {
            readIds: [],
            markAllTimestamp: 0,
            deleteAllTimestamp: 0,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          readIds: JSON.parse(state.readIds || "[]"),
          markAllTimestamp: Number(state.markAllTimestamp),
          deleteAllTimestamp: Number(state.deleteAllTimestamp),
        },
      });
    } catch (error: any) {
      console.error("[NotificationSync] getSyncState error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateSyncState: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { readIds, markAllTimestamp, deleteAllTimestamp } = req.body;

      const payload: any = {};
      if (readIds !== undefined && Array.isArray(readIds)) {
        payload.readIds = JSON.stringify(readIds);
      }
      if (markAllTimestamp !== undefined) {
        payload.markAllTimestamp = BigInt(markAllTimestamp);
      }
      if (deleteAllTimestamp !== undefined) {
        payload.deleteAllTimestamp = BigInt(deleteAllTimestamp);
      }

      await prisma.userNotificationSync.upsert({
        where: { userId },
        update: payload,
        create: {
          userId,
          readIds: payload.readIds || "[]",
          markAllTimestamp: payload.markAllTimestamp || 0n,
          deleteAllTimestamp: payload.deleteAllTimestamp || 0n,
        },
      });

      res.status(200).json({ success: true, message: "Sync state updated" });
    } catch (error: any) {
      console.error("[NotificationSync] updateSyncState error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
