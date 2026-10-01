import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TaskTagAttributes {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TaskTagCreationAttributes = Omit<
  TaskTagAttributes,
  "created_at" | "updated_at" | "deleted_at" | "color"
> & { color?: string | null };

export class TaskTag
  extends Model<TaskTagAttributes, TaskTagCreationAttributes>
  implements TaskTagAttributes
{
  declare id: string;
  declare user_id: string;
  declare name: string;
  declare color: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initTaskTag(sequelize: Sequelize): void {
  TaskTag.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
      name: { type: DataTypes.STRING(60), allowNull: false },
      color: { type: DataTypes.STRING(20), allowNull: true },
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
      tableName: "task_tags",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
