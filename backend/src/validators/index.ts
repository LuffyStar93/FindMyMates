import type { RequestHandler } from "express";
import { z } from "zod";

/** Middleware générique pour req.body */
export function validateBody<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid body",
        details: parsed.error.flatten(),
      });
    }
    req.body = parsed.data as unknown as typeof req.body;
    next();
  };
}

/** Middleware générique pour req.query */
export function validateQuery<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid query",
        details: parsed.error.flatten(),
      });
    }
    (req as any).query = parsed.data;
    next();
  };
}

/** Middleware générique pour req.params */
export function validateParams<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid params",
        details: parsed.error.flatten(),
      });
    }
    (req as any).params = parsed.data;
    next();
  };
}

// ---------- Schémas communs réutilisables ----------

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const ticketIdParamSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

export const gameIdParamSchema = z.object({
  gameId: z.coerce.number().int().positive(),
});

export const gameModeIdParamSchema = z.object({
  gameModeId: z.coerce.number().int().positive(),
});

export const rankIdParamSchema = z.object({
  rankId: z.coerce.number().int().positive(),
});

/** Convertit "true/false/1/0" en booléen pour les query params */
export const booleanQuery = z.preprocess((v) => {
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  if (typeof v === "number") return v === 1;
  return v;
}, z.boolean());

/** Pagination/tri génériques */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});