import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type Role = "User" | "Moderator" | "Admin";
export type AuthUser = { id: number; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const ALLOWED_ROLES: Role[] = ["User", "Moderator", "Admin"];

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing Bearer token" });

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    // Fail closed if misconfigured
    return res.status(500).json({ message: "Server JWT misconfiguration" });
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;

    const idNum = Number(payload.sub);
    const role = String(payload.role || "User") as Role;

    if (!Number.isFinite(idNum)) return res.status(401).json({ message: "Invalid token subject" });
    if (!ALLOWED_ROLES.includes(role)) return res.status(401).json({ message: "Invalid token role" });

    req.user = { id: idNum, role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}