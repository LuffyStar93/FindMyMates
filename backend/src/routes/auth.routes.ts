import { login, logout, me, refresh, register } from "@/controllers/authController";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/requireRole";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/validators";
import { loginSchema, registerSchema } from "@/validators/authSchemas";
import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(register));
router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", requireAuth, asyncHandler(logout));

router.get("/me", requireAuth, asyncHandler(me));

router.get(
  "/admin/metrics",
  requireAuth,
  requireRole("Admin"),
  (_req, res) => res.json({ secret: "only admins" })
);

export default router;