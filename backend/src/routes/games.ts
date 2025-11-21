import {
    createGame,
    deleteGame,
    getGame,
    listGames,
    listGameTickets,
    updateGame,
} from "@/controllers/gamesController";
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
    createGameSchema,
    listGamesQuerySchema,
    listGameTicketsQuerySchema,
    updateGameSchema,
} from "@/validators/gamesSchemas";
import { Router } from "express";

const router = Router();

router.get("/", validateQuery(listGamesQuerySchema), asyncHandler(listGames));
router.get("/:id", validateParams(idParamSchema), asyncHandler(getGame));

router.get(
  "/:id/tickets",
  requireAuth,
  validateParams(idParamSchema),
  validateQuery(listGameTicketsQuerySchema),
  asyncHandler(listGameTickets)
);

// CRUD protégés
router.post(
  "/",
  requireAuth,
  requireRole("Moderator"),
  validateBody(createGameSchema),
  asyncHandler(createGame)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  validateBody(updateGameSchema),
  asyncHandler(updateGame)
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  asyncHandler(deleteGame)
);

export default router;