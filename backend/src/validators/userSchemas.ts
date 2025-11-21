import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const listUsersQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const getUserParamsSchema = idParam;
export const listUserTicketsParamsSchema = idParam;

export const listUserTicketsQuerySchema = z.object({
  role: z.enum(["participant", "creator"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export const createUserParamsSchema = z.object({});
export const deleteUserParamsSchema = idParam;
export const updateUserParamsSchema = idParam;
export const changePasswordParamsSchema = idParam;

export const discordTagField = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[\w .\-@]+(#\d{4})?$/i, "Format Discord invalide")
  .optional()
  .nullable();

export const createUserBodySchema = z.object({
  name: z.string().min(1),
  pseudo: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["User", "Admin", "Moderator"]).optional(),
  discordTag: discordTagField,
});

export const updateUserBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    pseudo: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["User", "Admin", "Moderator"]).optional(),
    reputationScore: z.number().int().optional(),
    banned: z.boolean().optional(),
    discordTag: discordTagField,
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.pseudo !== undefined ||
      body.email !== undefined ||
      body.role !== undefined ||
      body.reputationScore !== undefined ||
      body.banned !== undefined ||
      body.discordTag !== undefined,
    {
      message: "Aucun champ à mettre à jour",
    }
  );

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
});