/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Shared useNotifications React Hook
 */

import { useState, useEffect, useCallback } from "react";
import notificationService, { NotificationItem } from "../services/notificationService";

export function useNotifications(role?: string, pollIntervalMs: number = 15000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const { data, unreadCount: count } = await notificationService.getNotifications(role);
        setNotifications(data);
        setUnreadCount(count);
        setError(null);
      } catch (err: any) {
        if (!silent) setError("Gagal memuat notifikasi");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    fetchNotifications();
    if (pollIntervalMs > 0) {
      const interval = setInterval(() => fetchNotifications(true), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollIntervalMs]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await notificationService.clearAll();
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

export default useNotifications;
