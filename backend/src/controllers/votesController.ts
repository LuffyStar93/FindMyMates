import { Request, Response } from "express";
import sequelize from "../config/db";
import ReputationVotes from "../models/ReputationVotes";
import Tickets from "../models/Tickets";
import UserReputationVote from "../models/UserReputationVote";
import Users from "../models/Users";
import UserTicket from "../models/UserTicket";

type VoteType = "up" | "down";

/**
 * GET /api/tickets/:ticketId/votes?by=<userId>
 * → renvoie les votes du "by" sur CE ticket: [{ targetUserId, type }]
 */
export const listVotes = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const by = Number(req.query.by) || Number((req as any).user?.id);

  if (!ticketId || !by) {
    return res.status(400).json({ message: "Missing ticketId or by" });
  }

  const ticket = await Tickets.findByPk(ticketId);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const links = await UserReputationVote.findAll({
    where: { userId: by },
    include: [
      {
        model: ReputationVotes,
        as: "vote",
        where: { ticketId },
        attributes: ["id", "voteType", "userId", "ticketId"],
        required: true,
      },
    ],
  });

  const out = links.map((l: any) => ({
    targetUserId: l.vote.userId,
    type: l.vote.voteType as VoteType,
  }));

  return res.json(out);
};

/**
 * POST /api/tickets/:ticketId/votes
 * body: { voterUserId, targetUserId, type }
 */
export const castVote = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const { voterUserId, targetUserId, type } = req.body as {
    voterUserId: number;
    targetUserId: number;
    type: VoteType;
  };

  if (!ticketId || !voterUserId || !targetUserId || (type !== "up" && type !== "down")) {
    return res.status(400).json({ message: "Missing or invalid parameters" });
  }
  if (voterUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot vote for yourself" });
  }

  const [ticket, voter, target] = await Promise.all([
    Tickets.findByPk(ticketId),
    Users.findByPk(voterUserId),
    Users.findByPk(targetUserId),
  ]);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (!voter || !target) return res.status(404).json({ message: "User not found" });

  const ticketClosed = !!ticket.endedAt || ticket.isActive === false || (ticket.status && ticket.status !== "open");
  if (ticketClosed) return res.status(410).json({ message: "Ticket closed" });

  // participants ?
  const [voterIsParticipant, targetIsParticipant] = await Promise.all([
    UserTicket.findOne({ where: { userId: voterUserId, ticketId: ticket.id } }),
    UserTicket.findOne({ where: { userId: targetUserId, ticketId: ticket.id } }),
  ]);
  if (!voterIsParticipant || !targetIsParticipant) {
    return res.status(403).json({ message: "Both users must be participants of this ticket" });
  }

  // déjà voté ? (même votant -> même cible sur CE ticket)
  const already = await UserReputationVote.findOne({
    where: { userId: voterUserId },
    include: [
      {
        model: ReputationVotes,
        as: "vote",
        where: { ticketId, userId: targetUserId },
        required: true,
      },
    ],
  });
  if (already) {
    return res.status(409).json({ message: "You already voted for this player on this ticket" });
  }

  await sequelize.transaction(async (t) => {
    const vote = await ReputationVotes.create(
      { voteType: type, userId: targetUserId, ticketId },
      { transaction: t }
    );

    await UserReputationVote.create(
      { userId: voterUserId, reputationVoteId: vote.id },
      { transaction: t }
    );

    const delta = type === "up" ? 1 : -1;
    await Users.increment("reputationScore", {
      by: delta,
      where: { id: targetUserId },
      transaction: t,
    });
  });

  return res.status(201).json({ ok: true });
};

/**
 * PATCH /api/tickets/:ticketId/votes
 * body: { voterUserId, targetUserId, type }
 */
