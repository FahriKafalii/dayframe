import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { taskService } from "@dayframe/services";
import {
  requireUserId,
  parseBody,
  json,
  errorResponse,
} from "@dayframe/lib";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["OPEN", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["LOW", "MED", "HIGH"]).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const task = await taskService.getById(userId, id);
    return json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const body = await parseBody(request, updateSchema);
    const task = await taskService.update(userId, id, body);
    return json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    await taskService.remove(userId, id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
