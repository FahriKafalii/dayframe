import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { categoryService, kasaSeedService } from "@dayframe/services";
import {
  requireUserId,
  parseBody,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const createSchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  type: z.enum(["income", "expense", "transfer", "saving"]),
  name: z.string().trim().min(1).max(80),
  emoji: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
});

const querySchema = z.object({
  type: z.enum(["income", "expense", "transfer", "saving"]).optional(),
  shape: z.enum(["flat", "tree"]).optional(),
  locale: z.enum(["tr", "en"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const { type, shape, locale } = parseQuery(request.nextUrl.searchParams, querySchema);
    const lc = locale ?? "tr";
    const data =
      shape === "flat"
        ? await categoryService.listFlat(userId, lc, type)
        : await categoryService.listTree(userId, lc, type);
    return json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const body = await parseBody(request, createSchema);
    const cat = await categoryService.create(userId, body);
    return json(categoryService.toDto(cat, "tr"), 201);
  } catch (err) {
    return errorResponse(err);
  }
}
