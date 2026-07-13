import { Router } from "express";
import { users } from "../data/db";

const router = Router();

router.post("/login", (req, res) => {
  const { nik, password } = req.body;

  if (!nik || !password) {
    return res.status(400).json({ status: "error", message: "NIK and password are required" });
  }

  const user = users.find(u => u.nik === nik && u.password === password);

  if (!user) {
    return res.status(401).json({ status: "error", message: "Invalid credentials" });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    status: "success",
    data: {
      token: "mock-jwt-token-1234567890",
      user: userWithoutPassword
    }
  });
});

export default router;
