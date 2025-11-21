import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface UserTicketAttributes {
  userId: number;
  ticketId: number;
  joinedAt: Date;
}

type UserTicketCreation = Optional<UserTicketAttributes, "joinedAt">;

class UserTicket extends Model<UserTicketAttributes, UserTicketCreation>
  implements UserTicketAttributes {
  public userId!: number;
  public ticketId!: number;
  public joinedAt!: Date;
}

UserTicket.init(
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      field: "UserId",
    },
    ticketId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      field: "TicketId",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "joined_at",
    },
  },
  { sequelize, tableName: "UserTicket", timestamps: false }
);

export default UserTicket;
