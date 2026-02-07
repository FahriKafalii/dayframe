CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MED', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('OPEN', 'DONE', 'CANCELED');--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"mood" smallint,
	"wins" text DEFAULT '' NOT NULL,
	"blockers" text DEFAULT '' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_user_id_date_unique" UNIQUE("user_id","date"),
	CONSTRAINT "journal_entries_mood_range" CHECK (mood is null or (mood >= 1 and mood <= 5))
);
--> statement-breakpoint
CREATE TABLE "task_journal_links" (
	"task_id" uuid NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	CONSTRAINT "task_journal_links_task_id_journal_entry_id_pk" PRIMARY KEY("task_id","journal_entry_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"status" "task_status" DEFAULT 'OPEN' NOT NULL,
	"priority" "task_priority" DEFAULT 'MED' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_journal_links" ADD CONSTRAINT "task_journal_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_journal_links" ADD CONSTRAINT "task_journal_links_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_entries_user_id_date_idx" ON "journal_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "task_journal_links_journal_entry_id_idx" ON "task_journal_links" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_id_status_idx" ON "tasks" USING btree ("user_id","status");