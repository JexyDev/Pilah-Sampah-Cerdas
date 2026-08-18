/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * WebSocket Real-Time Client for TrashCare
 */

type DepositCallback = (deposit: any) => void;
type StatusCallback = (status: "CONNECTED" | "CONNECTING" | "DISCONNECTED") => void;

class TrashcareWebSocketClient {
  private socket: WebSocket | null = null;
  private depositListeners: Set<DepositCallback> = new Set();
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
                console.error("[WS] listener error:", err);
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
