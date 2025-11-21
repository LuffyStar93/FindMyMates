import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

export interface UserReputationVoteAttributes {
  userId: number;
  reputationVoteId: number;
}

class UserReputationVote extends Model<UserReputationVoteAttributes> implements UserReputationVoteAttributes {
  public userId!: number;
  public reputationVoteId!: number;
}

UserReputationVote.init(
  {
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true }, 
    reputationVoteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
  },
  { sequelize, tableName: "UserReputationVote", timestamps: false }
);

export default UserReputationVote;
