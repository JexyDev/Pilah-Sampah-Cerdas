/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * WebSocket Real-Time Client for TrashCare
 */

type DepositCallback = (deposit: any) => void;
type StudentLocationCallback = (locationData: any) => void;
type StudentLogoutCallback = (data: { studentId: string; loggedOutAt?: string; removedAt?: string }) => void;
type StudentCheckoutCallback = (checkoutData: any) => void;
type StatusCallback = (status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") => void;

class TrashcareWebSocketClient {
  private socket: WebSocket | null = null;
  private depositListeners: Set<DepositCallback> = new Set();
  private studentLocationListeners: Set<StudentLocationCallback> = new Set();
  private studentLogoutListeners: Set<StudentLogoutCallback> = new Set();
  private studentCheckoutListeners: Set<StudentCheckoutCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimeout: any = null;
  private status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" = "DISCONNECTED";
  private isIntentionallyClosed = false;

  private getWsUrl(): string {
    if (typeof window === "undefined") return "ws://localhost:3000";

    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "wss:" : "ws:";
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }

    return `${protocol}//${window.location.host}`;
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
        const token = localStorage.getItem("psc_access_token") ?? sessionStorage.getItem("psc_access_token");
        if (token && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "AUTH", token }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
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
          }
        } catch (e) {
          // Non-JSON or ignored frame
        }
      };

      this.socket.onclose = () => {
        this.setStatus("DISCONNECTED");
        this.socket = null;
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.setStatus("DISCONNECTED");
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (err) {
      console.error("[WS] Connection init error:", err);
      this.setStatus("DISCONNECTED");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 4000);
  }

  private setStatus(status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
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

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("DISCONNECTED");
  }
}

export const wsClient = new TrashcareWebSocketClient();
