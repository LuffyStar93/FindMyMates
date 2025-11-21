import {
    createLabelRank,
    deleteLabelRank,
    getLabelRank,
    listLabelRanks,
    listLabelRanksByGame,
    listLabelRanksByGameMode,
    updateLabelRank,
} from "@/controllers/labelRanksController";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/requireRole";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    gameIdParamSchema,
    gameModeIdParamSchema,
    idParamSchema,
    validateBody,
    validateParams,
    validateQuery,
} from "@/validators";
import {
    createLabelRankSchema,
    rankListQuerySchema,
    updateLabelRankSchema,
} from "@/validators/rankSchemas";
import { Router } from "express";

const router = Router();

// Liste globale
router.get("/", validateQuery(rankListQuerySchema), asyncHandler(listLabelRanks));

// Spécifiques (avant "/:id")
router.get("/by-game/:gameId", validateParams(gameIdParamSchema), asyncHandler(listLabelRanksByGame));
router.get("/by-gamemode/:gameModeId", validateParams(gameModeIdParamSchema), asyncHandler(listLabelRanksByGameMode));

// Détail
router.get("/:id", validateParams(idParamSchema), asyncHandler(getLabelRank));

// CRUD protégés
router.post(
  "/",
  requireAuth,
  requireRole("Moderator"),
  validateBody(createLabelRankSchema),
  asyncHandler(createLabelRank)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  validateBody(updateLabelRankSchema),
  asyncHandler(updateLabelRank)
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  asyncHandler(deleteLabelRank)
);

export default router;