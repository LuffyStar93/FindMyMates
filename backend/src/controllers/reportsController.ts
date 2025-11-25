import GameModes from "@/models/GameModes";
import Games from "@/models/Games";
import Reports, { ReportReason, ReportStatus } from "@/models/Reports";
import Tickets from "@/models/Tickets";
import UserReport from "@/models/UserReport";
import Users from "@/models/Users";
import { Request, Response } from "express";
import { Op } from "sequelize";

// Petit helper pour sérialiser un report + ses relations
const toDto = (r: any) => {
  const json = r.toJSON ? r.toJSON() : r;
  return {
    id: json.id,
    description: json.description,
    createdAt: json.createdAt,
    status: json.status as ReportStatus,
    reason: json.reason as ReportReason,
    files: json.files ?? null,
    readedAt: json.readedAt ?? null,
    userId: json.userId,
    ticketId: json.ticketId,
    reporter: json.reporter
      ? {
          id: json.reporter.id,
          pseudo: json.reporter.pseudo,
          name: json.reporter.name,
        }
      : null,
    ticket: json.ticket
      ? {
          id: json.ticket.id,
          status: json.ticket.status,
          isActive: json.ticket.isActive,
          gameMode: json.ticket.gameMode
            ? {
                id: json.ticket.gameMode.id,
                modeName: json.ticket.gameMode.modeName,
                isRanked: json.ticket.gameMode.isRanked,
                playersMax: json.ticket.gameMode.playersMax,
                game: json.ticket.gameMode.game
                  ? {
                      id: json.ticket.gameMode.game.id,
                      name: json.ticket.gameMode.game.name,
                      urlImage: json.ticket.gameMode.game.urlImage ?? null,
                    }
                  : null,
              }
            : null,
        }
      : null,
    reportedUsers: Array.isArray(json.reportedUsers)
      ? json.reportedUsers.map((u: any) => ({
          id: u.id,
          pseudo: u.pseudo,
          name: u.name,
        }))
      : [],
  };
};

/**
 * GET /api/reports
 * Query:
 *  - status?: 'open' | 'in_progress' | 'closed'
 *  - reason?: ReportReason
 *  - unreadOnly?: 'true'
 *  - page?: number (>=1)
 *  - limit?: number (1..200)
 */
export const listReports = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 30,
      status,
      reason,
      order = "desc",
      read,
    } = req.query as any;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 30));

    const where: any = {};

    if (status) where.status = status;
    if (reason) where.reason = reason;

    
    if (read === "unread") {
      where.readedAt = null;
    } else if (read === "read") {
      where.readedAt = { [Op.not]: null };
    }

    const { rows, count } = await Reports.findAndCountAll({
      where,
      include: [
        {
          association: "reporter",
          attributes: ["id", "pseudo", "name"],
        },
        {
          association: "ticket",
          attributes: ["id", "status", "isActive"],
          include: [
            {
              association: "gameMode",
              attributes: ["id", "modeName", "isRanked", "playersMax"],
              include: [
                {
                  association: "game",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        {
          association: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", order === "asc" ? "ASC" : "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      distinct: true,
    });

    res.json({
      items: rows,
      total: count,
      page: pageNum,
      limit: limitNum,
      pageCount: Math.max(1, Math.ceil(count / limitNum)),
    });
  } catch (e) {
    console.error("listReports error:", e);
    res.status(500).json({ message: "Internal error" });
  }
};

/**
 * GET /api/reports/ticket/:ticketId
 */
export const getTicketReports = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.ticketId);
    if (!Number.isFinite(ticketId)) {
      return res.status(400).json({ message: "Invalid ticketId" });
    }

    const rows = await Reports.findAll({
      where: { ticketId },
      include: [
        { model: Users, as: "reporter", attributes: ["id", "pseudo", "name"] },
        {
          model: Users,
          as: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(rows.map(toDto));
  } catch (e) {
    console.error("getTicketReports error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * GET /api/reports/users/:userId/received
 */
export const getUserReportsReceived = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const rows = await Reports.findAll({
      include: [
        {
          model: Users,
          as: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          where: { id: userId },
        },
        { model: Users, as: "reporter", attributes: ["id", "pseudo", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(rows.map(toDto));
  } catch (e) {
    console.error("getUserReportsReceived error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * GET /api/reports/users/:userId/created
 */
export const getUserReportsCreated = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const rows = await Reports.findAll({
      where: { userId },
      include: [
        { model: Users, as: "reporter", attributes: ["id", "pseudo", "name"] },
        {
          model: Users,
          as: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(rows.map(toDto));
  } catch (e) {
    console.error("getUserReportsCreated error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * POST /api/reports
 * body: { description, reason, ticketId, targetUserIds?: number[] }
 */
export const createReport = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    if (!authUser) return res.status(401).json({ message: "Auth required" });

    const { description, reason, ticketId, targetUserIds } = req.body as {
      description: string;
      reason: ReportReason;
      ticketId: number;
      targetUserIds?: number[];
    };

    if (!description || !reason || !ticketId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const ticket = await Tickets.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const report = await Reports.create({
      description,
      reason,
      ticketId,
      userId: authUser.id,
    });

    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const links = targetUserIds.map((uid) => ({
        reportId: report.id,
        userId: uid,
      }));
      await UserReport.bulkCreate(links, { ignoreDuplicates: true });
    }

    const full = await Reports.findByPk(report.id, {
      include: [
        { model: Users, as: "reporter", attributes: ["id", "pseudo", "name"] },
        {
          model: Users,
          as: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          through: { attributes: [] },
        },
      ],
    });

    return res.status(201).json(toDto(full ?? report));
  } catch (e) {
    console.error("createReport error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * GET /api/reports/:id
 */
export const getReport = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const report = await Reports.findByPk(id, {
      include: [
        { model: Users, as: "reporter", attributes: ["id", "pseudo", "name", "bannedAt"] },
        {
          model: Tickets,
          as: "ticket",
          include: [
            {
              model: GameModes,
              as: "gameMode",
              include: [{ model: Games, as: "game" }],
            },
          ],
        },
        {
          model: Users,
          as: "reportedUsers",
          attributes: ["id", "pseudo", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!report) return res.status(404).json({ message: "Report not found" });

    return res.json(toDto(report));
  } catch (e) {
    console.error("getReport error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * PATCH /api/reports/:id/read
 * body: { read: boolean }
 */
export const markReportRead = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const { read } = req.body as { read: boolean };
    const report = await Reports.findByPk(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.readedAt = read ? new Date() : null;
    await report.save();

    return res.json({ ok: true, report: toDto(report) });
  } catch (e) {
    console.error("markReportRead error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * PATCH /api/reports/:id/status
 * body: { status: ReportStatus }
 */
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const { status } = req.body as { status: ReportStatus };
    if (!["open", "in_progress", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Reports.findByPk(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = status;
    await report.save();

    return res.json({ ok: true, report: toDto(report) });
  } catch (e) {
    console.error("updateReportStatus error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * DELETE /api/reports/:id
 */
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const report = await Reports.findByPk(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    await UserReport.destroy({ where: { reportId: id } });
    await report.destroy();

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteReport error:", e);
    return res.status(500).json({ message: "Internal error" });
  }
};