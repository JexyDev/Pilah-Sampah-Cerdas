/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * WebSocket Real-Time Client for BERSEKA
 * Catatan: WebSocket hanya diaktifkan secara eksklusif untuk role Developer / Super User.
 */

type DepositCallback = (deposit: any) => void;
type StudentLocationCallback = (locationData: any) => void;
type StudentLogoutCallback = (data: { studentId: string; loggedOutAt?: string; removedAt?: string }) => void;
type StudentCheckoutCallback = (checkoutData: any) => void;
type StudentAttendanceCallback = (attendanceData: any) => void;
type StatusCallback = (status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") => void;

class BERSEKAWebSocketClient {
  private socket: WebSocket | null = null;
  private depositListeners: Set<DepositCallback> = new Set();
  private studentLocationListeners: Set<StudentLocationCallback> = new Set();
  private studentLogoutListeners: Set<StudentLogoutCallback> = new Set();
  private studentCheckoutListeners: Set<StudentCheckoutCallback> = new Set();
  private studentAttendanceListeners: Set<StudentAttendanceCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" = "DISCONNECTED";
  private isIntentionallyClosed = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;

  /**
   * Cek apakah user yang login saat ini memiliki peran Developer / Super User
   */
  public isDeveloper(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("psc_user") ?? sessionStorage.getItem("psc_user");
      if (!stored) return false;
      const user = JSON.parse(stored);
      const role = String(user?.peran || user?.role || "").toUpperCase();
      return role === "DEVELOPER" || role === "SUPER_USER" || role === "DEV";
    } catch {
      return false;
    }
  }

  private getWsUrl(): string {
    if (typeof window === "undefined") return "ws://localhost:3000";

    // 1. Explicit WS env var
    const envWs = (import.meta as any).env?.VITE_WS_URL;
    if (envWs) return envWs;

    // 2. Derive from VITE_API_BASE_URL if available
    const envApi = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envApi && (envApi.startsWith("http://") || envApi.startsWith("https://"))) {
      try {
        const apiUrl = new URL(envApi);
        const wsProto = apiUrl.protocol === "https:" ? "wss:" : "ws:";
        const path = apiUrl.pathname && apiUrl.pathname !== "/" ? apiUrl.pathname : "/api";
        return `${wsProto}//${apiUrl.host}${path}`;
      } catch (_e) {
        // Fallback below
      }
    }

    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port;

    // In local dev (Vite running on port 5173/5174/etc, backend on port 3000):
    if (port && port !== "3000" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172."))) {
      return `${protocol}//${hostname}:3000`;
    }

    // Default: use window host + /api path to match Nginx proxy_pass location block
    return `${protocol}//${window.location.host}/api`;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "PING" }));
        } catch (_e) {
          // Socket write failed, connection might be broken
        }
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public connect() {
    if (typeof window === "undefined") return;

    // HANYA role Developer yang diizinkan membuka koneksi WebSocket
    if (!this.isDeveloper()) {
      if (this.socket) {
        this.disconnect();
      }
      this.setStatus("DISCONNECTED");
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus("DISCONNECTED");
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus("CONNECTING");

    try {
      const url = this.getWsUrl();
      const wsInstance = new WebSocket(url);
      this.socket = wsInstance;

      wsInstance.onopen = () => {
        if (this.socket !== wsInstance) return;
        this.reconnectAttempts = 0;
        this.setStatus("CONNECTED");
        this.startHeartbeat();
        const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
        if (token && wsInstance.readyState === WebSocket.OPEN) {
          try {
            wsInstance.send(JSON.stringify({ type: "AUTH", token }));
          } catch {
            // Safe ignore
          }
        }
      };

      wsInstance.onmessage = (event) => {
        if (this.socket !== wsInstance) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "PONG") {
            return;
          }
          if (msg.type === "NEW_DEPOSIT" && msg.data) {
            this.depositListeners.forEach((listener) => {
              try {
                listener(msg.data);
              } catch (err) {
                console.error("[WS] deposit listener error:", err);
              }
            });
          } else if (msg.type === "STUDENT_LOCATION_UPDATE" && msg.data) {
            this.studentLocationListeners.forEach((listener) => {
              try {
                listener(msg.data);
              } catch (err) {
                console.error("[WS] studentLocation listener error:", err);
              }
            });
          } else if ((msg.type === "STUDENT_LOGOUT" || msg.type === "STUDENT_LOCATION_REMOVED") && msg.data) {
            this.studentLogoutListeners.forEach((listener) => {
              try {
                listener(msg.data);
              } catch (err) {
                console.error("[WS] studentLogout listener error:", err);
              }
            });
          } else if (msg.type === "STUDENT_CHECKOUT" && msg.data) {
            this.studentCheckoutListeners.forEach((listener) => {
              try {
                listener(msg.data);
              } catch (err) {
                console.error("[WS] studentCheckout listener error:", err);
              }
            });
          } else if (msg.type === "STUDENT_ATTENDANCE_UPDATE" && msg.data) {
            this.studentAttendanceListeners.forEach((listener) => {
              try {
                listener(msg.data);
              } catch (err) {
                console.error("[WS] studentAttendance listener error:", err);
              }
            });
          }
        } catch {
          // Non-JSON or ignored frame
        }
      };

      wsInstance.onclose = () => {
        if (this.socket === wsInstance) {
          this.stopHeartbeat();
          this.setStatus("DISCONNECTED");
          this.socket = null;
          if (!this.isIntentionallyClosed && this.isDeveloper()) {
            this.scheduleReconnect();
          }
        }
      };

      wsInstance.onerror = () => {
        if (this.socket === wsInstance) {
          this.stopHeartbeat();
          this.setStatus("DISCONNECTED");
          // Browser will automatically trigger onclose
        }
      };
    } catch {
      this.stopHeartbeat();
      this.setStatus("DISCONNECTED");
      if (this.isDeveloper()) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (!this.isDeveloper() || this.isIntentionallyClosed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus("DISCONNECTED");
      return;
    }

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setStatus(status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public sendLocation(latitude: number, longitude: number) {
    if (!this.isDeveloper()) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
      try {
        this.socket.send(
          JSON.stringify({
            type: "LOCATION_UPDATE",
            latitude,
            longitude,
            token,
          })
        );
      } catch {
        // Safe ignore
      }
    }
  }

  public onDeposit(callback: DepositCallback): () => void {
    this.depositListeners.add(callback);
    if (this.isDeveloper()) {
      this.connect();
    }
    return () => {
      this.depositListeners.delete(callback);
    };
  }

  public onStudentLocation(callback: StudentLocationCallback): () => void {
    this.studentLocationListeners.add(callback);
    if (this.isDeveloper()) {
      this.connect();
    }
    return () => {
      this.studentLocationListeners.delete(callback);
    };
  }

  public onStudentLogout(callback: StudentLogoutCallback): () => void {
    this.studentLogoutListeners.add(callback);
    if (this.isDeveloper()) {
      this.connect();
    }
    return () => {
      this.studentLogoutListeners.delete(callback);
    };
  }

  public onStudentCheckout(callback: StudentCheckoutCallback): () => void {
    this.studentCheckoutListeners.add(callback);
    if (this.isDeveloper()) {
      this.connect();
    }
    return () => {
      this.studentCheckoutListeners.delete(callback);
    };
  }

  public onStudentAttendance(callback: StudentAttendanceCallback): () => void {
    this.studentAttendanceListeners.add(callback);
    if (this.isDeveloper()) {
      this.connect();
    }
    return () => {
      this.studentAttendanceListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public manualReconnect() {
    this.reconnectAttempts = 0;
    this.connect();
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Safe ignore
      }
      this.socket = null;
    }
    this.setStatus("DISCONNECTED");
  }
}

export const wsClient = new BERSEKAWebSocketClient();
