import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class AuditWebSocketService {
  private static instance: AuditWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): AuditWebSocketService {
    if (!AuditWebSocketService.instance) {
      AuditWebSocketService.instance = new AuditWebSocketService();
    }
    return AuditWebSocketService.instance;
  }

  public initialize(server: Server, path: string = '/ws/audit') {
    this.wss = new WebSocketServer({ server, path });
    console.log(`[Audit WebSocket] Server initialized on path: ${path}`);

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log(`[Audit WebSocket] Client connected from ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[Audit WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[Audit WebSocket] Error:', error);
      });
      
      // Send a welcome message
      ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Audit Log Stream' }));
    });
  }

  public broadcastLog(logData: any) {
    if (this.clients.size === 0) return;

    const message = JSON.stringify({
      type: 'NEW_AUDIT_LOG',
      data: logData,
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[Audit WebSocket] Failed to send message to client:', error);
        }
      }
    });
  }
}

export const auditWsService = AuditWebSocketService.getInstance();
