import { castVote, deleteVote, listVotes, updateVote } from "@/controllers/votesController";
import { requireAuth } from "@/middlewares/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  ticketIdParamSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "@/validators";
import {
  castVoteSchema,
  deleteVoteSchema,
  listVotesQuerySchema,
  updateVoteSchema,
} from "@/validators/voteSchemas";
import { Router } from "express";

const router = Router();

router.post(
  "/tickets/:ticketId/votes",
  requireAuth,
  validateParams(ticketIdParamSchema),
  validateBody(castVoteSchema),
  asyncHandler(castVote)
);

router.get(
  "/tickets/:ticketId/votes",
  requireAuth,
  validateParams(ticketIdParamSchema),
  validateQuery(listVotesQuerySchema),
  asyncHandler(listVotes)
);

router.put(
  "/tickets/:ticketId/votes",
  requireAuth,
  validateParams(ticketIdParamSchema),
  validateBody(updateVoteSchema),
  asyncHandler(updateVote)
);

router.delete(
  "/tickets/:ticketId/votes",
  requireAuth,
  validateParams(ticketIdParamSchema),
  validateBody(deleteVoteSchema),
  asyncHandler(deleteVote)
);

export default router;