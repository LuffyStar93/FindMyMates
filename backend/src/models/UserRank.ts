import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/db";

class UserRank extends Model<
  InferAttributes<UserRank>,
  InferCreationAttributes<UserRank>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare gameId: number;
  declare gameModeId: number;
  declare rankId: number;
}

UserRank.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "UserId",
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
    rankId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "RankId",
    },
  },
  {
    sequelize,
    tableName: "UserRank",
    modelName: "UserRank",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["UserId", "GameId", "GameModeId"],
        name: "uq_userrank_scope",
      },
    ],
  }
);

export default UserRank;