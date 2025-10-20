import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface ReportsAttributes {
  idReports: number;
  description: string;
  createdAt: Date;
  files: string | null;
  readedAt: Date | null;
  idUsers: number;
  idTickets: number;
}

type ReportsCreation = Optional<ReportsAttributes, "idReports" | "files" | "readedAt" | "createdAt">;

export default class Reports extends Model<ReportsAttributes, ReportsCreation> implements ReportsAttributes {
  public idReports!: number;
  public description!: string;
  public createdAt!: Date;
  public files!: string | null;
  public readedAt!: Date | null;
  public idUsers!: number;
  public idTickets!: number;
}

Reports.init(
  {
    idReports: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_Reports" },
    description: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" },
    files: { type: DataTypes.STRING(255), allowNull: true },
    readedAt: { type: DataTypes.DATE, allowNull: true, field: "readed_at" },
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Users" },
    idTickets: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Tickets" },
  },
  { sequelize, tableName: "Reports", timestamps: false }
);
