import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { taskService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const reorderSchema = z.object({
  // Full ordered list of task ids in their new order.
  ids: z.array(z.string().uuid()).min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { ids } = await parseBody(request, reorderSchema);
    await taskService.reorder(userId, ids);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
