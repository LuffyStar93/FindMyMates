import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface LabelRanksAttributes {
  idRanks: number;
  rankName: string;
  idGames: number;
}

type LabelRanksCreation = Optional<LabelRanksAttributes, "idRanks">;

export default class LabelRanks extends Model<LabelRanksAttributes, LabelRanksCreation> implements LabelRanksAttributes {
  public idRanks!: number;
  public rankName!: string;
  public idGames!: number;
}

LabelRanks.init(
  {
    idRanks: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_Ranks" },
    rankName: { type: DataTypes.STRING(100), allowNull: false, field: "rank_name" },
    idGames: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Games" },
  },
  { sequelize, tableName: "LabelRanks", timestamps: false }
);
