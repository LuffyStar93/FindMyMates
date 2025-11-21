import {
  gameIdParamSchema,
  gameModeIdParamSchema,
  userIdParamSchema,
} from "@/validators";
import { z } from "zod";

/**
 * Corps pour POST/PUT (upsert / update)
 * { rankId: number }
 */
export const upsertUserRankBodySchema = z.object({
  rankId: z.coerce.number().int().positive(),
});

/**
 * GET /user-ranks/:userId
 */
export const listUserRanksParamsSchema = userIdParamSchema;

/**
 * POST /user-ranks/:userId
 */
export const setUserRankParamsSchema = userIdParamSchema;

/**
 * PUT /user-ranks/:userId
 */
export const updateUserRankParamsSchema = userIdParamSchema;

/**
 * DELETE /user-ranks/:userId/by-rank/:rankId
 */
export const deleteUserRankByRankIdParamsSchema = z.object({
  userId: userIdParamSchema.shape.userId,
  rankId: z.coerce.number().int().positive(),
});

/**
 * DELETE /user-ranks/:userId/:gameId
 */
export const deleteUserRankGameParamsSchema = z.object({
  userId: userIdParamSchema.shape.userId,
  gameId: gameIdParamSchema.shape.gameId,
});

/**
 * DELETE /user-ranks/:userId/:gameId/:gameModeId
 */
export const deleteUserRankGameModeParamsSchema = z.object({
  userId: userIdParamSchema.shape.userId,
  gameId: gameIdParamSchema.shape.gameId,
  gameModeId: gameModeIdParamSchema.shape.gameModeId,
});