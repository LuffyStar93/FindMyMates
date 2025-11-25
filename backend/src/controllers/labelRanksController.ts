import { Request, Response } from "express";
import { Op } from "sequelize";
import GameModes from "../models/GameModes";
import Games from "../models/Games";
import LabelRanks from "../models/LabelRanks";

// Helper: normalise le triplet (rankName, gameId, gameModeId) pour les recherches anti-doublon
const scopeWhere = (rankName: string, gameId: number, gameModeId?: number | null) => {
  const where: any = { rankName: String(rankName).trim(), gameId: Number(gameId) };
  if (gameModeId === null || gameModeId === undefined) where.gameModeId = { [Op.is]: null };
  else where.gameModeId = Number(gameModeId);
  return where;
};

// GET /api/ranks?gameId=&gameModeId=
export const listLabelRanks = async (req: Request, res: Response) => {
  try {
    const { gameId, gameModeId } = req.query as { gameId?: string; gameModeId?: string };

    const where: any = {};
    if (gameId !== undefined) {
      const gameIdNum = Number(gameId);
      if (Number.isNaN(gameIdNum)) return res.status(400).json({ message: "gameId must be a number" });
      where.gameId = gameIdNum;
    }
    if (gameModeId !== undefined) {
      if (gameModeId === "null") where.gameModeId = { [Op.is]: null };
      else {
        const gmIdNum = Number(gameModeId);
        if (Number.isNaN(gmIdNum)) return res.status(400).json({ message: "gameModeId must be a number or null" });
        where.gameModeId = gmIdNum;
      }
    }

    const rows = await LabelRanks.findAll({
      where,
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"], required: false },
      ],
      order: [
        ["gameId", "ASC"],
        ["gameModeId", "ASC"],
        ["rankName", "ASC"],
      ],
    });

    const data = rows.map((row) => {
      const r = row.toJSON() as any;
      return {
        id: r.id,
        rankName: r.rankName,
        gameId: r.gameId,
        gameModeId: r.gameModeId ?? null,
        gameModeName: r.mode ? r.mode.modeName : null,
        game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
        mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
      };
    });

    res.json(data);
  } catch (e) {
    console.error("listLabelRanks error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/ranks/:id
export const getLabelRank = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const row = await LabelRanks.findByPk(id, {
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"], required: false },
      ],
    });
    if (!row) return res.status(404).json({ message: "Rank label not found" });

    const r = row.toJSON() as any;
    const data = {
      id: r.id,
      rankName: r.rankName,
      gameId: r.gameId,
      gameModeId: r.gameModeId ?? null,
      gameModeName: r.mode ? r.mode.modeName : null,
      game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
      mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
    };

    res.json(data);
  } catch (e) {
    console.error("getLabelRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/ranks/by-game/:gameId
export const listLabelRanksByGame = async (req: Request, res: Response) => {
  try {
    const gameId = Number(req.params.gameId);
    if (Number.isNaN(gameId)) return res.status(400).json({ message: "Invalid gameId" });

    const game = await Games.findByPk(gameId, { attributes: ["id", "name"] });
    if (!game) return res.status(404).json({ message: "Game not found" });

    const rows = await LabelRanks.findAll({
      where: { gameId },
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"], required: false },
      ],
      order: [
        ["gameModeId", "ASC"],
        ["rankName", "ASC"],
      ],
    });

    const ranks = rows.map((row) => {
      const r = row.toJSON() as any;
      return {
        id: r.id,
        rankName: r.rankName,
        gameId: r.gameId,
        gameModeId: r.gameModeId ?? null,
        gameModeName: r.mode ? r.mode.modeName : null,
        game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
        mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
      };
    });

    return res.json({ game: { id: game.id, name: game.name }, ranks });
  } catch (e) {
    console.error("listLabelRanksByGame error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

// GET /api/ranks/by-gamemode/:gameModeId
export const listLabelRanksByGameMode = async (req: Request, res: Response) => {
  try {
    const gameModeId = Number(req.params.gameModeId);
    if (Number.isNaN(gameModeId)) return res.status(400).json({ message: "Invalid gameModeId" });

    const mode = await GameModes.findByPk(gameModeId, {
      attributes: ["id", "modeName", "gameId"],
      include: [{ model: Games, as: "game", attributes: ["id", "name"] }],
    });
    if (!mode) return res.status(404).json({ message: "Game mode not found" });

    const rows = await LabelRanks.findAll({
      where: { gameModeId },
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"] },
      ],
      order: [["rankName", "ASC"]],
    });

    const ranks = rows.map((row) => {
      const r = row.toJSON() as any;
      return {
        id: r.id,
        rankName: r.rankName,
        gameId: r.gameId,
        gameModeId: r.gameModeId ?? null,
        gameModeName: r.mode ? r.mode.modeName : null,
        game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
        mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
      };
    });

    return res.json({
      gameMode: {
        id: mode.id,
        modeName: mode.modeName,
        game: (mode as any).game ? { id: (mode as any).game.id, name: (mode as any).game.name } : { id: mode.gameId },
      },
      ranks,
    });
  } catch (e) {
    console.error("listLabelRanksByGameMode error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

// POST /api/ranks  body: { rankName, gameId, gameModeId? }
export const createLabelRank = async (req: Request, res: Response) => {
  try {
    let { rankName, gameId, gameModeId } = req.body as {
      rankName?: string;
      gameId?: number;
      gameModeId?: number | null;
    };

    // anti-typo (gamemodeId)
    const raw = req.body as any;
    if ("gamemodeId" in raw && gameModeId === undefined) {
      return res.status(400).json({
        message: "Did you mean 'gameModeId'? 'gamemodeId' is not a valid field.",
      });
    }

    if (!rankName || gameId == null) {
      return res.status(400).json({ message: "rankName and gameId are required" });
    }
    rankName = String(rankName).trim();
    if (rankName.length === 0) {
      return res.status(400).json({ message: "rankName cannot be empty" });
    }

    const gameIdNum = Number(gameId);
    if (Number.isNaN(gameIdNum)) {
      return res.status(400).json({ message: "gameId must be a number" });
    }

    const game = await Games.findByPk(gameIdNum);
    if (!game) return res.status(404).json({ message: "Game not found" });

    let modeId: number | null = null;
    if (gameModeId !== undefined && gameModeId !== null) {
      const gmIdNum = Number(gameModeId);
      if (Number.isNaN(gmIdNum)) {
        return res.status(400).json({ message: "gameModeId must be a number or null" });
      }
      const mode = await GameModes.findByPk(gmIdNum);
      if (!mode) return res.status(404).json({ message: "Game mode not found" });
      if (mode.gameId !== game.id) {
        return res.status(400).json({ message: "GameMode does not belong to provided Game" });
      }
      modeId = mode.id;
    }

    // Anti-doublon côté code
    const exists = await LabelRanks.findOne({ where: scopeWhere(rankName, game.id, modeId) });
    if (exists) {
      return res.status(409).json({ message: "Duplicate rank name for this game/mode" });
    }

    const payload: any = {
      rankName,
      gameId: game.id,
      ...(modeId === null ? { gameModeId: null } : { gameModeId: modeId }),
    };

    const created = await LabelRanks.create(payload as any);

    const row = await LabelRanks.findByPk(created.id, {
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"], required: false },
      ],
    });

    const r = row?.toJSON?.() as any;
    const data = {
      id: r.id,
      rankName: r.rankName,
      gameId: r.gameId,
      gameModeId: r.gameModeId ?? null,
      gameModeName: r.mode ? r.mode.modeName : null,
      game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
      mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
    };

    res.status(201).json({ ok: true, label: data });
  } catch (e: any) {
    if (e?.name === "SequelizeUniqueConstraintError" || e?.original?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate rank name for this game/mode" });
    }
    console.error("createLabelRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// PUT /api/ranks/:id  body: { rankName?, gameId?, gameModeId? }
export const updateLabelRank = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const { rankName, gameId, gameModeId } = req.body as {
      rankName?: string;
      gameId?: number;
      gameModeId?: number | null;
    };

    const current = await LabelRanks.findByPk(id);
    if (!current) return res.status(404).json({ message: "Rank label not found" });

    const patch: any = {};
    let newRankName = current.rankName;
    let newGameId = current.gameId;
    let newGameModeId: number | null = current.gameModeId;

    if (rankName !== undefined) {
      const rn = String(rankName).trim();
      if (rn.length === 0) {
        return res.status(400).json({ message: "rankName cannot be empty" });
      }
      newRankName = rn;
      patch.rankName = rn;
    }

    if (gameId !== undefined) {
      const gameIdNum = Number(gameId);
      if (Number.isNaN(gameIdNum)) return res.status(400).json({ message: "gameId must be a number" });
      const game = await Games.findByPk(gameIdNum);
      if (!game) return res.status(404).json({ message: "Game not found" });
      newGameId = game.id;
      patch.gameId = game.id;
    }

    if (gameModeId !== undefined) {
      if (gameModeId === null) {
        newGameModeId = null;
        patch.gameModeId = null;
      } else {
        const gmIdNum = Number(gameModeId);
        if (Number.isNaN(gmIdNum)) return res.status(400).json({ message: "gameModeId must be a number or null" });
        const mode = await GameModes.findByPk(gmIdNum);
        if (!mode) return res.status(404).json({ message: "Game mode not found" });
        if (mode.gameId !== newGameId) {
          return res.status(400).json({ message: "GameMode does not belong to (new) Game" });
        }
        newGameModeId = mode.id;
        patch.gameModeId = mode.id;
      }
    }

    // Anti-doublon côté code (exclure l’ID courant)
    const dupe = await LabelRanks.findOne({
      where: {
        ...scopeWhere(newRankName, newGameId, newGameModeId),
        id: { [Op.ne]: id },
      } as any,
    });
    if (dupe) {
      return res.status(409).json({ message: "Duplicate rank name for this game/mode" });
    }

    await LabelRanks.update(patch, { where: { id } });

    const row = await LabelRanks.findByPk(id, {
      attributes: ["id", "rankName", "gameId", "gameModeId"],
      include: [
        { model: Games, as: "game", attributes: ["id", "name"] },
        { model: GameModes, as: "mode", attributes: ["id", "modeName"], required: false },
      ],
    });

    const r = row?.toJSON?.() as any;
    const data = {
      id: r.id,
      rankName: r.rankName,
      gameId: r.gameId,
      gameModeId: r.gameModeId ?? null,
      gameModeName: r.mode ? r.mode.modeName : null,
      game: r.game ? { id: r.game.id, name: r.game.name } : undefined,
      mode: r.mode ? { id: r.mode.id, modeName: r.mode.modeName } : undefined,
    };

    res.json({ ok: true, label: data });
  } catch (e: any) {
    if (e?.name === "SequelizeUniqueConstraintError" || e?.original?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate rank name for this game/mode" });
    }
    console.error("updateLabelRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

// DELETE /api/ranks/:id
export const deleteLabelRank = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const found = await LabelRanks.findByPk(id);
    if (!found) return res.status(404).json({ message: "Rank label not found" });

    await LabelRanks.destroy({ where: { id } });
    res.json({ ok: true, message: "Rank label deleted", id });
  } catch (e) {
    console.error("deleteLabelRank error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};