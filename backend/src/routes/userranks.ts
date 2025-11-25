import {
  deleteUserRank,
  deleteUserRankByRankId,
  listUserRanks,
  setUserRank,
  updateUserRank,
} from "@/controllers/userRanksController";
import { requireAuth } from "@/middlewares/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody, validateParams } from "@/validators";
import {
  deleteUserRankByRankIdParamsSchema,
  deleteUserRankGameModeParamsSchema,
  deleteUserRankGameParamsSchema,
  listUserRanksParamsSchema,
  setUserRankParamsSchema,
  updateUserRankParamsSchema,
  upsertUserRankBodySchema,
} from "@/validators/userRankSchemas";
import { Router, type NextFunction, type Request, type Response } from "express";

const router = Router();

/**
 * Autorise l’utilisateur lui-même ou un Moderator/Admin à agir sur :userId
 */
function ensureSelfOrRoles(req: Request, res: Response, next: NextFunction) {
  const auth = req.user;
  const targetUserId = Number((req.params as any).userId);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const isSelf = Number(auth.id) === targetUserId;
  const isStaff = auth.role === "Moderator" || auth.role === "Admin";
  if (isSelf || isStaff) return next();

  return res.status(403).json({ error: "Forbidden" });
}

// Lire les rangs d’un user (self ou staff)
router.get(
  "/:userId",
  requireAuth,
  validateParams(listUserRanksParamsSchema),
  ensureSelfOrRoles,
  asyncHandler(listUserRanks)
);

// Upsert (self ou staff)
router.post(
  "/:userId",
  requireAuth,
  validateParams(setUserRankParamsSchema),
  validateBody(upsertUserRankBodySchema),
  ensureSelfOrRoles,
  asyncHandler(setUserRank)
);

// Update strict (self ou staff)
router.put(
  "/:userId",
  requireAuth,
  validateParams(updateUserRankParamsSchema),
  validateBody(upsertUserRankBodySchema),
  ensureSelfOrRoles,
  asyncHandler(updateUserRank)
);

// Delete par rankId (self ou staff)
router.delete(
  "/:userId/by-rank/:rankId",
  requireAuth,
  validateParams(deleteUserRankByRankIdParamsSchema),
  ensureSelfOrRoles,
  asyncHandler(deleteUserRankByRankId)
);

// Delete par scope précis (mode) — spécifique AVANT global
router.delete(
  "/:userId/:gameId/:gameModeId",
  requireAuth,
  validateParams(deleteUserRankGameModeParamsSchema),
  ensureSelfOrRoles,
  asyncHandler(deleteUserRank)
);

// Delete par scope global (jeu)
router.delete(
  "/:userId/:gameId",
  requireAuth,
  validateParams(deleteUserRankGameParamsSchema),
  ensureSelfOrRoles,
  asyncHandler(deleteUserRank)
);

export default router;