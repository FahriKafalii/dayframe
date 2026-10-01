import { DataTypes, Model, type Sequelize } from "sequelize";

export interface SubtaskAttributes {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type SubtaskCreationAttributes = Omit<
  SubtaskAttributes,
  "created_at" | "updated_at" | "deleted_at"
>;

export class Subtask
  extends Model<SubtaskAttributes, SubtaskCreationAttributes>
  implements SubtaskAttributes
{
  declare id: string;
  declare task_id: string;
  declare user_id: string;
  declare title: string;
  declare done: boolean;
  declare position: number;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initSubtask(sequelize: Sequelize): void {
  Subtask.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "task_id",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "updated_at",
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      tableName: "subtasks",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
