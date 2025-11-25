import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserReportAttributes {
  userId: number;
  reportId: number;
}

class UserReport extends Model<UserReportAttributes> implements UserReportAttributes {
  public userId!: number;
  public reportId!: number;
}

UserReport.init(
  {
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
    reportId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
  },
  { sequelize, tableName: "UserReport", timestamps: false }
);

export default UserReport;
