import { verifyAccessToken } from "../utils/jwtUtils.js";
export const authMiddleware = (req, res, next) => {
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
        // Verify token
        const decoded = verifyAccessToken(token);
        req.user = decoded; // Attach user payload to request
        next();
    }
    catch (error) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Token tidak valid atau sudah kadaluarsa" });
    }
};
