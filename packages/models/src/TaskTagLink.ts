import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TaskTagLinkAttributes {
  task_id: string;
  tag_id: string;
  created_at: Date;
}

export type TaskTagLinkCreationAttributes = Omit<
  TaskTagLinkAttributes,
  "created_at"
>;

export class TaskTagLink
  extends Model<TaskTagLinkAttributes, TaskTagLinkCreationAttributes>
  implements TaskTagLinkAttributes
{
  declare task_id: string;
  declare tag_id: string;
  declare created_at: Date;
}

export function initTaskTagLink(sequelize: Sequelize): void {
  TaskTagLink.init(
    {
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "task_id",
      },
      tag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "tag_id",
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
      tableName: "task_tag_links",
      timestamps: false,
      underscored: true,
    },
  );
}
