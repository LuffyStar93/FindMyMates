import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from "sequelize";
import sequelize from "../config/db";

export interface LabelRanksAttributes {
  id: number;
  rankName: string;
  gameId: number;
  gameModeId: number;
}

type LabelRanksCreationAttributes = Optional<LabelRanksAttributes, "id">;

class LabelRanks
  extends Model<
    InferAttributes<LabelRanks>,
    InferCreationAttributes<LabelRanks>
  >
  implements LabelRanksAttributes
{
  public id!: number;
  public rankName!: string;
  public gameId!: number;
  public gameModeId!: number;
}

LabelRanks.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    rankName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "rank_name",
    },
    gameId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "GameId",
    },
    gameModeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "GameModeId",
    },
  },
  {
    sequelize,
    tableName: "LabelRanks",
    modelName: "LabelRanks",
    timestamps: false,
    indexes: [
      // Empêche les doublons d’un même rang dans le même mode
      {
        unique: true,
        fields: ["GameId", "GameModeId", "rank_name"],
        name: "uq_rank_per_mode",
      },
    ],
  }
);

export default LabelRanks;