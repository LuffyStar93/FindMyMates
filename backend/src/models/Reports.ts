import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export type ReportStatus = "open" | "in_progress" | "closed";
export type ReportReason =
  | "Propos racistes"
  | "Homophobie/Transphobie"
  | "Menace"
  | "Insulte"
  | "Sexisme"
  | "Autres";

export interface ReportsAttributes {
  id: number;
  description: string;
  createdAt: Date;
  status: ReportStatus;
  reason: ReportReason;
  files: string | null;
  readedAt: Date | null;
  userId: number;
  ticketId: number;
}

type ReportsCreation = Optional<
  ReportsAttributes,
  "id" | "createdAt" | "status" | "reason" | "files" | "readedAt"
>;

class Reports
  extends Model<ReportsAttributes, ReportsCreation>
  implements ReportsAttributes
{
  public id!: number;
  public description!: string;
  public createdAt!: Date;
  public status!: ReportStatus;
  public reason!: ReportReason;
  public files!: string | null;
  public readedAt!: Date | null;
  public userId!: number;
  public ticketId!: number;
}

Reports.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    reason: {
      type: DataTypes.ENUM(
        "Propos racistes",
        "Homophobie/Transphobie",
        "Menace",
        "Insulte",
        "Sexisme",
        "Autres"
      ),
      allowNull: false,
      defaultValue: "Autres",
    },
    files: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    readedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "readed_at",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "UserId",
    },
    ticketId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "TicketId",
    },
  },
  {
    sequelize,
    tableName: "Reports",
    modelName: "Reports",
    timestamps: false,
    indexes: [
      { fields: ["UserId"] },
      { fields: ["TicketId"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
  }
);

export default Reports;