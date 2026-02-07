import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  date,
  smallint,
  unique,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";

// Postgres enums (DB-level)
export const taskStatus = pgEnum("task_status", ["OPEN", "DONE", "CANCELED"]);
export const taskPriority = pgEnum("task_priority", ["LOW", "MED", "HIGH"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    notes: text("notes"),

    status: taskStatus("status").notNull().default("OPEN"),
    priority: taskPriority("priority").notNull().default("MED"),

    dueDate: date("due_date", { mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_user_id_due_date_idx").on(table.userId, table.dueDate),
    index("tasks_user_id_status_idx").on(table.userId, table.status),
  ]
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    date: date("date", { mode: "date" }).notNull(),
    mood: smallint("mood"),

    wins: text("wins").notNull().default(""),
    blockers: text("blockers").notNull().default(""),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("journal_entries_user_id_date_unique").on(table.userId, table.date),
    index("journal_entries_user_id_date_idx").on(table.userId, table.date),
    check("journal_entries_mood_range", sql`mood is null or (mood >= 1 and mood <= 5)`),
  ]
);

export const taskJournalLinks = pgTable(
  "task_journal_links",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    journalEntryId: uuid("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.journalEntryId] }),
    index("task_journal_links_journal_entry_id_idx").on(table.journalEntryId),
  ]
);

// Inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type TaskJournalLink = typeof taskJournalLinks.$inferSelect;
export type NewTaskJournalLink = typeof taskJournalLinks.$inferInsert;
