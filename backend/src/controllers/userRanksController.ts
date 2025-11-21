import { Request, Response } from "express";
import GameModes from "../models/GameModes";
import Games from "../models/Games";
import LabelRanks from "../models/LabelRanks";
import UserRank from "../models/UserRank";
import Users from "../models/Users";

// DTO helper
const toDto = (r: any) => ({
  id: r.id,
  gameId: r.gameId,
  gameModeId: r.gameModeId ?? null,
  rankId: r.rankId,
  gameName: r.game?.name ?? r.Game?.name ?? null,
  gameModeName: r.mode?.modeName ?? r.GameMode?.modeName ?? null,
  rankName: r.labelRank?.rankName ?? r.LabelRank?.rankName ?? null,
});

// GET /api/user-ranks/:userId
export const listUserRanks = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

    const user = await Users.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const rows = await UserRank.findAll({
      where: { userId },
      include: [
        { model: LabelRanks, as: "labelRank", attributes: ["id", "rankName"] },
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
      ],
      order: [["gameId", "ASC"], ["gameModeId", "ASC"]],
    });

    res.json(rows.map((r) => toDto((r as any).toJSON?.() ?? r)));
  } catch (e) {
    console.error("listUserRanks error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// POST /api/user-ranks/:userId   body: { rankId }
export const setUserRank = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { rankId } = req.body as { rankId?: number };
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (rankId == null) return res.status(400).json({ message: "rankId is required" });

    const [user, label] = await Promise.all([
      Users.findByPk(userId),
      LabelRanks.findByPk(Number(rankId)),
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!label) return res.status(404).json({ message: "Rank label not found" });

    const scope = {
      userId,
      gameId: (label as any).gameId,
      gameModeId: (label as any).gameModeId ?? null,
    };

    const [row, created] = await UserRank.findOrCreate({
      where: scope,
      defaults: { ...scope, rankId: (label as any).id },
    });
    if (!created) {
      await UserRank.update({ rankId: (label as any).id }, { where: scope });
    }

    const found = await UserRank.findOne({
      where: scope,
      include: [
        { model: LabelRanks, as: "labelRank", attributes: ["id", "rankName"] },
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
      ],
    });

    res.status(201).json({ ok: true, userRank: toDto((found as any)?.toJSON?.() ?? found) });
  } catch (e) {
    console.error("setUserRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// PUT /api/user-ranks/:userId   body: { rankId }
// Met à jour le rang pour le même scope (user, game, gameMode?) du label choisi.
// Si le scope n’existe pas, renvoie 404 (utiliser POST pour créer).
export const updateUserRank = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { rankId } = req.body as { rankId?: number };
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (rankId == null) return res.status(400).json({ message: "rankId is required" });

    const [user, label] = await Promise.all([
      Users.findByPk(userId),
      LabelRanks.findByPk(Number(rankId)),
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!label) return res.status(404).json({ message: "Rank label not found" });

    const scope = {
      userId,
      gameId: (label as any).gameId,
      gameModeId: (label as any).gameModeId ?? null,
    };

    const existing = await UserRank.findOne({ where: scope });
    if (!existing) {
      return res.status(404).json({ message: "User rank for this scope not found. Use POST to create." });
    }

    await UserRank.update({ rankId: (label as any).id }, { where: scope });

    const updated = await UserRank.findOne({
      where: scope,
      include: [
        { model: LabelRanks, as: "labelRank", attributes: ["id", "rankName"] },
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
      ],
    });

    res.json({ ok: true, userRank: toDto((updated as any)?.toJSON?.() ?? updated) });
  } catch (e) {
    console.error("updateUserRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// DELETE /api/user-ranks/:userId/:gameId  OU  /:userId/:gameId/:gameModeId

export const deleteUserRank = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const gameId = Number(req.params.gameId);
    const gameModeId =
      req.params.gameModeId !== undefined ? Number(req.params.gameModeId) : undefined;

    if (Number.isNaN(userId) || Number.isNaN(gameId)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const where: any = { userId, gameId, gameModeId: gameModeId === undefined ? null : gameModeId };
    const found = await UserRank.findOne({ where });
    if (!found) return res.status(404).json({ message: "User rank not found for this scope" });

    await UserRank.destroy({ where });
    res.json({ ok: true, message: "User rank removed" });
  } catch (e) {
    console.error("deleteUserRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// DELETE /api/user-ranks/:userId/by-rank/:rankId
export const deleteUserRankByRankId = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const rankId = Number(req.params.rankId);
    if (Number.isNaN(userId) || Number.isNaN(rankId)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const label = await LabelRanks.findByPk(rankId);
    if (!label) return res.status(404).json({ message: "Rank label not found" });

    const where = {
      userId,
      gameId: (label as any).gameId,
      gameModeId: (label as any).gameModeId ?? null,
    };
    const found = await UserRank.findOne({ where });
    if (!found) return res.status(404).json({ message: "User rank not found for this scope" });

    await UserRank.destroy({ where });
    res.json({ ok: true, message: "User rank removed" });
  } catch (e) {
    console.error("deleteUserRankByRankId error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};