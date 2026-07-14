/**
 * Role-Based Access Control (RBAC) Middleware.
 * This should be placed AFTER `authMiddleware` so that `req.user` is available.
 *
 * @param allowedRoles Array of role names that are allowed to access the route
 */
export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ error: "UNAUTHORIZED", message: "User belum terotentikasi" });
                return;
            }
            if (!allowedRoles.includes(user.role)) {
                res.status(403).json({ error: "FORBIDDEN", message: "Anda tidak memiliki akses ke resource ini" });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi role pengguna" });
        }
    };
};
