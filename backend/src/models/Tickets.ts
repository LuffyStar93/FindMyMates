import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface TicketsAttributes {
  id: number;
  status: "open" | "closed";
  createdAt: Date;
  endedAt: Date | null;
  isActive: boolean;
  nbPlayers: number;
  capacity: number;
  gameModeId: number;
  userId: number;     
}

type TicketsCreation = Optional<
  TicketsAttributes,
  "id" | "createdAt" | "endedAt" | "isActive" | "nbPlayers"
>;

class Tickets extends Model<TicketsAttributes, TicketsCreation>
  implements TicketsAttributes
{
  public id!: number;
  public status!: "open" | "closed";
  public createdAt!: Date;
  public endedAt!: Date | null;
  public isActive!: boolean;
  public nbPlayers!: number;
  public capacity!: number;
  public gameModeId!: number;
  public userId!: number;
}

Tickets.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "ended_at",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "isActive",
    },
    nbPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "nb_players",
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    gameModeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "GameModeId",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "UserId",
    },
  },
  {
    sequelize,
    tableName: "Tickets",
    modelName: "Tickets",
    timestamps: false,
    indexes: [
      { fields: ["UserId"] },
      { fields: ["GameModeId"] },
      { fields: ["status"] },
      { fields: ["isActive"] },
      { fields: ["created_at"] },
      { fields: ["status", "isActive", "created_at"] },
    ],
  }
);

export default Tickets;