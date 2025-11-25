import { z } from "zod";
import { booleanQuery, paginationQuerySchema } from "./index";

/** Création d’un jeu */
export const createGameSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  urlImage: z.string().url().optional().or(z.literal("").transform(() => undefined)),
});

/** Mise à jour partielle d’un jeu */
export const updateGameSchema = createGameSchema.partial();

/** Liste des jeux (query) */
export const listGamesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
});

/** Liste des tickets d’un jeu (query) */
export const listGameTicketsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["open", "closed"]).optional(),
  isActive: booleanQuery.optional(),
  isRanked: booleanQuery.optional(),
});