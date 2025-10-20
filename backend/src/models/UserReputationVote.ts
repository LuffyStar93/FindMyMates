import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserReputationVoteAttributes {
  idUsers: number;
  idReputationVotes: number;
}

export default class UserReputationVote extends Model<UserReputationVoteAttributes>
  implements UserReputationVoteAttributes {
  public idUsers!: number;
  public idReputationVotes!: number;
}

UserReputationVote.init(
  {
    idUsers: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_Users" },
    idReputationVotes: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, field: "Id_ReputationVotes" },
  },
  { sequelize, tableName: "UserReputationVote", timestamps: false }
);
