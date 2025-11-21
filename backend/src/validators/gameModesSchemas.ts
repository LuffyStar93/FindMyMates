import { z } from 'zod'

export const createGameModeSchema = z.object({
  gameId: z.coerce.number().int().positive(),
  modeName: z.string().min(2),
  playersMax: z.coerce.number().int().min(1).max(10),
  isRanked: z.boolean().optional(),
})

export const updateGameModeSchema = z.object({
  modeName: z.string().min(2).optional(),
  playersMax: z.coerce.number().int().min(1).max(10).optional(),
  isRanked: z.boolean().optional(),
})

// Filtres pour GET /gamemodes
export const listGameModesQuerySchema = z.object({
  gameId: z.coerce.number().int().positive().optional(),
  rankedOnly: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})