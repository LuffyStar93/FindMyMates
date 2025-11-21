import { NextFunction, Request, Response } from "express";
import { Role } from "./auth";

const RolePriority: Record<Role, number> = { User: 1, Moderator: 5, Admin: 10 };

/** Minimum role threshold (e.g. requireRole("Moderator")) */
export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Auth required' })
    const role = req.user.role
    return RolePriority[role] >= RolePriority[minRole]
      ? next()
      : res.status(403).json({ message: 'Forbidden' })
  }
}

/** Allow if user's role is one of the allowed list */
export function requireAnyRole(allow: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.user?.role || "User") as Role;
    if (allow.includes(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

/** Allow if acting on own resource (by :id param) OR has one of the elevated roles */
export function requireSelfOrRole(allow: Role[], paramKey = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Auth required" });
    const targetId = Number((req.params as any)[paramKey]);
    const isSelf = Number.isFinite(targetId) && targetId === req.user.id;
    const hasElevated = allow.includes(req.user.role);
    if (isSelf || hasElevated) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}