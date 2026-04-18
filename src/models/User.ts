import { DataTypes, Model, type Sequelize } from "sequelize";

export interface UserAttributes {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export type UserCreationAttributes = Omit<UserAttributes, "created_at">;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare password_hash: string;
  declare created_at: Date;
}

export function initUser(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "password_hash",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: false,
      underscored: true,
    },
  );
}
