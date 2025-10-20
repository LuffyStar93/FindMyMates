import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserRankAttributes {
  idUsers: number;
  idRanks: number;
  idGameModes: number;
}

export default class UserRank extends Model<UserRankAttributes> implements UserRankAttributes {
  public idUsers!: number;
  public idRanks!: number;
  public idGameModes!: number;
}

UserRank.init(
  {
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Users" },
    idRanks: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Ranks" },
    idGameModes: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_GameModes" },
  },
  { sequelize, tableName: "UserRank", timestamps: false }
);
