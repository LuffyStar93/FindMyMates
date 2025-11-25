import Users from "@/models/Users";
import { createHttpError } from "@/utils/httpError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type Role
} from "@/utils/jwt";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "fmm_refresh";
const REFRESH_COOKIE_PATH = process.env.REFRESH_COOKIE_PATH || "/api/auth/refresh";
const COOKIE_SECURE = String(process.env.COOKIE_SECURE ?? "false") === "true";

/** Helper pour sérialiser l'utilisateur vers le front */
function toPublicUser(u: Users) {
  return {
    id: u.id,
    email: u.email,
    pseudo: u.pseudo,
    name: u.name,
    role: u.role as Role,
    reputationScore: u.reputationScore,
    bannedAt: u.bannedAt,
    discordTag: u.discordTag,
  };
}

/** Pose le cookie de refresh sécurisé */
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

/** Supprime le cookie de refresh */
function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

/**
 * POST /api/auth/register
 * body: { name, pseudo, email, password, discordTag? }
 */
export const register = async (req: Request, res: Response) => {
  const { name, pseudo, email, password, discordTag } = req.body as {
    name: string;
    pseudo: string;
    email: string;
    password: string;
    discordTag?: string | null;
  };

  const hash = await bcrypt.hash(password, 12);

  const created = await Users.create({
    name,
    pseudo,
    email: email.toLowerCase(),
    password: hash,
    role: "User",
    discordTag: discordTag ? String(discordTag).trim() : null,
  });

  const accessToken = signAccessToken({ sub: String(created.id), role: created.role as Role });
  const refreshToken = signRefreshToken({ sub: String(created.id), role: created.role as Role });

  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    accessToken,
    user: toPublicUser(created),
  });
};

/**
 * POST /api/auth/login
 * body actuel du front: { emailOrPseudo, password }
 * (supporte aussi { email, password } ou { identifier, password })
 */
export const login = async (req: Request, res: Response) => {
  const body = req.body as any;

  const rawEmail: string | undefined = body.email;
  const identifier: string | undefined = body.identifier ?? body.emailOrPseudo;
  const password: string | undefined = body.password;

  if (!password) {
    throw createHttpError(400, "Password is required");
  }

  // On détermine quoi utiliser comme identifiant
  let lookupByEmail: boolean | null = null;
  let value: string | null = null;

  if (rawEmail) {
    lookupByEmail = true;
    value = String(rawEmail).trim();
  } else if (identifier) {
    const idStr = String(identifier).trim();
    if (!idStr) {
      throw createHttpError(400, "Email or identifier is required");
    }
    lookupByEmail = idStr.includes("@");
    value = idStr;
  } else {
    throw createHttpError(400, "Email or identifier is required");
  }

  // Construction du where
  let where: any;
  if (lookupByEmail) {
    where = { email: value!.toLowerCase() };
  } else {
    where = { pseudo: value! };
  }

  const user = await Users.findOne({ where });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (user.bannedAt) {
    throw createHttpError(403, "Votre compte est banni");
  }

  const accessToken = signAccessToken({ sub: String(user.id), role: user.role as Role });
  const refreshToken = signRefreshToken({ sub: String(user.id), role: user.role as Role });

  setRefreshCookie(res, refreshToken);

  return res.json({
    accessToken,
    user: toPublicUser(user),
  });
};

/**
 * POST /api/auth/refresh
 * lit le refresh token dans le cookie, renvoie un nouvel accessToken
 */
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    throw createHttpError(401, "Missing refresh token");
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw createHttpError(401, "Invalid refresh token");
  }

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) {
    clearRefreshCookie(res);
    throw createHttpError(401, "Invalid refresh token subject");
  }

  const user = await Users.findByPk(userId);
  if (!user) {
    clearRefreshCookie(res);
    throw createHttpError(401, "User no longer exists");
  }
  if (user.bannedAt) {
    clearRefreshCookie(res);
    throw createHttpError(403, "Votre compte est banni");
  }

  const newAccess = signAccessToken({ sub: String(user.id), role: user.role as Role });

  return res.json({ accessToken: newAccess });
};

/**
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  return res.json({ ok: true });
};

/**
 * GET /api/auth/me
 */
export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    throw createHttpError(401, "Unauthorized");
  }

  const id = Number(req.user.id);
  const user = await Users.findByPk(id);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return res.json({
    user: toPublicUser(user),
  });
};