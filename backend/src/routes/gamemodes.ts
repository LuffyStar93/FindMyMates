import {
    createGamemode,
    deleteGamemode,
    getGamemode,
    listGamemodes,
    updateGamemode,
} from "@/controllers/gameModesController";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/requireRole";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    idParamSchema,
    validateBody,
    validateParams,
    validateQuery,
} from "@/validators";
import {
    createGameModeSchema,
    listGameModesQuerySchema,
    updateGameModeSchema,
} from "@/validators/gameModesSchemas";
import { Router } from "express";

const router = Router();

router.get("/", validateQuery(listGameModesQuerySchema), asyncHandler(listGamemodes));
router.get("/:id", validateParams(idParamSchema), asyncHandler(getGamemode));

// CRUD protégés (ex: Moderator/Admin)
router.post(
  "/",
  requireAuth,
  requireRole("Moderator"),
  validateBody(createGameModeSchema),
  asyncHandler(createGamemode)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  validateBody(updateGameModeSchema),
  asyncHandler(updateGamemode)
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  asyncHandler(deleteGamemode)
);

export default router;