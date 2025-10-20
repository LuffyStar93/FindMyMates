import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface UsersAttributes {
  idUsers: number;
  name: string;
  pseudo: string;
  email: string;
  reputationScore: number;
  bannedAt: Date | null;
}

type UsersCreation = Optional<UsersAttributes, "idUsers" | "reputationScore" | "bannedAt">;

export default class Users extends Model<UsersAttributes, UsersCreation> implements UsersAttributes {
  public idUsers!: number;
  public name!: string;
  public pseudo!: string;
  public email!: string;
  public reputationScore!: number;
  public bannedAt!: Date | null;
}

Users.init(
  {
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_Users" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    pseudo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    reputationScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "reputation_score" },
    bannedAt: { type: DataTypes.DATE, allowNull: true, field: "banned_at" },
  },
  { sequelize, tableName: "Users", timestamps: false }
);
