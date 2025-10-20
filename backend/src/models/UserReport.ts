import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserReportAttributes {
  idUsers: number;
  idReports: number;
}

export default class UserReport extends Model<UserReportAttributes> implements UserReportAttributes {
  public idUsers!: number;
  public idReports!: number;
}

UserReport.init(
  {
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Users" },
    idReports: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Reports" },
  },
  { sequelize, tableName: "UserReport", timestamps: false }
);
