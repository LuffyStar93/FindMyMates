import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface GamesAttributes {
  idGames: number;
  name: string;
  urlImage: string | null;
}

type GamesCreation = Optional<GamesAttributes, "idGames" | "urlImage">;

export default class Games extends Model<GamesAttributes, GamesCreation> implements GamesAttributes {
  public idGames!: number;
  public name!: string;
  public urlImage!: string | null;
}

Games.init(
  {
    idGames: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_Games" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    urlImage: { type: DataTypes.STRING(255), allowNull: true, field: "url_image" },
  },
  { sequelize, tableName: "Games", timestamps: false }
);
