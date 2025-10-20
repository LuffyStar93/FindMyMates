import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface ReputationVotesAttributes {
  idReputationVotes: number;
  voteType: "up" | "down";
  createdAt: Date;
  idUsers: number;
  idTickets: number;
}

type ReputationVotesCreation = Optional<ReputationVotesAttributes, "idReputationVotes" | "createdAt">;

export default class ReputationVotes extends Model<ReputationVotesAttributes, ReputationVotesCreation>
  implements ReputationVotesAttributes {
  public idReputationVotes!: number;
  public voteType!: "up" | "down";
  public createdAt!: Date;
  public idUsers!: number;
  public idTickets!: number;
}

ReputationVotes.init(
  {
    idReputationVotes: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_ReputationVotes" },
    voteType: { type: DataTypes.ENUM("up", "down"), allowNull: false, field: "vote_type" },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Users" },
    idTickets: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Tickets" },
  },
  { sequelize, tableName: "ReputationVotes", timestamps: false }
);
