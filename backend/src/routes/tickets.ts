import {
  closeTicketByOwner,
  createTicket,
  deleteTicket,
  getTicket,
  joinTicket,
  listTickets,
  updateTicket,
} from "@/controllers/ticketsController";
import { requireAuth } from "@/middlewares/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  idParamSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "@/validators";
import {
  createTicketSchema,
  joinTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "@/validators/ticketSchemas";
import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

// Anti-spam sur la création/join
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// List & get
router.get("/", validateQuery(listTicketsQuerySchema), asyncHandler(listTickets));
router.get("/:id", requireAuth, validateParams(idParamSchema), asyncHandler(getTicket));

// Create / Join
router.post(
  "/",
  requireAuth,
  createLimiter,
  validateBody(createTicketSchema),
  asyncHandler(createTicket)
);
router.post(
  "/:id/join",
  requireAuth,
  joinLimiter,
  validateParams(idParamSchema),
  validateBody(joinTicketSchema),
  asyncHandler(joinTicket)
);

// Update / Archive / Close / Delete
router.put(
  "/:id",
  requireAuth,
  validateParams(idParamSchema),
  validateBody(updateTicketSchema),
  asyncHandler(updateTicket) 
);

router.patch(
  "/:id/close",
  requireAuth,
  validateParams(idParamSchema),
  asyncHandler(closeTicketByOwner)
);

router.delete(
  "/:id",
  requireAuth,
  validateParams(idParamSchema),
  asyncHandler(deleteTicket)
);

export default router;