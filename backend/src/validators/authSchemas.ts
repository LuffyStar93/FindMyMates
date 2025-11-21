import { z } from "zod";

const MIN_PASSWORD_LEN = Number(process.env.MIN_PASSWORD_LEN ?? 8);

export const discordTagSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[\w .\-@]+(#\d{4})?$/i, "Format Discord invalide")
  .optional()
  .nullable();

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  pseudo: z.string().min(2, "Pseudo trop court"),
  name: z.string().min(1, "Nom requis"),
  password: z
    .string()
    .min(MIN_PASSWORD_LEN, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
    .max(128, "Le mot de passe doit contenir au maximum 128 caractères."),
  discordTag: discordTagSchema,
});

export const loginSchema = z.object({
  emailOrPseudo: z.string().min(3),
  password: z
    .string()
    .min(MIN_PASSWORD_LEN, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
    .max(128, "Le mot de passe doit contenir au maximum 128 caractères."),
});