import { DataTypes, Model, type Sequelize } from "sequelize";

export type TaskStatus = "OPEN" | "DONE" | "CANCELED";
export type TaskPriority = "LOW" | "MED" | "HIGH";
export type TaskRecurrence = "daily" | "weekly" | "monthly";

export interface TaskAttributes {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number | null;
  remind_at: Date | null;
  recurrence: TaskRecurrence | null;
  group_id: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TaskCreationAttributes = Omit<
  TaskAttributes,
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "position"
  | "remind_at"
  | "recurrence"
  | "group_id"
> & {
  position?: number | null;
  remind_at?: Date | null;
  recurrence?: TaskRecurrence | null;
  group_id?: string | null;
};

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare user_id: string;
  declare title: string;
  declare notes: string | null;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare due_date: string | null;
  declare position: number | null;
  declare remind_at: Date | null;
  declare recurrence: TaskRecurrence | null;
  declare group_id: string | null;
  declare completed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initTask(sequelize: Sequelize): void {
  Task.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "OPEN",
      },
      priority: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "MED",
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "due_date",
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      remind_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "remind_at",
      },
      recurrence: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "group_id",
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
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
      tableName: "tasks",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
