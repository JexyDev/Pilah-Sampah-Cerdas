/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Shared Notification Client Service
 */

import api from "../utils/api";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  isRead: boolean;
  time?: string;
  createdAt: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

export interface NotificationResponse {
  success: boolean;
  status: string;
  data: NotificationItem[];
  unreadCount?: number;
}

export const notificationService = {
  async getNotifications(role?: string): Promise<{ data: NotificationItem[]; unreadCount: number }> {
    const params = role ? `?role=${encodeURIComponent(role)}` : "";
    const response = await api.get<NotificationResponse>(`/notifications${params}`);
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    const unread = typeof response.data?.unreadCount === "number"
      ? response.data.unreadCount
      : list.filter((n) => !n.isRead).length;

    return { data: list, unreadCount: unread };
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      await api.put(`/notifications/${id}/read`);
      return true;
    } catch (err) {
      console.error("[notificationService] Error markAsRead:", err);
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      await api.put("/notifications/read-all");
      return true;
    } catch (err) {
      console.error("[notificationService] Error markAllAsRead:", err);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      await api.delete("/notifications/all");
      return true;
    } catch (err) {
      console.error("[notificationService] Error clearAll:", err);
      return false;
    }
  },
};

export default notificationService;
