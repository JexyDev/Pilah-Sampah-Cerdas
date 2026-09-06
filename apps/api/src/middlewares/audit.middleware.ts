import { Request, Response, NextFunction } from "express";
import { auditQueue } from "../queues/audit.queue.js";

export const auditMiddleware = (featureCategory: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // We only want to log when the request finishes successfully or with an error
    res.on("finish", async () => {
      // Only log mutations (POST, PUT, PATCH, DELETE) or specific auth endpoints, skip GET/HEAD/OPTIONS and static assets
      const method = req.method;
      const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
      const isAuthEvent =
        req.originalUrl.includes("/auth/") && !req.originalUrl.includes("/auth/me");
      const isStaticOrHealth =
        req.originalUrl.startsWith("/uploads") ||
        req.originalUrl.includes("/health") ||
        req.originalUrl.includes("/docs");
      const isHighFrequency =
        req.originalUrl.includes("/location-ping") ||
        req.originalUrl.includes("/ping") ||
        req.originalUrl.includes("/notifications");

      if (!isMutation && !isAuthEvent) {
        return;
      }
      if (isStaticOrHealth || isHighFrequency) {
        return;
      }

      const action = `[${req.method}] ${req.originalUrl}`;
      const endpoint = req.originalUrl;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      // Attempt to extract user context.
      const user = (req as any).user;
      const userId = user?.userId || user?.id || null;
      const roleName = typeof user?.role === "string" ? user.role : user?.role?.name || "GUEST";

      // Capture request body for mutations
      const payload = req.method !== "GET" ? req.body : null;

      try {
        if (auditQueue) {
          await auditQueue.add("log-action", {
            action,
            userId,
            roleName,
            featureCategory,
            endpoint,
            ipAddress,
            oldValue: null,
            newValue: payload,
          });
        }
      } catch (error) {
        console.error("[Audit Middleware] Failed to enqueue audit log:", error);
      }
    });

    next();
  };
};
