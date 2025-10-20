// src/models/init-models.ts
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

export default function initModels() {
  // 1:N Games -> GameModes
  Games.hasMany(GameModes, { foreignKey: "Id_Games", sourceKey: "idGames" });
  GameModes.belongsTo(Games, { foreignKey: "Id_Games", targetKey: "idGames" });

  // 1:N Users -> Tickets
  Users.hasMany(Tickets, { foreignKey: "Id_Users", sourceKey: "idUsers" });
  Tickets.belongsTo(Users, { foreignKey: "Id_Users", targetKey: "idUsers" });

  // 1:N GameModes -> Tickets
  GameModes.hasMany(Tickets, { foreignKey: "Id_GameModes", sourceKey: "idGameModes" });
  Tickets.belongsTo(GameModes, { foreignKey: "Id_GameModes", targetKey: "idGameModes" });

  // 1:N Users -> Reports
  Users.hasMany(Reports, { foreignKey: "Id_Users", sourceKey: "idUsers" });
  Reports.belongsTo(Users, { foreignKey: "Id_Users", targetKey: "idUsers" });

  // 1:N Tickets -> Reports
  Tickets.hasMany(Reports, { foreignKey: "Id_Tickets", sourceKey: "idTickets" });
  Reports.belongsTo(Tickets, { foreignKey: "Id_Tickets", targetKey: "idTickets" });

  // 1:N Users -> ReputationVotes
  Users.hasMany(ReputationVotes, { foreignKey: "Id_Users", sourceKey: "idUsers" });
  ReputationVotes.belongsTo(Users, { foreignKey: "Id_Users", targetKey: "idUsers" });

  // 1:N Tickets -> ReputationVotes
  Tickets.hasMany(ReputationVotes, { foreignKey: "Id_Tickets", sourceKey: "idTickets" });
  ReputationVotes.belongsTo(Tickets, { foreignKey: "Id_Tickets", targetKey: "idTickets" });

  // 1:N Games -> LabelRanks
  Games.hasMany(LabelRanks, { foreignKey: "Id_Games", sourceKey: "idGames" });
  LabelRanks.belongsTo(Games, { foreignKey: "Id_Games", targetKey: "idGames" });

  // N:M Users ↔ Tickets via UserTicket
  Users.belongsToMany(Tickets, { through: UserTicket, foreignKey: "Id_Users", otherKey: "Id_Tickets" });
  Tickets.belongsToMany(Users, { through: UserTicket, foreignKey: "Id_Tickets", otherKey: "Id_Users" });

  // N:M Users ↔ Reports via UserReport
  Users.belongsToMany(Reports, { through: UserReport, foreignKey: "Id_Users", otherKey: "Id_Reports" });
  Reports.belongsToMany(Users, { through: UserReport, foreignKey: "Id_Reports", otherKey: "Id_Users" });

  // N:M Users ↔ ReputationVotes via UserReputationVote
  Users.belongsToMany(ReputationVotes, { through: UserReputationVote, foreignKey: "Id_Users", otherKey: "Id_ReputationVotes" });
  ReputationVotes.belongsToMany(Users, { through: UserReputationVote, foreignKey: "Id_ReputationVotes", otherKey: "Id_Users" });

  // 3-way association: UserRank (Users, LabelRanks, GameModes)
  // On ne peut pas faire un belongsToMany standard à 3 clés : on expose plutôt les belongsTo
  UserRank.belongsTo(Users, { foreignKey: "Id_Users", targetKey: "idUsers" });
  UserRank.belongsTo(LabelRanks, { foreignKey: "Id_Ranks", targetKey: "idRanks" });
  UserRank.belongsTo(GameModes, { foreignKey: "Id_GameModes", targetKey: "idGameModes" });

  Users.hasMany(UserRank, { foreignKey: "Id_Users", sourceKey: "idUsers" });
  LabelRanks.hasMany(UserRank, { foreignKey: "Id_Ranks", sourceKey: "idRanks" });
  GameModes.hasMany(UserRank, { foreignKey: "Id_GameModes", sourceKey: "idGameModes" });

  return {
    sequelize,
    Users,
    Games,
    GameModes,
    Tickets,
    Reports,
    ReputationVotes,
    LabelRanks,
    UserRank,
    UserTicket,
    UserReputationVote,
    UserReport,
  };
}
