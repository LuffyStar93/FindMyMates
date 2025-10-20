import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface GameModesAttributes {
  idGameModes: number;
  modeName: string;
  playersMax: number;
  idGames: number;
}

type GameModesCreation = Optional<GameModesAttributes, "idGameModes">;

export default class GameModes extends Model<GameModesAttributes, GameModesCreation> implements GameModesAttributes {
  public idGameModes!: number;
  public modeName!: string;
  public playersMax!: number;
  public idGames!: number;
}

GameModes.init(
  {
    idGameModes: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: "Id_GameModes" },
    modeName: { type: DataTypes.STRING(100), allowNull: false, field: "mode_name" },
    playersMax: { type: DataTypes.INTEGER, allowNull: false, field: "players_max" },
    idGames: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "Id_Games" },
  },
  { sequelize, tableName: "GameModes", timestamps: false }
);
