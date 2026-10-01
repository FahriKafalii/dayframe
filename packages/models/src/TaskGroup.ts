import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TaskGroupAttributes {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  color: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TaskGroupCreationAttributes = Omit<
  TaskGroupAttributes,
  "created_at" | "updated_at" | "deleted_at" | "color" | "position"
> & { color?: string | null; position?: number };

export class TaskGroup
  extends Model<TaskGroupAttributes, TaskGroupCreationAttributes>
  implements TaskGroupAttributes
{
  declare id: string;
  declare user_id: string;
  declare parent_id: string | null;
  declare name: string;
  declare color: string | null;
  declare position: number;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initTaskGroup(sequelize: Sequelize): void {
  TaskGroup.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
      parent_id: { type: DataTypes.UUID, allowNull: true, field: "parent_id" },
      name: { type: DataTypes.STRING(120), allowNull: false },
      color: { type: DataTypes.STRING(20), allowNull: true },
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
      deleted_at: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    },
    {
      sequelize,
      tableName: "task_groups",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
