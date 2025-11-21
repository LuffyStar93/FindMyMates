import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface ReputationVotesAttributes {
  id: number;
  voteType: "up" | "down";
  createdAt: Date;
  userId: number;
  ticketId: number;
}

type ReputationVotesCreation = Optional<ReputationVotesAttributes, "id" | "createdAt">;

class ReputationVotes
  extends Model<ReputationVotesAttributes, ReputationVotesCreation>
  implements ReputationVotesAttributes
{
  public id!: number;
  public voteType!: "up" | "down";
  public createdAt!: Date;
  public userId!: number;
  public ticketId!: number;
}

ReputationVotes.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    voteType: {
      type: DataTypes.ENUM("up", "down"),
      allowNull: false,
      field: "vote_type",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "UserId",
    },
    ticketId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "TicketId",
    },
  },
  {
    sequelize,
    tableName: "ReputationVotes",
    modelName: "ReputationVotes",
    timestamps: false,
    indexes: [
      { fields: ["UserId"] },
      { fields: ["TicketId"] },
      { fields: ["created_at"] },
      { fields: ["vote_type"] },
      { fields: ["TicketId", "UserId"] },
    ],
  }
);

export default ReputationVotes;