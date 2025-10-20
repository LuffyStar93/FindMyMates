import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface TicketsAttributes {
  idTickets: number;
  status: string;
  createdAt: Date;
  endedAt: Date | null;
  isActive: boolean | null;
  nbPlayers: number;
  idGameModes: number;
  idUsers: number;
}

type TicketsCreation = Optional<TicketsAttributes, "idTickets" | "endedAt" | "isActive" | "nbPlayers" | "createdAt">;

export default class Tickets extends Model<TicketsAttributes, TicketsCreation> implements TicketsAttributes {
  public idTickets!: number;
  public status!: string;
  public createdAt!: Date;
  public endedAt!: Date | null;
  public isActive!: boolean | null;
  public nbPlayers!: number;
  public idGameModes!: number;
  public idUsers!: number;
}

Tickets.init(
  {
    idTickets: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_Tickets" },
    status: { type: DataTypes.STRING(50), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    endedAt: { type: DataTypes.DATE, allowNull: true, field: "ended_at" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true, field: "isActive" },
    nbPlayers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "nb_players" },
    idGameModes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_GameModes" },
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Users" },
  },
  { sequelize, tableName: "Tickets", timestamps: false }
);
