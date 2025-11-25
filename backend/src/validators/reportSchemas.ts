import { z } from "zod";


export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),

  status: z.enum(["open", "in_progress", "closed"]).optional(),

  reason: z.string().trim().min(1).optional(),

  order: z.enum(["asc", "desc"]).optional(),

  read: z.enum(["unread", "read"]).optional(),
});

/**
 * GET /api/reports/:id
 */
export const getReportParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * PATCH /api/reports/:id/read
 * body { read: boolean }
 */
export const markReportReadSchema = z.object({
  read: z.boolean(),
});

/**
 * PATCH /api/reports/:id/status
 */
export const updateReportStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "closed"]),
});

/**
 * POST /api/reports
 */
export const createReportSchema = z.object({
  ticketId: z.number().int().positive(),
  targetUserIds: z.array(z.number().int().positive()).min(1),
  reason: z.string().min(1),
  description: z.string().min(1),
  files: z.string().url().nullable().optional(),
});