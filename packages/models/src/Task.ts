import { DataTypes, Model, type Sequelize } from "sequelize";

export type TaskStatus = "OPEN" | "DONE" | "CANCELED";
export type TaskPriority = "LOW" | "MED" | "HIGH";

export interface TaskAttributes {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type TaskCreationAttributes = Omit<TaskAttributes, "created_at" | "updated_at">;

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare user_id: string;
  declare title: string;
  declare notes: string | null;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare due_date: string | null;
  declare completed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
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
    },
    {
      sequelize,
      tableName: "tasks",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
}
