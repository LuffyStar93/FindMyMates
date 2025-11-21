import { z } from "zod";

/**
 * POST /api/tickets
 * body: { userId, gameModeId, capacity? }
 */
export const createTicketSchema = z.object({
  userId: z.number().int().positive(),
  gameModeId: z.number().int().positive(),
  capacity: z.number().int().positive().optional(),
});

/**
 * POST /api/tickets/:id/join
 * body: { userId }
 */
export const joinTicketSchema = z.object({
  userId: z.number().int().positive(),
});

/**
 * PUT /api/tickets/:id
 * body: { status?, capacity?, gameModeId? }
 */
export const updateTicketSchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  capacity: z.number().int().positive().optional(),
  gameModeId: z.number().int().positive().optional(),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  modeId: z.coerce.number().int().positive().optional(),
  gameId: z.coerce.number().int().positive().optional(),
  ranked: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type JoinTicketInput = z.infer<typeof joinTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;