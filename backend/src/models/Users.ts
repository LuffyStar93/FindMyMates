import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export type UserRole = "User" | "Admin" | "Moderator";

export interface UsersAttributes {
  id: number;
  name: string;
  pseudo: string;
  email: string;
  role: UserRole;
  password: string;
  reputationScore: number | null;
  bannedAt: Date | null;
  discordTag: string | null;
}

export type UsersCreation = Optional<
  UsersAttributes,
  "id" | "role" | "reputationScore" | "bannedAt" | "discordTag"
>;

class Users extends Model<UsersAttributes, UsersCreation> implements UsersAttributes {
  public id!: number;
  public name!: string;
  public pseudo!: string;
  public email!: string;
  public role!: UserRole;
  public password!: string;
  public reputationScore!: number | null;
  public bannedAt!: Date | null;
  public discordTag!: string | null;
}

Users.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    pseudo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    role: { type: DataTypes.ENUM("User","Admin","Moderator"), allowNull: false, defaultValue: "User" },
    password: { type: DataTypes.STRING(255), allowNull: false },
    reputationScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "reputation_score" },
    bannedAt: { type: DataTypes.DATE, allowNull: true, field: "banned_at" },
    discordTag: { type: DataTypes.STRING(50), allowNull: true, field: "discord_tag" },
  },
  { sequelize, tableName: "Users", timestamps: false }
);

export default Users;