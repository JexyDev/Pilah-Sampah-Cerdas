import { Router } from "express";
import { users } from "../data/db";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    data: users.map(u => {
      // Exclude password from response
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    })
  });
});

export default router;
