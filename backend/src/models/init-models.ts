import sequelize from "../config/db";
import GameModes from "./GameModes";
import Games from "./Games";
import LabelRanks from "./LabelRanks";
import Reports from "./Reports";
import ReputationVotes from "./ReputationVotes";
import Tickets from "./Tickets";
import UserRank from "./UserRank";
import UserReport from "./UserReport";
import UserReputationVote from "./UserReputationVote";
import Users from "./Users";
import UserTicket from "./UserTicket";

/**
 * Initialise toutes les associations.
 * On accepte une instance Sequelize 
 * (index.ts l’injecte) et on renvoie le registry des modèles.
 */
export default function initModels(s = sequelize) {
  // =========================
  // Games ↔ GameModes
  // =========================
  Games.hasMany(GameModes, { foreignKey: "gameId", as: "modes" });
  GameModes.belongsTo(Games, { foreignKey: "gameId", as: "game" });

  // =========================
  // LabelRanks (RANGS PAR MODE)
  // =========================
  Games.hasMany(LabelRanks, { foreignKey: "gameId", as: "ranks" });
  LabelRanks.belongsTo(Games, { foreignKey: "gameId", as: "game" });

  GameModes.hasMany(LabelRanks, { foreignKey: "gameModeId", as: "modeRanks" });
  LabelRanks.belongsTo(GameModes, { foreignKey: "gameModeId", as: "mode" });

  // =========================
  // GameModes ↔ Tickets
  // =========================
  GameModes.hasMany(Tickets, { foreignKey: "gameModeId", as: "tickets" });
  Tickets.belongsTo(GameModes, { foreignKey: "gameModeId", as: "gameMode" });

  // =========================
  // Users (créateur) ↔ Tickets
  // =========================
  Users.hasMany(Tickets, { foreignKey: "userId", as: "createdTickets" });
  Tickets.belongsTo(Users, { foreignKey: "userId", as: "creator" });

  // =========================
  // Users ↔ Tickets (participants via pivot)
  // =========================
  Users.belongsToMany(Tickets, {
    through: UserTicket,
    foreignKey: "userId",
    otherKey: "ticketId",
    as: "joinedTickets",
  });
  Tickets.belongsToMany(Users, {
    through: UserTicket,
    foreignKey: "ticketId",
    otherKey: "userId",
    as: "participants",
  });

  // =========================
  // Reports
  // =========================
  Users.hasMany(Reports, { foreignKey: "userId", as: "reportsAuthored" });
  Reports.belongsTo(Users, { foreignKey: "userId", as: "reporter" });

  Tickets.hasMany(Reports, { foreignKey: "ticketId", as: "reports" });
  Reports.belongsTo(Tickets, { foreignKey: "ticketId", as: "ticket" });

  Users.belongsToMany(Reports, {
    through: UserReport,
    foreignKey: "userId",
    otherKey: "reportId",
    as: "reportsReceived",
  });
  Reports.belongsToMany(Users, {
    through: UserReport,
    foreignKey: "reportId",
    otherKey: "userId",
    as: "reportedUsers",
  });

  Reports.hasMany(UserReport, { foreignKey: "reportId", as: "userReports" });
  UserReport.belongsTo(Reports, { foreignKey: "reportId", as: "report" });
  UserReport.belongsTo(Users, { foreignKey: "userId", as: "user" });

  // =========================
  // ReputationVotes
  // =========================
  Users.hasMany(ReputationVotes, { foreignKey: "userId", as: "receivedVotes" });
  ReputationVotes.belongsTo(Users, { foreignKey: "userId", as: "target" });

  Tickets.hasMany(ReputationVotes, { foreignKey: "ticketId", as: "ticketVotes" });
  ReputationVotes.belongsTo(Tickets, { foreignKey: "ticketId", as: "ticket" });

  Users.belongsToMany(ReputationVotes, {
    through: UserReputationVote,
    foreignKey: "userId",
    otherKey: "reputationVoteId",
    as: "votes",
  });
  ReputationVotes.belongsToMany(Users, {
    through: UserReputationVote,
    foreignKey: "reputationVoteId",
    otherKey: "userId",
    as: "voters",
  });

  UserReputationVote.belongsTo(Users, { foreignKey: "userId", as: "user" });
  UserReputationVote.belongsTo(ReputationVotes, { foreignKey: "reputationVoteId", as: "vote" });
  ReputationVotes.hasMany(UserReputationVote, { foreignKey: "reputationVoteId", as: "castBy" });

  // =========================
  // UserRank
  // =========================
  Users.hasMany(UserRank, { foreignKey: "userId", as: "ranks" });
  UserRank.belongsTo(Users, { foreignKey: "userId", as: "user" });

  Games.hasMany(UserRank, { foreignKey: "gameId", as: "userRanks" });
  UserRank.belongsTo(Games, { foreignKey: "gameId", as: "game" });

  GameModes.hasMany(UserRank, { foreignKey: "gameModeId", as: "userModeRanks" });
  UserRank.belongsTo(GameModes, { foreignKey: "gameModeId", as: "mode" });

  LabelRanks.hasMany(UserRank, { foreignKey: "rankId", as: "userLabelRanks" });
  UserRank.belongsTo(LabelRanks, { foreignKey: "rankId", as: "labelRank" });

  return s.models;
}