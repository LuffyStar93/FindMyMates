import { z } from "zod";
import { idParamSchema } from "./index";

/** Query pour GET /ranks?gameId=&gameModeId=&q= */
export const rankListQuerySchema = z.object({
  gameId: z.coerce.number().int().positive().optional(),
  /** Autorise "null" (texte) pour cibler les rangs globaux (gameModeId NULL) */
  gameModeId: z
    .union([z.literal("null"), z.coerce.number().int().positive()])
    .optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

/** Params : /ranks/:id (tu peux aussi réutiliser idParamSchema depuis ./index) */
export const rankIdParamSchema = idParamSchema;

/** Body pour POST /ranks */
export const createLabelRankSchema = z.object({
  rankName: z.string().trim().min(1).max(100),
  gameId: z.coerce.number().int().positive(),
  gameModeId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
});

/** Body pour PUT /ranks/:id (tous les champs optionnels) */
export const updateLabelRankSchema = z.object({
  rankName: z.string().trim().min(1).max(100).optional(),
  gameId: z.coerce.number().int().positive().optional(),
  gameModeId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
});

/** Params : /ranks/by-game/:gameId */
export const ranksByGameParamsSchema = z.object({
  gameId: z.coerce.number().int().positive(),
});

/** Params : /ranks/by-gamemode/:gameModeId */
export const ranksByGameModeParamsSchema = z.object({
  gameModeId: z.coerce.number().int().positive(),
});