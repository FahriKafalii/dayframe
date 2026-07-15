import { type Sequelize } from "sequelize";
import { User, initUser } from "./User";
import { Task, initTask } from "./Task";
import { JournalEntry, initJournalEntry } from "./JournalEntry";
import { TaskJournalLink, initTaskJournalLink } from "./TaskJournalLink";
import { Account, initAccount } from "./Account";
import { Category, initCategory } from "./Category";
import { Transaction, initTransaction } from "./Transaction";
import { Tag, initTag } from "./Tag";
import { TransactionTag, initTransactionTag } from "./TransactionTag";

export function registerModels(sequelize: Sequelize): void {
  initUser(sequelize);
  initTask(sequelize);
  initJournalEntry(sequelize);
  initTaskJournalLink(sequelize);
  initAccount(sequelize);
  initCategory(sequelize);
  initTransaction(sequelize);
  initTag(sequelize);
  initTransactionTag(sequelize);

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

  // ---- Kasa ----
  User.hasMany(Account, { foreignKey: "user_id", as: "accounts" });
  Account.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Category, { foreignKey: "user_id", as: "categories" });
  Category.belongsTo(User, { foreignKey: "user_id", as: "user" });
  Category.hasMany(Category, { foreignKey: "parent_id", as: "children" });
  Category.belongsTo(Category, { foreignKey: "parent_id", as: "parent" });

  User.hasMany(Tag, { foreignKey: "user_id", as: "tags" });
  Tag.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Transaction, { foreignKey: "user_id", as: "transactions" });
  Transaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

  Account.hasMany(Transaction, { foreignKey: "account_id", as: "transactions" });
  Transaction.belongsTo(Account, { foreignKey: "account_id", as: "account" });

  Category.hasMany(Transaction, { foreignKey: "category_id", as: "transactions" });
  Transaction.belongsTo(Category, { foreignKey: "category_id", as: "category" });

  Transaction.belongsToMany(Tag, {
    through: TransactionTag,
    foreignKey: "transaction_id",
    otherKey: "tag_id",
    as: "tags",
  });
  Tag.belongsToMany(Transaction, {
    through: TransactionTag,
    foreignKey: "tag_id",
    otherKey: "transaction_id",
    as: "transactions",
  });
}

export { User } from "./User";
export { Task } from "./Task";
export { JournalEntry } from "./JournalEntry";
export { TaskJournalLink } from "./TaskJournalLink";
export { Account } from "./Account";
export { Category } from "./Category";
export { Transaction } from "./Transaction";
export { Tag } from "./Tag";
export { TransactionTag } from "./TransactionTag";

export type { UserAttributes, UserCreationAttributes } from "./User";
export type { TaskAttributes, TaskCreationAttributes, TaskStatus, TaskPriority } from "./Task";
export type { JournalEntryAttributes, JournalEntryCreationAttributes } from "./JournalEntry";
export type { TaskJournalLinkAttributes } from "./TaskJournalLink";
export type {
  AccountAttributes,
  AccountCreationAttributes,
  AccountKind,
} from "./Account";
export type {
  CategoryAttributes,
  CategoryCreationAttributes,
  CategoryType,
  CategoryKindDefault,
  CategoryI18n,
} from "./Category";
export type {
  TransactionAttributes,
  TransactionCreationAttributes,
  TransactionType,
  TransactionStatus,
} from "./Transaction";
export type { TagAttributes, TagCreationAttributes } from "./Tag";
export type { TransactionTagAttributes } from "./TransactionTag";
