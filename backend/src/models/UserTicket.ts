import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserTicketAttributes {
  idUsers: number;
  idTickets: number;
  joinedAt: Date;
}

export default class UserTicket extends Model<UserTicketAttributes> implements UserTicketAttributes {
  public idUsers!: number;
  public idTickets!: number;
  public joinedAt!: Date;
}

UserTicket.init(
  {
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Users" },
    idTickets: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Tickets" },
    joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "joined_at" },
  },
  { sequelize, tableName: "UserTicket", timestamps: false }
);
