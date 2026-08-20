/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * WebSocket Real-Time Client for BERSEKA
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
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public connect() {
    if (typeof window === "undefined") return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus("CONNECTING");

    try {
      const url = this.getWsUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.setStatus("CONNECTED");
        this.startHeartbeat();
        const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
        if (token && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "AUTH", token }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "PONG") {
            // Heartbeat response acknowledged
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
        } catch (e) {
          // Non-JSON or ignored frame
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("DISCONNECTED");
        this.socket = null;
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.stopHeartbeat();
        this.setStatus("DISCONNECTED");
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (err) {
      console.error("[WS] Connection init error:", err);
      this.stopHeartbeat();
      this.setStatus("DISCONNECTED");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private setStatus(status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public sendLocation(latitude: number, longitude: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
      this.socket.send(
        JSON.stringify({
          type: "LOCATION_UPDATE",
          latitude,
          longitude,
          token,
        })
      );
    }
  }

  public onDeposit(callback: DepositCallback): () => void {
    this.depositListeners.add(callback);
    this.connect();
    return () => {
      this.depositListeners.delete(callback);
    };
  }

  public onStudentLocation(callback: StudentLocationCallback): () => void {
    this.studentLocationListeners.add(callback);
    this.connect();
    return () => {
      this.studentLocationListeners.delete(callback);
    };
  }

  public onStudentLogout(callback: StudentLogoutCallback): () => void {
    this.studentLogoutListeners.add(callback);
    this.connect();
    return () => {
      this.studentLogoutListeners.delete(callback);
    };
  }

  public onStudentCheckout(callback: StudentCheckoutCallback): () => void {
    this.studentCheckoutListeners.add(callback);
    this.connect();
    return () => {
      this.studentCheckoutListeners.delete(callback);
    };
  }

  public onStudentAttendance(callback: StudentAttendanceCallback): () => void {
    this.studentAttendanceListeners.add(callback);
    this.connect();
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

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("DISCONNECTED");
  }
}

export const wsClient = new BERSEKAWebSocketClient();
