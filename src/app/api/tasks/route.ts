import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@/db";
import { taskService } from "@/services/taskService";
import { requireUserId } from "@/lib/auth";
import { parseBody, parseQuery } from "@/lib/validation";
import { json, errorResponse } from "@/lib/http";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MED", "HIGH"]).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const querySchema = z.object({
  status: z.enum(["OPEN", "DONE", "CANCELED"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
    const filters = parseQuery(request.nextUrl.searchParams, querySchema);
    const tasks = await taskService.list(userId, filters);
    return json(tasks);
  } catch (err) {
    return errorResponse(err);
  }
}
