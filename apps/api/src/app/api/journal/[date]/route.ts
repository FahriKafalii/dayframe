import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { journalService } from "@dayframe/services";
import {
  requireUserId,
  parseBody,
  json,
  errorResponse,
  AppError,
} from "@dayframe/lib";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const upsertSchema = z.object({
  mood: z.number().int().min(1).max(5).nullable().optional(),
  wins: z.string().optional(),
  blockers: z.string().optional(),
  notes: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ date: string }> };

function validateDate(date: string): string {
  if (!DATE_RE.test(date)) {
    throw new AppError("VALIDATION", "Date must be YYYY-MM-DD");
  }
  const parsed = new Date(date + "T00:00:00Z");
  if (isNaN(parsed.getTime())) {
    throw new AppError("VALIDATION", "Invalid date");
  }
  return date;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { date: rawDate } = await context.params;
    const date = validateDate(rawDate);
    const body = await parseBody(request, upsertSchema);
    const entry = await journalService.upsert(userId, date, body);
    return json(entry);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { date: rawDate } = await context.params;
    const date = validateDate(rawDate);
    const entry = await journalService.getByDate(userId, date);
    return json(entry);
  } catch (err) {
    return errorResponse(err);
  }
}
