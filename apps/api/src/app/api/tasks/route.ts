import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { taskService } from "@dayframe/services";
import {
  requireUserId,
  parseBody,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MED", "HIGH"]).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  remind_at: z.string().datetime({ offset: true }).nullable().optional(),
  recurrence: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

const querySchema = z.object({
  status: z.enum(["OPEN", "DONE", "CANCELED"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tag_id: z.string().uuid().optional(),
  // A group id, or the literal "none" for ungrouped tasks.
  group_id: z.union([z.string().uuid(), z.literal("none")]).optional(),
  // "true" → return the trash (soft-deleted tasks) instead of the active list.
  deleted: z.enum(["true", "false"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const body = await parseBody(request, createSchema);
    const task = await taskService.create(userId, body);
    return json(task, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { deleted, ...filters } = parseQuery(
      request.nextUrl.searchParams,
      querySchema,
    );
    const tasks =
      deleted === "true"
        ? await taskService.listDeleted(userId)
        : await taskService.list(userId, filters);
    return json(tasks);
  } catch (err) {
    return errorResponse(err);
  }
}
