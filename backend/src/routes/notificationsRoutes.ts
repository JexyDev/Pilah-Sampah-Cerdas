import { Router } from "express";
import { notifications } from "../data/db";

const router = Router();

router.get("/", (req, res) => {
  const role = req.query.role as string || "ADMIN";
  
  // Filter notifications based on role
  let userNotifs = notifications;
  
  if (role.toUpperCase() === "WARGA") {
    userNotifs = notifications.filter(n => n.role === "WARGA");
  } else {
    userNotifs = notifications.filter(n => n.role === "ADMIN" || n.role === "ALL");
  }

  res.status(200).json({
    status: "success",
    data: userNotifs
  });
});

export default router;
