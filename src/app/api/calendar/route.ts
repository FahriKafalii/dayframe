import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@/db";
import { calendarService } from "@/services/calendarService";
import { requireUserId } from "@/lib/auth";
import { parseQuery } from "@/lib/validation";
import { json, errorResponse } from "@/lib/http";

const querySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.from <= v.to, { message: "from must be <= to" });

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    const { from, to } = parseQuery(request.nextUrl.searchParams, querySchema);
    const days = await calendarService.getRange(userId, from, to);
    return json(days);
  } catch (err) {
    return errorResponse(err);
  }
}
