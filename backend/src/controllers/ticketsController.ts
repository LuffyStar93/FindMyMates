import { Request, Response } from "express";
import GameModes from "../models/GameModes";
import Games from "../models/Games";
import Tickets from "../models/Tickets";
import Users from "../models/Users";
import UserTicket from "../models/UserTicket";

/**
 * Helper: include standard pour un ticket complet
 */
const ticketInclude = [
  {
    model: GameModes,
    as: "gameMode",
    include: [
      {
        model: Games,
        as: "game",
      },
    ],
  },
  {
    model: Users,
    as: "creator",
    attributes: ["id", "pseudo", "name", "discord_tag", "reputationScore"],
  },
  {
    model: Users,
    as: "participants",
    attributes: ["id", "pseudo", "name", "discord_tag", "reputationScore"],
    through: {
      attributes: ["joinedAt"],
    },
  },
];

/**
 * GET /api/tickets
 * GET /api/games/:gameId/tickets
 */
export const listTickets = async (req: Request, res: Response) => {
  try {
    // ⚠️ On supporte aussi bien :
    // - /api/tickets?gameId=1
    // - /api/games/:gameId/tickets
    const gameIdFromParams = (req.params as any).gameId as string | undefined;

    const {
      status,
      modeId,
      gameId: gameIdFromQuery,
      ranked,
      page = 1,
      limit = 50,
      order = "desc",
    } = req.query as {
      status?: "open" | "closed";
      modeId?: string;
      gameId?: string;
      ranked?: "true" | "false";
      page?: string | number;
      limit?: string | number;
      order?: "asc" | "desc";
    };

    // gameId effectif : query > params
    const effectiveGameId = gameIdFromQuery ?? gameIdFromParams;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status === "open" || status === "closed") where.status = status;
    if (modeId) where.gameModeId = Number(modeId);

    const include = [...ticketInclude] as any[];

    if (effectiveGameId || ranked) {
      const gIdNum = effectiveGameId ? Number(effectiveGameId) : undefined;

      include[0] = {
        ...include[0],
        where: {
          ...(gIdNum && Number.isFinite(gIdNum) ? { gameId: gIdNum } : {}),
          ...(ranked === "true"
            ? { isRanked: true }
            : ranked === "false"
            ? { isRanked: false }
            : {}),
        },
        required: true,
      };
    }

    const { rows, count } = await Tickets.findAndCountAll({
      where,
      include,
      order: [["createdAt", order === "asc" ? "ASC" : "DESC"]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const pageCount = Math.max(1, Math.ceil(count / limitNum));

    res.json({
      items: rows,
      page: pageNum,
      limit: limitNum,
      total: count,
      pageCount,
    });
  } catch (e) {
    console.error("listTickets error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * GET /api/tickets/:id
 */
export const getTicket = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const ticket = await Tickets.findByPk(id, { include: ticketInclude });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.json(ticket);
  } catch (e) {
    console.error("getTicket error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * POST /api/tickets
 * body: { userId, gameModeId, capacity? }
 * Règles:
 *  - capacity >= 2 (toi + au moins 1 joueur)
 *  - capacity <= playersMax du mode
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ message: "Auth required" });
    }

    const authUserId = Number(authUser.id);
    const authRole = String(authUser.role || "User");

    const { userId, gameModeId, capacity } = req.body as {
      userId?: number;
      gameModeId?: number;
      capacity?: number;
    };

    if (!userId || !gameModeId) {
      return res
        .status(400)
        .json({ message: "userId and gameModeId are required" });
    }

    if (
      authRole !== "Admin" &&
      authRole !== "Moderator" &&
      Number(userId) !== authUserId
    ) {
      return res
        .status(403)
        .json({ message: "You cannot create a ticket for another user" });
    }

    const mode = await GameModes.findByPk(Number(gameModeId));
    if (!mode) {
      return res.status(404).json({ message: "Game mode not found" });
    }

    const maxPlayers = Number((mode as any).playersMax ?? 1) || 1;

    if (maxPlayers < 2) {
      return res.status(400).json({
        message: "This mode does not support tickets (playersMax < 2)",
      });
    }

    let cap = Number(capacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      cap = 2;
    }
    if (cap < 2) cap = 2;
    if (cap > maxPlayers) cap = maxPlayers;

    if (cap < 2) {
      return res
        .status(400)
        .json({ message: "Capacity must be at least 2 players" });
    }

    const ticket = await Tickets.create({
      status: "open",
      isActive: true,
      createdAt: new Date(),
      endedAt: null,
      nbPlayers: 1,
      capacity: cap,
      gameModeId: Number(gameModeId),
      userId: Number(userId),
    });

    await UserTicket.create({
      userId: Number(userId),
      ticketId: ticket.id,
      joinedAt: new Date(),
    });

    const reloaded = await Tickets.findByPk(ticket.id, {
      include: ticketInclude,
    });

    return res.status(201).json({ ok: true, ticket: reloaded ?? ticket });
  } catch (e) {
    console.error("createTicket error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * POST /api/tickets/:id/join
 * body: { userId }
 */
export const joinTicket = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth) return res.status(401).json({ message: "Auth required" });

    const ticketId = Number(req.params.id);
    const { userId } = req.body as { userId?: number };

    if (!Number.isFinite(ticketId) || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const authUserId = Number(auth.id);
    const authRole = String(auth.role || "User");
    if (
      authRole !== "Admin" &&
      authRole !== "Moderator" &&
      Number(userId) !== authUserId
    ) {
      return res
        .status(403)
        .json({ message: "You cannot join on behalf of another user" });
    }

    const ticket = await Tickets.findByPk(ticketId, { include: ticketInclude });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status !== "open") {
      return res.status(409).json({ message: "Ticket is closed" });
    }
    if (!ticket.isActive) {
      return res
        .status(409)
        .json({ message: "Ticket is full or not active" });
    }

    const already = await UserTicket.findOne({ where: { userId, ticketId } });
    if (already) {
      return res.status(409).json({ message: "Already joined" });
    }

    if (ticket.nbPlayers >= ticket.capacity) {
      return res.status(409).json({ message: "Ticket is already full" });
    }

    await UserTicket.create({
      userId: Number(userId),
      ticketId: ticket.id,
      joinedAt: new Date(),
    });

    ticket.nbPlayers += 1;
    if (ticket.nbPlayers >= ticket.capacity) {
      ticket.isActive = false;
    }
    await ticket.save();

    const updated = await Tickets.findByPk(ticket.id, {
      include: ticketInclude,
    });

    res.json({ ok: true, ticket: updated ?? ticket });
  } catch (e) {
    console.error("joinTicket error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * PUT /api/tickets/:id
 * body: { status?, capacity?, gameModeId? }
 * Règles:
 *  - capacity >= max(nbPlayers, 2)
 *  - capacity <= playersMax
 *  - si ticket.status === "closed", interdiction de repasser à "open"
 */
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth) return res.status(401).json({ message: "Auth required" });

    const ticketId = Number(req.params.id);
    if (!Number.isFinite(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const ticket = await Tickets.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const authUserId = Number(auth.id);
    const authRole = String(auth.role || "User");
    const isOwner = ticket.userId === authUserId;
    const isStaff = authRole === "Admin" || authRole === "Moderator";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status, capacity, gameModeId } = req.body as {
      status?: "open" | "closed";
      capacity?: number;
      gameModeId?: number;
    };

    if (
      status === undefined &&
      capacity === undefined &&
      gameModeId === undefined
    ) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // Interdire la réouverture d'un ticket fermé
    if (ticket.status === "closed" && status === "open") {
      return res
        .status(409)
        .json({ message: "Closed tickets cannot be reopened" });
    }

    // Eventuellement changement de mode
    let mode = null as GameModes | null;
    if (gameModeId !== undefined) {
      mode = await GameModes.findByPk(Number(gameModeId));
      if (!mode) {
        return res.status(404).json({ message: "Game mode not found" });
      }
      ticket.gameModeId = Number(gameModeId);
    } else {
      mode = await GameModes.findByPk(ticket.gameModeId);
    }

    const maxPlayers =
      Number((mode as any)?.playersMax ?? ticket.capacity ?? 1) || 1;

    if (capacity !== undefined) {
      let cap = Number(capacity);
      if (!Number.isFinite(cap)) {
        return res.status(400).json({ message: "Invalid capacity" });
      }

      // capacité mini = max(nbPlayers actuels, 2)
      const minCap = Math.max(ticket.nbPlayers, 2);
      if (cap < minCap) {
        return res.status(400).json({
          message: `Capacity must be at least ${minCap} (current players or 2)`,
        });
      }

      if (cap > maxPlayers) {
        cap = maxPlayers;
      }

      ticket.capacity = cap;
      ticket.isActive =
        ticket.status === "open" && ticket.nbPlayers < ticket.capacity;
    }

    if (status !== undefined) {
      ticket.status = status;
      if (status === "closed") {
        ticket.isActive = false;
        ticket.endedAt = ticket.endedAt ?? new Date();
      } else if (status === "open") {
        if (ticket.nbPlayers < ticket.capacity) {
          ticket.isActive = true;
        }
      }
    }

    await ticket.save();

    const updated = await Tickets.findByPk(ticket.id, {
      include: ticketInclude,
    });

    res.json({ ok: true, ticket: updated ?? ticket });
  } catch (e) {
    console.error("updateTicket error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * PATCH /api/tickets/:id/close
 */
export const closeTicketByOwner = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth) return res.status(401).json({ message: "Auth required" });

    const ticketId = Number(req.params.id);
    if (!Number.isFinite(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const ticket = await Tickets.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const authUserId = Number(auth.id);
    const authRole = String(auth.role || "User");
    const isOwner = ticket.userId === authUserId;
    const isStaff = authRole === "Admin" || authRole === "Moderator";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (ticket.status === "closed") {
      return res.status(409).json({ message: "Ticket already closed" });
    }

    ticket.status = "closed";
    ticket.isActive = false;
    ticket.endedAt = ticket.endedAt ?? new Date();
    await ticket.save();

    const updated = await Tickets.findByPk(ticket.id, {
      include: ticketInclude,
    });

    res.json({ ok: true, ticket: updated ?? ticket });
  } catch (e) {
    console.error("closeTicketByOwner error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * DELETE /api/tickets/:id
 */
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth) return res.status(401).json({ message: "Auth required" });

    const ticketId = Number(req.params.id);
    if (!Number.isFinite(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    const ticket = await Tickets.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const authUserId = Number(auth.id);
    const authRole = String(auth.role || "User");
    const isOwner = ticket.userId === authUserId;
    const isStaff = authRole === "Admin" || authRole === "Moderator";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await UserTicket.destroy({ where: { ticketId } });
    await ticket.destroy();

    res.json({ ok: true, deleted: true });
  } catch (e) {
    console.error("deleteTicket error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};