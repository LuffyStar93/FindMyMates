import {
    createReport,
    deleteReport,
    getReport,
    getTicketReports,
    getUserReportsCreated,
    getUserReportsReceived,
    listReports,
    markReportRead,
    updateReportStatus,
} from "@/controllers/reportsController";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/requireRole";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    idParamSchema,
    ticketIdParamSchema,
    userIdParamSchema,
    validateBody,
    validateParams,
    validateQuery,
} from "@/validators";
import {
    createReportSchema,
    listReportsQuerySchema,
    markReportReadSchema,
    updateReportStatusSchema,
} from "@/validators/reportSchemas";
import { Router } from "express";

const router = Router();

// Liste (avec filtres)
router.get("/", requireAuth, validateQuery(listReportsQuerySchema), asyncHandler(listReports));

// Collections spécialisées
router.get("/ticket/:ticketId", requireAuth, validateParams(ticketIdParamSchema), asyncHandler(getTicketReports));
router.get("/users/:userId/received", requireAuth, validateParams(userIdParamSchema), asyncHandler(getUserReportsReceived));
router.get("/users/:userId/created", requireAuth, validateParams(userIdParamSchema), asyncHandler(getUserReportsCreated));

// Création d'un report
router.post("/", requireAuth, validateBody(createReportSchema), asyncHandler(createReport));

// Actions sur une ressource
router.get("/:id", requireAuth, validateParams(idParamSchema), asyncHandler(getReport));

router.patch(
  "/:id/read",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  validateBody(markReportReadSchema),
  asyncHandler(markReportRead)
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("Moderator"),
  validateParams(idParamSchema),
  validateBody(updateReportStatusSchema),
  asyncHandler(updateReportStatus)
);

router.delete("/:id", requireAuth, requireRole("Moderator"), validateParams(idParamSchema), asyncHandler(deleteReport));

export default router;