export const updateVote = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const { voterUserId, targetUserId, type } = req.body as {
    voterUserId: number;
    targetUserId: number;
    type: VoteType;
  };

  if (!ticketId || !voterUserId || !targetUserId || (type !== "up" && type !== "down")) {
    return res.status(400).json({ message: "Missing or invalid parameters" });
  }
  if (voterUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot vote for yourself" });
  }

  const [ticket, voter, target] = await Promise.all([
    Tickets.findByPk(ticketId),
    Users.findByPk(voterUserId),
    Users.findByPk(targetUserId),
  ]);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (!voter || !target) return res.status(404).json({ message: "User not found" });

  const ticketClosed = !!ticket.endedAt || ticket.isActive === false || (ticket.status && ticket.status !== "open");
  if (ticketClosed) return res.status(410).json({ message: "Ticket closed" });

  // participants ?
  const [voterIsParticipant, targetIsParticipant] = await Promise.all([
    UserTicket.findOne({ where: { userId: voterUserId, ticketId: ticket.id } }),
    UserTicket.findOne({ where: { userId: targetUserId, ticketId: ticket.id } }),
  ]);
  if (!voterIsParticipant || !targetIsParticipant) {
    return res.status(403).json({ message: "Both users must be participants of this ticket" });
  }

  const link = await UserReputationVote.findOne({
    where: { userId: voterUserId },
    include: [{ model: ReputationVotes, as: "vote", where: { ticketId, userId: targetUserId }, required: true }],
  });
  if (!link || !(link as any).vote) return res.status(404).json({ message: "No existing vote to switch" });

  const vote = (link as any).vote as ReputationVotes;
  if (vote.voteType === type) return res.status(200).json({ ok: true });

  const delta = vote.voteType === "up" && type === "down" ? -2 : +2;

  await sequelize.transaction(async (t) => {
    await ReputationVotes.update({ voteType: type }, { where: { id: (vote as any).id }, transaction: t });

    await Users.increment("reputationScore", {
      by: delta,
      where: { id: targetUserId },
      transaction: t,
    });
  });

  return res.status(200).json({ ok: true, changed: true });
};

/**
 * DELETE /api/tickets/:ticketId/votes
 * body: { voterUserId, targetUserId }
 */
export const deleteVote = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const { voterUserId, targetUserId } = req.body as { voterUserId: number; targetUserId: number };

  if (!ticketId || !voterUserId || !targetUserId) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  if (voterUserId === targetUserId) {
    return res.status(400).json({ message: "Invalid" });
  }

  const [ticket, voter, target] = await Promise.all([
    Tickets.findByPk(ticketId),
    Users.findByPk(voterUserId),
    Users.findByPk(targetUserId),
  ]);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (!voter || !target) return res.status(404).json({ message: "User not found" });

  const ticketClosed = !!ticket.endedAt || ticket.isActive === false || (ticket.status && ticket.status !== "open");
  if (ticketClosed) return res.status(410).json({ message: "Ticket closed" });

  const [voterIsParticipant, targetIsParticipant] = await Promise.all([
    UserTicket.findOne({ where: { userId: voterUserId, ticketId: ticket.id } }),
    UserTicket.findOne({ where: { userId: targetUserId, ticketId: ticket.id } }),
  ]);
  if (!voterIsParticipant || !targetIsParticipant) {
    return res.status(403).json({ message: "Both users must be participants of this ticket" });
  }


  const link = await UserReputationVote.findOne({
    where: { userId: voterUserId },
    include: [{ model: ReputationVotes, as: "vote", where: { ticketId, userId: targetUserId }, required: true }],
  });
  if (!link || !(link as any).vote) return res.status(404).json({ message: "No vote to delete" });

  const vote = (link as any).vote as ReputationVotes;
  const delta = vote.voteType === "up" ? -1 : +1;

  await sequelize.transaction(async (t) => {
    await UserReputationVote.destroy({
      where: { userId: voterUserId, reputationVoteId: (vote as any).id },
      transaction: t,
    });
    await ReputationVotes.destroy({ where: { id: (vote as any).id }, transaction: t });

    await Users.increment("reputationScore", {
      by: delta,
      where: { id: targetUserId },
      transaction: t,
    });
  });

  return res.status(200).json({ ok: true, deleted: true });
};