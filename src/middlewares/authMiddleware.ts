import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwtUtils.js";

// Extend Express Request object to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = "";

    // 1. Try to get token from HttpOnly Cookie (Web Client)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Try to get token from Authorization header (Mobile App)
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Token otentikasi tidak ditemukan" });
      return;
    }

    // DEV BYPASS
    if (process.env.NODE_ENV === "development" && token === "MOCK_TOKEN_ADMIN") {
      req.user = { userId: "mock-admin-id", role: "ADMIN" };
      return next();
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    res
      .status(401)
      .json({ error: "UNAUTHORIZED", message: "Token tidak valid atau sudah kadaluarsa" });
  }
};
