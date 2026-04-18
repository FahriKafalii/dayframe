import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TaskJournalLinkAttributes {
  task_id: string;
  journal_entry_id: string;
}

export class TaskJournalLink
  extends Model<TaskJournalLinkAttributes, TaskJournalLinkAttributes>
  implements TaskJournalLinkAttributes
{
  declare task_id: string;
  declare journal_entry_id: string;
}

export function initTaskJournalLink(sequelize: Sequelize): void {
  TaskJournalLink.init(
    {
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "task_id",
      },
      journal_entry_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "journal_entry_id",
      },
    },
    {
      sequelize,
      tableName: "task_journal_links",
      timestamps: false,
      underscored: true,
    },
  );
}
