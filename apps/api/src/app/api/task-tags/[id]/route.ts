import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { taskTagService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const updateSchema = z
  .object({
    name: z.string().min(1).max(60).optional(),
    color: z.string().max(20).nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: "Nothing to update",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    const body = await parseBody(request, updateSchema);
    const tag = await taskTagService.update(userId, id, body);
    return json(tag);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await context.params;
    await taskTagService.remove(userId, id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
