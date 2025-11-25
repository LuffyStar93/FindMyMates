import { z } from "zod";
import { paginationQuerySchema } from "./index";

/** Type de vote */
export const voteTypeSchema = z.enum(["up", "down"]);

/** Créer un vote (POST /tickets/:ticketId/votes) */
export const castVoteSchema = z.object({
  voterUserId: z.coerce.number().int().positive(),
  targetUserId: z.coerce.number().int().positive(),
  type: voteTypeSchema,
});

/** Mettre à jour un vote (PUT /tickets/:ticketId/votes) */
export const updateVoteSchema = z.object({
  voterUserId: z.coerce.number().int().positive(),
  targetUserId: z.coerce.number().int().positive(),
  type: voteTypeSchema,
});

/** Supprimer un vote (DELETE /tickets/:ticketId/votes) */
export const deleteVoteSchema = z.object({
  voterUserId: z.coerce.number().int().positive(),
  targetUserId: z.coerce.number().int().positive(),
});

/** Lister les votes d’un ticket (GET /tickets/:ticketId/votes?by=...) 
 */
export const listVotesQuerySchema = paginationQuerySchema.extend({
  by: z.coerce.number().int().positive().optional(),
});