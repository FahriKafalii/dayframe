import { type Sequelize } from "sequelize";
import { User, initUser } from "./User";
import { Task, initTask } from "./Task";
import { JournalEntry, initJournalEntry } from "./JournalEntry";
import { TaskJournalLink, initTaskJournalLink } from "./TaskJournalLink";

export function registerModels(sequelize: Sequelize): void {
  initUser(sequelize);
  initTask(sequelize);
  initJournalEntry(sequelize);
  initTaskJournalLink(sequelize);

  User.hasMany(Task, { foreignKey: "user_id", as: "tasks" });
  Task.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(JournalEntry, { foreignKey: "user_id", as: "journalEntries" });
  JournalEntry.belongsTo(User, { foreignKey: "user_id", as: "user" });

  Task.belongsToMany(JournalEntry, {
    through: TaskJournalLink,
    foreignKey: "task_id",
    otherKey: "journal_entry_id",
    as: "journalEntries",
  });
  JournalEntry.belongsToMany(Task, {
    through: TaskJournalLink,
    foreignKey: "journal_entry_id",
    otherKey: "task_id",
    as: "tasks",
  });
}

export { User } from "./User";
export { Task } from "./Task";
export { JournalEntry } from "./JournalEntry";
export { TaskJournalLink } from "./TaskJournalLink";

export type { UserAttributes, UserCreationAttributes } from "./User";
export type { TaskAttributes, TaskCreationAttributes, TaskStatus, TaskPriority } from "./Task";
export type { JournalEntryAttributes, JournalEntryCreationAttributes } from "./JournalEntry";
export type { TaskJournalLinkAttributes } from "./TaskJournalLink";
