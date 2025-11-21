import {
  Association,
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";
import sequelize from "../config/db";
import Games from "./Games";
import LabelRanks from "./LabelRanks";
import Tickets from "./Tickets";
import UserRank from "./UserRank";

export default class GameModes extends Model<
  // On omet les propriétés d'associations en camelCase
  InferAttributes<GameModes, { omit: "game" | "labelRanks" | "tickets" | "userRanks" }>,
  InferCreationAttributes<GameModes>
> {
  declare id: CreationOptional<number>;
  declare modeName: string;
  declare playersMax: number;
  declare gameId: number;
  declare isRanked: CreationOptional<boolean>;

  // Associations (non persistées)
  declare game?: NonAttribute<Games>;
  declare labelRanks?: NonAttribute<LabelRanks[]>;
  declare tickets?: NonAttribute<Tickets[]>;
  declare userRanks?: NonAttribute<UserRank[]>;

  declare static associations: {
    game: Association<GameModes, Games>;
    labelRanks: Association<GameModes, LabelRanks>;
    tickets: Association<GameModes, Tickets>;
    userRanks: Association<GameModes, UserRank>;
  };
}

GameModes.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: "Id" },
    modeName: { type: DataTypes.STRING(100), allowNull: false, field: "mode_name" },
    playersMax: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "players_max" },
    gameId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "GameId" },
    isRanked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "isRanked" },
  },
  {
    sequelize,
    tableName: "GameModes",
    timestamps: false,
    indexes: [
      { fields: ["GameId"], name: "idx_gamemodes_gameid" },
      { fields: ["GameId", "isRanked"], name: "idx_gamemodes_gameid_ranked" },
    ],
  }
);