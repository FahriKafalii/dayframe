import { type NextRequest } from "next/server";
import { z } from "zod";
import { initDb } from "@dayframe/db";
import { kasaAnalyticsService, kasaSeedService } from "@dayframe/services";
import {
  requireUserId,
  parseQuery,
  json,
  errorResponse,
} from "@dayframe/lib";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["expense", "income"]).optional(),
  locale: z.enum(["tr", "en"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const userId = requireUserId(request);
    await kasaSeedService.ensureSeeded(userId);
    const { from, to, type, locale } = parseQuery(
      request.nextUrl.searchParams,
      querySchema,
    );
    const data = await kasaAnalyticsService.breakdown(
      userId,
      from,
      to,
      type ?? "expense",
      locale ?? "tr",
    );
    return json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
