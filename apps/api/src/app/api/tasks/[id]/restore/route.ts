import { type NextRequest } from "next/server";
import { initDb } from "@dayframe/db";
import { taskService } from "@dayframe/services";
import { requireUserId, json, errorResponse } from "@dayframe/lib";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const task = await taskService.restore(userId, id);
    return json(task);
  } catch (err) {
    return errorResponse(err);
  }
}
