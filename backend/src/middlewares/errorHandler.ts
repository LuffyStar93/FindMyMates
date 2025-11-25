import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "sequelize";
import { ZodError } from "zod";

const isProd = process.env.NODE_ENV === "production";

/**
 * Middleware d’erreur global:
 * - Uniformise la réponse JSON
 * - Mappe quelques erreurs communes (Zod/Sequelize/JWT)
 * - Ne fuit pas les stacks en prod
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Détermine le status par défaut
  let status = (typeof err.status === "number" && err.status) || (typeof err.statusCode === "number" && err.statusCode) || 500;

  if (err.name === "UnauthorizedError") status = 401;
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") status = 401;

  // Zod validation
  if (err instanceof ZodError) {
    status = 400;
    return res.status(status).json({
      error: "ValidationError",
      message: "Payload invalide",
      details: err.flatten?.() ?? err.issues,
    });
  }

  // Sequelize validation / unique
  if (err instanceof ValidationError) {
    status = 400;
    return res.status(status).json({
      error: "SequelizeValidationError",
      message: err.message,
      details: err.errors?.map(e => ({ message: e.message, path: e.path })),
    });
  }
  if (err?.name === "SequelizeUniqueConstraintError") {
    status = 409;
    return res.status(status).json({
      error: "Conflict",
      message: err.message || "Duplicate entry",
    });
  }

  // Rate limit (si express-rate-limit)
  if (err?.name === "RateLimitError") {
    status = 429;
  }

  // Fallback générique
  const payload: any = {
    error: err?.name || "InternalServerError",
    message: err?.message || "Internal error",
  };
  if (!isProd) {
    payload.stack = err?.stack;
  }

  res.status(status).json(payload);
}