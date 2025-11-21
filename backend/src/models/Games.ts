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
import GameModes from "./GameModes";
import LabelRanks from "./LabelRanks";
import Tickets from "./Tickets";

export default class Games extends Model<
  InferAttributes<Games, { omit: "modes" | "ranks" | "tickets" }>,
  InferCreationAttributes<Games>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare urlImage: string | null;

  // Associations (non persistées, alignées avec les alias `as:` utilisés dans les controllers)
  declare modes?: NonAttribute<GameModes[]>;
  declare ranks?: NonAttribute<LabelRanks[]>;
  declare tickets?: NonAttribute<Tickets[]>;

  declare static associations: {
    modes: Association<Games, GameModes>;
    ranks: Association<Games, LabelRanks>;
    tickets: Association<Games, Tickets>;
  };
}

Games.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: "Id" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    urlImage: { type: DataTypes.STRING(255), allowNull: true, field: "url_image" },
  },
  {
    sequelize,
    tableName: "Games",
    timestamps: false,
    indexes: [
      { fields: ["name"], name: "idx_games_name" },
    ],
  }
);