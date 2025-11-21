import { Request, Response } from "express";
import { Op } from "sequelize";
import GameModes from "../models/GameModes";
import Games from "../models/Games";
import LabelRanks from "../models/LabelRanks";
import Tickets from "../models/Tickets";
import Users from "../models/Users";

const userPublic = ["id", "name", "pseudo", "email", "reputationScore", "bannedAt", "discordTag"] as const;

export const listGames = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? req.query.q ?? "").trim();

    const where: any = {};
    if (search) where.name = { [Op.like]: `%${search}%` };

    const rows = await Games.findAll({
      attributes: ["id", "name", "urlImage"],
      where,
      order: [["name", "ASC"]],
      include: [{ model: GameModes, as: "modes", attributes: ["id", "modeName", "playersMax", "isRanked"] }],
    });

    res.json(rows);
  } catch (e) {
    console.error("listGames error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

export const getGame = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid game id" });

    const row = await Games.findByPk(id, {
      attributes: ["id", "name", "urlImage"],
      include: [
        { model: GameModes, as: "modes", attributes: ["id", "modeName", "playersMax", "isRanked"] },
        { model: LabelRanks, as: "ranks", attributes: ["id", "rankName"], required: false },
      ],
    });
    if (!row) return res.status(404).json({ message: "Game not found" });

    const g: any = row.toJSON?.() ?? row;
    return res.json({
      id: g.id,
      name: g.name,
      coverUrl: g.urlImage ?? null,
      modes: (g.modes ?? []).map((m: any) => ({
        id: m.id,
        name: m.modeName,
        playersMax: m.playersMax,
        isRanked: !!m.isRanked,
      })),
      ranks: (g.ranks ?? []).map((r: any) => ({ id: r.id, name: r.rankName })),
    });
  } catch (e) {
    console.error("getGame error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

export const listGameTickets = async (req: Request, res: Response) => {
  try {
    const gameId = Number(req.params.id);
    if (!Number.isInteger(gameId)) return res.status(400).json({ message: "Invalid game id" });

    const q = String(req.query.q ?? "").trim();
    const modeId = req.query.modeId ? Number(req.query.modeId) : undefined;
    const status = (req.query.status as string) || undefined;
    const ranked = typeof req.query.ranked === "string" ? req.query.ranked : undefined;
    const limit = Math.min(200, Number(req.query.limit ?? 20));
    const page = Math.max(1, Number(req.query.page ?? 1));
    const offset = (page - 1) * limit;

    const whereTickets: any = {};
    if (status) whereTickets.status = status;
    if (modeId) whereTickets.gameModeId = modeId;

    const params: any = { gameId };
    let sql =
      "SELECT COUNT(*) AS cnt FROM `Tickets` t " +
      "INNER JOIN `GameModes` gm ON t.`gameModeId` = gm.`Id` " +
      "WHERE gm.`GameId` = :gameId";

    if (status) {
      sql += " AND t.`status` = :status";
      params.status = status;
    }
    if (modeId) {
      sql += " AND t.`gameModeId` = :modeId";
      params.modeId = modeId;
    }
    if (ranked === "true") sql += " AND gm.`isRanked` = 1";
    if (ranked === "false") sql += " AND gm.`isRanked` = 0";

    const [countRows] = await (Tickets.sequelize as any).query(sql, {
      type: "SELECT",
      replacements: params,
      plain: false,
    });
    const total = Array.isArray(countRows)
      ? Number((countRows[0] as any).cnt)
      : Number((countRows as any).cnt);

    const idRows = await Tickets.findAll({
      attributes: ["id", "createdAt"],
      where: whereTickets,
      include: [
        {
          model: GameModes,
          as: "gameMode",
          required: true,
          attributes: [],
          where: {
            gameId,
            ...(ranked === "true" ? { isRanked: true } : {}),
            ...(ranked === "false" ? { isRanked: false } : {}),
          },
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });
    const ids = idRows.map((r) => r.id);

    if (ids.length === 0) {
      return res.json({
        items: [],
        page,
        limit,
        total,
        pageCount: Math.max(1, Math.ceil(total / limit)),
      });
    }

    const items = await Tickets.findAll({
      where: { id: ids },
      include: [
        { model: Users, as: "creator", attributes: userPublic as unknown as string[] },
        {
          model: Users,
          as: "participants",
          attributes: userPublic as unknown as string[],
          through: { attributes: ["joinedAt"] },
        },
        {
          model: GameModes,
          as: "gameMode",
          attributes: ["id", "modeName", "gameId", "playersMax", "isRanked"],
          include: [{ model: Games, as: "game", attributes: ["id", "name", "urlImage"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const mapped = items.map((t) => ({
      id: t.id,
      status: t.status,
      createdAt: t.createdAt,
      endedAt: t.endedAt,
      isActive: t.isActive,
      modeId: t.gameModeId,
      modeName: (t as any).gameMode?.modeName ?? "",
      isRanked: Boolean((t as any).gameMode?.isRanked),
      game: (t as any).gameMode?.game
        ? {
            id: (t as any).gameMode.game.id,
            name: (t as any).gameMode.game.name,
            coverUrl: (t as any).gameMode.game.urlImage,
          }
        : null,
      current: t.nbPlayers,
      max: t.capacity,
      creator: (t as any).creator ?? null,
      participants: (t as any).participants ?? [],
    }));

    return res.json({
      items: mapped,
      page,
      limit,
      total,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error("listGameTickets error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

export const createGame = async (req: Request, res: Response) => {
  try {
    const { name, urlImage } = req.body as { name?: string; urlImage?: string | null };
    if (!name) return res.status(400).json({ message: "name is required" });

    const game = await Games.create({ name: String(name).trim(), urlImage: urlImage ?? null });
    res.status(201).json({ ok: true, game });
  } catch (e) {
    console.error("createGame error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

export const updateGame = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, urlImage } = req.body as { name?: string; urlImage?: string | null };

    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid game id" });
    const payload: any = {};
    if (name !== undefined) payload.name = String(name).trim();
    if (urlImage !== undefined) payload.urlImage = urlImage ?? null;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const [count] = await Games.update(payload, { where: { id } });
    if (count === 0) return res.status(404).json({ message: "Game not found" });

    const game = await Games.findByPk(id, {
      attributes: ["id", "name", "urlImage"],
      include: [{ model: GameModes, as: "modes", attributes: ["id", "modeName", "playersMax", "isRanked"] }],
    });
    res.json({ ok: true, game });
  } catch (e) {
    console.error("updateGame error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const force = String(req.query.force ?? "false") === "true";

    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid game id" });

    if (!force) {
      const modes = await GameModes.count({ where: { gameId: id } });
      if (modes > 0) {
        return res.status(409).json({ message: "Game has related modes. Use ?force=true to delete." });
      }
    }
    await Games.destroy({ where: { id } });
    res.json({ ok: true, message: "Game deleted", id });
  } catch (e) {
    console.error("deleteGame error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};