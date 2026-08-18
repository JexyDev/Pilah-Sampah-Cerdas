import { Request, Response, NextFunction } from 'express';
import { auditQueue } from '../queues/audit.queue.js';

export const auditMiddleware = (featureCategory: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // We only want to log when the request finishes successfully or with an error
    res.on('finish', async () => {
      // Basic check: we might only want to log modifying actions (POST, PUT, PATCH, DELETE)
      // or all actions. Based on the "full lengkap" requirement, we log everything.
      
      const action = `[${req.method}] ${req.originalUrl}`;
      const endpoint = req.originalUrl;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Attempt to extract user context.
      // Assuming user context is set in req.user by a previous auth middleware.
      const user = (req as any).user;
      const userId = user?.id || null;
      const roleName = user?.role?.name || 'GUEST';

      // Capture request body (useful for newValue/oldValue proxy)
      // Note: In a real system, you might not log full bodies for GET requests.
      const payload = req.method !== 'GET' ? req.body : null;

      // oldValue / newValue is tricky to capture purely in middleware without knowing the DB state.
      // Typically, before/after states are captured at the service layer.
      // But we can store the request payload as `newValue` for creation/updates.
      
      try {
        if (auditQueue) {
          await auditQueue.add('log-action', {
            action,
            userId,
            roleName,
            featureCategory,
            endpoint,
            ipAddress,
            oldValue: null, // Would be populated by specific service methods if needed
            newValue: payload,
          });
        }
      } catch (error) {
        console.error('[Audit Middleware] Failed to enqueue audit log:', error);
      }
    });

    next();
  };
};
