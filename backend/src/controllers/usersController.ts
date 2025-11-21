import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import models from "../models";
import GameModes from "../models/GameModes";
import Games from "../models/Games";
import LabelRanks from "../models/LabelRanks";
import Tickets from "../models/Tickets";
import UserRank from "../models/UserRank";
import Users from "../models/Users";

const userPublic = [
  "id",
  "name",
  "pseudo",
  "email",
  "role",
  "reputationScore",
  "bannedAt",
  "discordTag",
] as const;

// GET /api/users
export const listUsers = async (_req: Request, res: Response) => {
  try {
    const rows = (await Users.findAll({
      attributes: [...userPublic],
      include: [
        {
          model: UserRank,
          as: "ranks",
          attributes: ["id", "gameId", "gameModeId", "rankId"],
          include: [
            { model: LabelRanks, as: "labelRank", attributes: ["id", "rankName"] },
            { model: Games, as: "game", attributes: ["id", "name"] },
            { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
          ],
        },
      ],
      order: [["id", "ASC"]],
    })) as any[];

    const users = rows.map((row: any) => {
      const u = row.toJSON();
      u.ranks = (u.ranks ?? []).map((r: any) => ({
        id: r.id,
        gameId: r.gameId,
        gameModeId: r.gameModeId ?? null,
        rankId: r.rankId,
        gameName: r.game ? r.game.name : null,
        gameModeName: r.mode ? r.mode.modeName : null,
        rankName: r.labelRank ? r.labelRank.rankName : null,
      }));
      return u;
    });

    res.json(users);
  } catch (e) {
    console.error("listUsers error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response) => {
  try {
    const row = (await Users.findByPk(Number(req.params.id), {
      attributes: [...userPublic],
      include: [
        {
          model: UserRank,
          as: "ranks",
          attributes: ["id", "gameId", "gameModeId", "rankId"],
          include: [
            { model: LabelRanks, as: "labelRank", attributes: ["id", "rankName"] },
            { model: Games, as: "game", attributes: ["id", "name"] },
            { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
          ],
        },
      ],
    })) as any;

    if (!row) return res.status(404).json({ message: "User not found" });

    const u = row.toJSON();
    u.ranks = (u.ranks ?? []).map((r: any) => ({
      id: r.id,
      gameId: r.gameId,
      gameModeId: r.gameModeId ?? null,
      rankId: r.rankId,
      gameName: r.game ? r.game.name : null,
      gameModeName: r.mode ? r.mode.modeName : null,
      rankName: r.labelRank ? r.labelRank.rankName : null,
    }));

    res.json(u);
  } catch (e) {
    console.error("getUser error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/users/:id/tickets
export const getUserTickets = async (req: Request, res: Response) => {
  try {
    const u = await Users.findByPk(Number(req.params.id));
    if (!u) return res.status(404).json({ message: "User not found" });

    const tickets = await Tickets.findAll({
      where: { userId: u.id } as any,
      include: [
        {
          model: GameModes,
          as: "gameMode",
          attributes: ["id", "modeName", "gameId"],
          include: [{ model: Games, as: "game", attributes: ["id", "name", "urlImage"] }],
        },
      ],
      order: [["createdAt", "DESC" as const]],
    });
    res.json(tickets);
  } catch (e) {
    console.error("getUserTickets error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, pseudo, email, password, role, discordTag } = req.body as {
      name?: string;
      pseudo?: string;
      email?: string;
      password?: string;
      role?: "User" | "Admin" | "Moderator";
      discordTag?: string | null;
    };
    if (!name || !pseudo || !email || !password) {
      return res.status(400).json({ message: "name, pseudo, email and password are required" });
    }

    const created = await Users.create({
      name,
      pseudo,
      email,
      password,
      role: role ?? "User",
      discordTag: discordTag ?? null,
    });

    const safe = await Users.findByPk(created.id, {
      attributes: [...userPublic],
    });
    return res.status(201).json(safe);
  } catch (e: any) {
    if (e?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "pseudo or email already exists" });
    }
    console.error("createUser error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response) => {
  const auth = req.user;
  if (!auth) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const targetId = Number(req.params.id);
  if (!Number.isFinite(targetId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  const isSelf = Number(auth.id) === targetId;
  const isAdmin = auth.role === "Admin";
  const isStaff = auth.role === "Admin" || auth.role === "Moderator";

  const body = req.body as {
    name?: string;
    pseudo?: string;
    email?: string;
    role?: "User" | "Admin" | "Moderator";
    reputationScore?: number;
    banned?: boolean;
    discordTag?: string | null;
  };

  const user = await Users.findByPk(targetId);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  // Droit d'accès général : soi-même ou staff
  if (!isSelf && !isStaff) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Construction du patch autorisé selon rôle
  const patch: Partial<Users> = {};

  // Self ou staff : peuvent modifier name/pseudo/discordTag
  if (body.name !== undefined) patch.name = body.name;
  if (body.pseudo !== undefined) patch.pseudo = body.pseudo;
  if (body.discordTag !== undefined) patch.discordTag = body.discordTag;

  // Champs sensibles → Admin only
  if (!isAdmin) {
    if (
      body.email !== undefined ||
      body.role !== undefined ||
      body.reputationScore !== undefined ||
      body.banned !== undefined
    ) {
      return res
        .status(403)
        .json({ message: "Seul un administrateur peut modifier ces champs" });
    }
  } else {
    // Admin : peut modifier email / role / reputationScore / banned
    if (body.email !== undefined) patch.email = body.email;
    if (body.role !== undefined) patch.role = body.role;
    if (body.reputationScore !== undefined) patch.reputationScore = body.reputationScore;

    if (body.banned !== undefined) {
      patch.bannedAt = body.banned ? new Date() : null;
    }
  }

  // Si aucun champ à modifier
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ message: "Aucun champ à mettre à jour" });
  }

  await Users.update(patch, { where: { id: targetId } });

  const updated = await Users.findByPk(targetId, {
    attributes: ["id", "name", "pseudo", "email", "role", "reputationScore", "bannedAt", "discordTag"],
  });

  return res.json({ ok: true, user: updated });
};

// PATCH /api/users/:id/password
export const changePassword = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword et newPassword sont requis" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({
      message: `Le nouveau mot de passe doit contenir au moins 8 caractères.`,
    });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: "Le nouveau mot de passe doit être différent du précèdent",
    });
  }

  const requesterId = Number((req as any).user?.id);
  const role = ((req as any).user?.role || "User") as "User" | "Moderator" | "Admin";
  if (requesterId !== id && role !== "Admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const user = await (models as any).Users.findByPk(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(currentPassword, (user as any).password);
  if (!ok) {
    return res.status(400).json({ message: "Mot de passe actuel invalide" });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await (models as any).Users.update({ password: hash }, { where: { id } });

  return res.json({ ok: true });
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await Users.findByPk(id);
    if (!found) return res.status(404).json({ message: "User not found" });

    await Users.destroy({ where: { id } });
    res.json({ ok: true, message: "User deleted", id });
  } catch (e) {
    console.error("deleteUser error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/users/:id/tickets?
export const listUserTickets = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid user id" });

    const role = String(req.query.role ?? "participant");
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const orderDir = String(req.query.order ?? "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const status = req.query.status ? String(req.query.status) : undefined;

    const where: any = {};
    if (status) where.status = status;

    if (role === "creator") {
      const rows = await Tickets.findAll({
        where: { ...where, userId: id },
        order: [["createdAt", orderDir]],
        limit,
        include: [
          {
            model: GameModes,
            as: "gameMode",
            attributes: ["id", "modeName", "playersMax", "isRanked"],
            include: [{ model: Games, as: "game", attributes: ["id", "name", "urlImage"] }],
          },
          {
            model: Users,
            as: "participants",
            attributes: userPublic as unknown as string[],
            through: { attributes: ["joinedAt"] },
          },
        ],
      });
      return res.json(rows);
    }

    const rows = await Tickets.findAll({
      where,
      order: [["createdAt", orderDir]],
      limit,
      include: [
        {
          model: Users,
          as: "participants",
          required: true,
          where: { id },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: GameModes,
          as: "gameMode",
          attributes: ["id", "modeName", "playersMax", "isRanked"],
          include: [{ model: Games, as: "game", attributes: ["id", "name", "urlImage"] }],
        },
      ],
    });

    return res.json(rows);
  } catch (e) {
    console.error("listUserTickets error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};