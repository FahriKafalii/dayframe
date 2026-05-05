import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { categoryService } from "@dayframe/services";
import { requireUserId, parseBody, json, errorResponse } from "@dayframe/lib";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    const body = await parseBody(request, updateSchema);
    const cat = await categoryService.update(id, userId, body);
    return json(categoryService.toDto(cat, "tr"));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { id } = await ctx.params;
    await categoryService.remove(id, userId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
