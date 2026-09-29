import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { subtaskService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const createSchema = z.object({
  title: z.string().min(1).max(500),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const subtasks = await subtaskService.list(userId, id);
    return json(subtasks);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const body = await parseBody(request, createSchema);
    const subtask = await subtaskService.create(userId, id, body);
    return json(subtask, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
