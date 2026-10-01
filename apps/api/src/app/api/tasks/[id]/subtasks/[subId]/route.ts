import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { subtaskService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const updateSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    done: z.boolean().optional(),
  })
  .refine((v) => v.title !== undefined || v.done !== undefined, {
    message: "Nothing to update",
  });

type RouteContext = { params: Promise<{ id: string; subId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id, subId } = await context.params;
    const body = await parseBody(request, updateSchema);
    const subtask = await subtaskService.update(userId, id, subId, body);
    return json(subtask);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id, subId } = await context.params;
    await subtaskService.remove(userId, id, subId);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
