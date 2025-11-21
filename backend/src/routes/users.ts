import {
  changePassword,
  createUser,
  deleteUser,
  getUser,
  listUserTickets,
  listUsers,
  updateUser,
} from "@/controllers/usersController";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/requireRole";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody, validateParams, validateQuery } from "@/validators";
import { Router } from "express";

import {
  changePasswordBodySchema,
  changePasswordParamsSchema,
  createUserBodySchema,
  deleteUserParamsSchema,
  getUserParamsSchema,
  listUserTicketsParamsSchema,
  listUserTicketsQuerySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  updateUserParamsSchema,
} from "@/validators/userSchemas";

const router = Router();

// Liste des utilisateurs (filtrable)
router.get(
  "/",
  requireAuth,
  requireRole("Moderator"),
  validateQuery(listUsersQuerySchema),
  asyncHandler(listUsers)
);

// Détails d’un utilisateur
router.get(
  "/:id",
  requireAuth,
  validateParams(getUserParamsSchema),
  asyncHandler(getUser)
);

// Historique tickets d’un utilisateur
router.get(
  "/:id/tickets",
  requireAuth,
  validateParams(listUserTicketsParamsSchema),
  validateQuery(listUserTicketsQuerySchema),
  asyncHandler(listUserTickets)
);

// Création d’un utilisateur (admin)
router.post(
  "/",
  requireAuth,
  requireRole("Admin"),
  validateBody(createUserBodySchema),
  asyncHandler(createUser)
);

// Mise à jour d’un utilisateur
router.put(
  "/:id",
  requireAuth,
  validateParams(updateUserParamsSchema),
  validateBody(updateUserBodySchema),
  asyncHandler(updateUser)
);

// Changement de mot de passe (self)
router.put(
  "/:id/password",
  requireAuth,
  validateParams(changePasswordParamsSchema),
  validateBody(changePasswordBodySchema),
  asyncHandler(changePassword)
);

// Suppression d’un utilisateur (admin)
router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin"),
  validateParams(deleteUserParamsSchema),
  asyncHandler(deleteUser)
);

export default router;