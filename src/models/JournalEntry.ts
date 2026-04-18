import { DataTypes, Model, type Sequelize } from "sequelize";

export interface JournalEntryAttributes {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  wins: string;
  blockers: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type JournalEntryCreationAttributes = Omit<JournalEntryAttributes, "created_at" | "updated_at">;

export class JournalEntry
  extends Model<JournalEntryAttributes, JournalEntryCreationAttributes>
  implements JournalEntryAttributes
{
  declare id: string;
  declare user_id: string;
  declare date: string;
  declare mood: number | null;
  declare wins: string;
  declare blockers: string;
  declare notes: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initJournalEntry(sequelize: Sequelize): void {
  JournalEntry.init(
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      mood: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      wins: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      blockers: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "journal_entries",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
}
